// supabase/functions/initiate-transfer/index.ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const body = await req.json();
  const {
    senderId, recipientId, recipientName, recipientPhone, payerPhone,
    fromCountry, toCountry, network, amountSent, fee, rateUsed, amountReceived,
  } = body;

  // 1. Create the transfer row first
  const { data: transfer, error: insertErr } = await supabase
    .from("transfers")
    .insert({
      sender_id: senderId,
      recipient_id: recipientId,
      recipient_name: recipientName,
      recipient_phone: recipientPhone,
      from_country: fromCountry,
      to_country: toCountry,
      network,
      amount_sent: amountSent,
      fee,
      rate_used: rateUsed,
      amount_received: amountReceived,
      status: "pending_verification", // still "collecting" in effect — see note below
    })
    .select()
    .single();

  if (insertErr || !transfer) {
    return json({ error: "Could not create transfer" }, 500);
  }

  // 2. Trigger the push, per source country
  try {
    if (fromCountry === "GH") {
      await initiateMtnCollection(transfer.id, amountSent, payerPhone);
    }  else if (fromCountry === "TG") {
      await initiatePayDunyaCollection(transfer.id, amountSent, payerPhone, network);
    } else {
      throw new Error(`No collection integration for from_country=${fromCountry}`);
    }
  } catch (err) {
    await supabase.from("transfers").update({ status: "failed" }).eq("id", transfer.id);
    return json({ error: String(err) }, 502);
  }

  return json({ transferId: transfer.id });
});

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status, headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

async function initiateMtnCollection(transferId: string, amount: number, payerPhone: string) {
  const baseUrl = Deno.env.get("MTN_MOMO_BASE_URL")!;
  const subKey = Deno.env.get("MTN_MOMO_COLLECTION_SUBSCRIPTION_KEY")!;
  const apiUser = Deno.env.get("MTN_MOMO_COLLECTION_API_USER")!;
  const apiKey = Deno.env.get("MTN_MOMO_COLLECTION_API_KEY")!;

  const tokenRes = await fetch(`${baseUrl}/collection/token/`, {
    method: "POST",
    headers: { Authorization: `Basic ${btoa(`${apiUser}:${apiKey}`)}`, "Ocp-Apim-Subscription-Key": subKey },
  });
  const { access_token } = await tokenRes.json();

  const referenceId = crypto.randomUUID();

  const payRes = await fetch(`${baseUrl}/collection/v1_0/requesttopay`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${access_token}`,
      "X-Reference-Id": referenceId,
      "X-Target-Environment": Deno.env.get("MTN_MOMO_TARGET_ENV") ?? "sandbox",
      "Ocp-Apim-Subscription-Key": subKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: amount.toString(),
      currency: "EUR", // sandbox only — swap to GHS in production
      externalId: transferId,
      payer: { partyIdType: "MSISDN", partyId: payerPhone.replace(/^\+/, "").replace(/\s/g, "") },
      payerMessage: "OtiPay transfer",
      payeeNote: "OtiPay transfer",
    }),
  });

  if (payRes.status !== 202) throw new Error(`MTN requesttopay failed: ${payRes.status} ${await payRes.text()}`);

  // Store MTN's reference so the webhook (which carries this same id) can find the transfer
  await supabase.from("transfers").update({ collection_reference: referenceId }).eq("id", transferId);
}

async function initiatePayDunyaCollection(transferId: string, amount: number, payerPhone: string, network: string) {
  const headers = {
    "Content-Type": "application/json",
    "PAYDUNYA-MASTER-KEY": Deno.env.get("PAYDUNYA_MASTER_KEY")!,
    "PAYDUNYA-PRIVATE-KEY": Deno.env.get("PAYDUNYA_PRIVATE_KEY")!,
    "PAYDUNYA-TOKEN": Deno.env.get("PAYDUNYA_TOKEN")!,
  };

  // Step 1: create the invoice
  const invoiceRes = await fetch("https://app.paydunya.com/api/v1/checkout-invoice/create", {
    method: "POST",
    headers,
    body: JSON.stringify({
      invoice: { total_amount: amount, description: "OtiPay transfer" },
      store: { name: "OtiPay" },
    }),
  });
  const invoiceData = await invoiceRes.json();
  if (invoiceData.response_code !== "00") {
    throw new Error(`PayDunya invoice creation failed: ${JSON.stringify(invoiceData)}`);
  }
  const invoiceToken = invoiceData.token;

  // Step 2: push to the specific wallet
  // ⚠️ CONFIRM: "moov-togo" is the confirmed disbursement withdraw_mode slug,
  // but I haven't seen the matching SOFTPAY endpoint for Flooz explicitly —
  // only t-money-togo is confirmed at /api/v1/softpay/t-money-togo.
  // Test the Flooz side first before trusting this path blindly.
  const softpayPath = network === "flooz" ? "moov-togo" : "t-money-togo";

  const payRes = await fetch(`https://app.paydunya.com/api/v1/softpay/${softpayPath}`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      t_money_phone_number: payerPhone, // field name confirmed for t-money; verify for moov-togo once tested
      invoice_token: invoiceToken,
      customer_name: "OtiPay Customer",
      customer_email: "noreply@otipay.app", // placeholder — PayDunya may require a real-looking one
    }),
  });
  const payData = await payRes.json();
  if (payData.response_code !== "00") {
    throw new Error(`PayDunya softpay push failed: ${JSON.stringify(payData)}`);
  }

  await supabase.from("transfers").update({ collection_reference: invoiceToken }).eq("id", transferId);
  return invoiceToken;
}