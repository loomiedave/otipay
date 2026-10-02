// supabase/functions/trigger-payout/index.ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

Deno.serve(async (req: Request) => {
  const { transferId } = await req.json();

  const { data: transfer } = await supabase.from("transfers").select("*").eq("id", transferId).single();
  if (!transfer || transfer.status !== "confirmed") {
    return new Response(JSON.stringify({ error: "Transfer not in confirmed state" }), { status: 409 });
  }

  let result;
  if (transfer.to_country === "GH") {
    result = await payoutMtnMomo(transfer);
  } else if (transfer.to_country === "TG") {
    result = await payoutPayDunya(transfer);
  } else {
    result = { success: false, error: `No payout for ${transfer.to_country}` };
  }

  await supabase.from("transfers").update({
    status: result.success ? "paid_out" : "failed",
    payout_reference: result.success ? result.reference : `ERROR: ${result.error}`,
  }).eq("id", transferId);

  return new Response(JSON.stringify(result), { status: result.success ? 200 : 502 });
});

function normalizePhone(phone: string): string {
  return phone.replace(/^\+/, "").replace(/\s/g, "");
}

async function payoutMtnMomo(transfer: any) {
  const baseUrl = Deno.env.get("MTN_MOMO_BASE_URL")!;
  const subscriptionKey = Deno.env.get("MTN_MOMO_SUBSCRIPTION_KEY")!;
  const targetEnv = Deno.env.get("MTN_MOMO_TARGET_ENV") ?? "sandbox";
  const apiUser = Deno.env.get("MTN_MOMO_API_USER")!;
  const apiKey = Deno.env.get("MTN_MOMO_API_KEY")!;

  const tokenRes = await fetch(`${baseUrl}/disbursement/token/`, {
    method: "POST",
    headers: { Authorization: `Basic ${btoa(`${apiUser}:${apiKey}`)}`, "Ocp-Apim-Subscription-Key": subscriptionKey },
  });
  const { access_token } = await tokenRes.json();
  const referenceId = crypto.randomUUID();

  const res = await fetch(`${baseUrl}/disbursement/v1_0/deposit`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${access_token}`,
      "X-Reference-Id": referenceId,
      "X-Target-Environment": targetEnv,
      "Ocp-Apim-Subscription-Key": subscriptionKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: transfer.amount_received.toString(),
      currency: "EUR", // sandbox — swap to GHS in production
      externalId: transfer.id,
      payee: { partyIdType: "MSISDN", partyId: normalizePhone(transfer.recipient_phone) },
      payerMessage: "OtiPay transfer",
      payeeNote: "OtiPay transfer",
    }),
  });

  if (res.status !== 202) {
    return { success: false, error: `MTN deposit request failed: ${res.status} ${await res.text()}` };
  }

  for (let i = 0; i < 5; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    const statusRes = await fetch(`${baseUrl}/disbursement/v1_0/deposit/${referenceId}`, {
      headers: { Authorization: `Bearer ${access_token}`, "X-Target-Environment": targetEnv, "Ocp-Apim-Subscription-Key": subscriptionKey },
    });
    if (statusRes.ok) {
      const data = await statusRes.json();
      if (data.status === "SUCCESSFUL") return { success: true, reference: referenceId };
      if (data.status === "FAILED") return { success: false, error: `MTN payout failed: ${data.reason ?? ""}` };
    }
  }
  return { success: false, error: "MTN payout timed out" };
}

async function payoutPayDunya(transfer: any) {
  const headers = {
    "Content-Type": "application/json",
    "PAYDUNYA-MASTER-KEY": Deno.env.get("PAYDUNYA_MASTER_KEY")!,
    "PAYDUNYA-PRIVATE-KEY": Deno.env.get("PAYDUNYA_PRIVATE_KEY")!,
    "PAYDUNYA-TOKEN": Deno.env.get("PAYDUNYA_TOKEN")!,
  };
  const withdrawMode = transfer.network === "flooz" ? "moov-togo" : "t-money-togo";

  try {
    const invoiceRes = await fetch("https://app.paydunya.com/api/v2/disburse/get-invoice", {
      method: "POST",
      headers,
      body: JSON.stringify({
        account_alias: normalizePhone(transfer.recipient_phone),
        amount: Math.round(transfer.amount_received),
        withdraw_mode: withdrawMode,
        callback_url: Deno.env.get("PAYDUNYA_PAYOUT_CALLBACK_URL"),
      }),
    });
    const invoiceData = await invoiceRes.json();
    if (invoiceData.response_code !== "00" && !invoiceData.token) {
      return { success: false, error: `PayDunya get-invoice failed: ${JSON.stringify(invoiceData)}` };
    }

    const submitRes = await fetch("https://app.paydunya.com/api/v2/disburse/submit-invoice", {
      method: "POST",
      headers,
      body: JSON.stringify({ disburse_invoice: invoiceData.token }),
    });
    const submitData = await submitRes.json();

    if (submitData.response_code === "00") {
      return { success: true, reference: invoiceData.token };
    }
    return { success: false, error: `PayDunya submit failed: ${JSON.stringify(submitData)}` };
  } catch (err) {
    return { success: false, error: `PayDunya payout threw: ${String(err)}` };
  }
}