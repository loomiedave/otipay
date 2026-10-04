// supabase/functions/payment-webhook/index.ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

Deno.serve(async (req: Request) => {
  const contentType = req.headers.get("content-type") ?? "";

  if (contentType.includes("json")) {
    // MTN shape
    const body = await req.json();
    console.log("MTN WEBHOOK:", JSON.stringify(body));
    const transferId = body.externalId;
    if (!transferId) return new Response("OK", { status: 200 });

    const { data: t } = await supabase
      .from("transfers").select("collection_reference").eq("id", transferId).single();
    if (!t?.collection_reference) return new Response("OK", { status: 200 });

    const status = await getMtnStatus(t.collection_reference);
    console.log("MTN STATUS:", JSON.stringify(status));
    if (status.status === "PENDING") return new Response("OK", { status: 200 });

    await finalizeCollection(transferId, status.status === "SUCCESSFUL");
    return new Response("OK", { status: 200 });
  }

  // PayDunya shape — form-urlencoded, bracket-notation keys, confirmed from a real test payload
  const form = await req.formData();
  const raw = Object.fromEntries(form.entries());
  console.log("RAW PAYDUNYA WEBHOOK:", JSON.stringify(raw));

  const invoiceToken = form.get("data[invoice][token]")?.toString();
  const reportedStatus = form.get("data[status]")?.toString(); // "completed" | "failed" | "cancelled"
  if (!invoiceToken) return new Response("OK", { status: 200 });

  // Don't trust the webhook body alone — re-verify against PayDunya directly,
  // same principle as the MTN branch re-querying getMtnStatus.
  const confirmed = await getPayDunyaStatus(invoiceToken);
  console.log("PAYDUNYA CONFIRM STATUS:", JSON.stringify(confirmed));

  // Look up the transfer by collection_reference, since PayDunya echoes back
  // ITS OWN invoice token, not our transferId (unlike MTN's externalId).
  const { data: transfer } = await supabase
    .from("transfers")
    .select("id")
    .eq("collection_reference", invoiceToken)
    .single();

  if (!transfer) return new Response("OK", { status: 200 });

  if (confirmed.status === "pending") return new Response("OK", { status: 200 });

  await finalizeCollection(transfer.id, confirmed.status === "completed");
  return new Response("OK", { status: 200 });
});

async function finalizeCollection(transferId: string, verifiedSuccess: boolean) {
  const { data: transfer } = await supabase.from("transfers").select("status").eq("id", transferId).single();
  if (!transfer || transfer.status !== "pending_verification") return; // already handled, ignore (idempotency)

  if (verifiedSuccess) {
    await supabase.from("transfers").update({ status: "confirmed" }).eq("id", transferId);
    await fetch(`${SUPABASE_URL}/functions/v1/trigger-payout`, {
      method: "POST",
      headers: { Authorization: `Bearer ${SERVICE_ROLE_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ transferId }),
    });
  } else {
    await supabase.from("transfers").update({ status: "failed" }).eq("id", transferId);
  }
}

async function getMtnStatus(referenceId: string) {
  const baseUrl = Deno.env.get("MTN_MOMO_BASE_URL")!;
  const subKey = Deno.env.get("MTN_MOMO_COLLECTION_SUBSCRIPTION_KEY")!;
  const apiUser = Deno.env.get("MTN_MOMO_COLLECTION_API_USER")!;
  const apiKey = Deno.env.get("MTN_MOMO_COLLECTION_API_KEY")!;

  const tokenRes = await fetch(`${baseUrl}/collection/token/`, {
    method: "POST",
    headers: { Authorization: `Basic ${btoa(`${apiUser}:${apiKey}`)}`, "Ocp-Apim-Subscription-Key": subKey },
  });
  const { access_token } = await tokenRes.json();

  const res = await fetch(`${baseUrl}/collection/v1_0/requesttopay/${referenceId}`, {
    headers: { Authorization: `Bearer ${access_token}`, "X-Target-Environment": Deno.env.get("MTN_MOMO_TARGET_ENV") ?? "sandbox", "Ocp-Apim-Subscription-Key": subKey },
  });
  return res.json();
}

async function getPayDunyaStatus(invoiceToken: string) {
  const base = Deno.env.get("PAYDUNYA_API_HOST") ?? "sandbox-api";
  const res = await fetch(`https://app.paydunya.com/${base}/v1/checkout-invoice/confirm/${invoiceToken}`, {
    headers: {
      "PAYDUNYA-MASTER-KEY": Deno.env.get("PAYDUNYA_MASTER_KEY")!,
      "PAYDUNYA-PRIVATE-KEY": Deno.env.get("PAYDUNYA_PRIVATE_KEY")!,
      "PAYDUNYA-TOKEN": Deno.env.get("PAYDUNYA_TOKEN")!,
    },
  });
  const data = await res.json();
  return { status: data.status }; // "completed" | "pending" | "cancelled"
}
