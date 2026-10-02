// supabase/functions/payment-webhook/index.ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

Deno.serve(async (req: Request) => {
  const contentType = req.headers.get("content-type") ?? "";
  let transferId: string | null = null;
  let verifiedSuccess = false;

  if (contentType.includes("json")) {
    // MTN shape
    const body = await req.json();
    const referenceId = body.referenceId ?? body.externalId;
    if (!referenceId) return new Response("OK", { status: 200 });

    // Re-fetch real status from MTN — don't trust the webhook body
    const status = await getMtnStatus(referenceId);
    verifiedSuccess = status.status === "SUCCESSFUL";
    transferId = status.externalId ?? null;
  } else {
    // CinetPay shape — their notify has no status at all, must re-check
    const form = await req.formData();
    const transId = form.get("cpm_trans_id")?.toString();
    if (!transId) return new Response("OK", { status: 200 });

    const status = await getCinetPayStatus(transId);
    verifiedSuccess = status.status === "ACCEPTED";
    transferId = transId;
  }

  if (!transferId) return new Response("OK", { status: 200 });

  // Idempotency guard — webhooks can fire more than once
  const { data: transfer } = await supabase
    .from("transfers").select("status").eq("id", transferId).single();

  if (!transfer || transfer.status !== "pending_verification") {
    return new Response("OK", { status: 200 }); // already handled, ignore
  }

  if (verifiedSuccess) {
    await supabase.from("transfers").update({ status: "confirmed" }).eq("id", transferId);

    await fetch(`${SUPABASE_URL}/functions/v1/trigger-payout`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ transferId }),
    });
  } else {
    await supabase.from("transfers").update({ status: "failed" }).eq("id", transferId);
  }

  return new Response("OK", { status: 200 });
});

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
    headers: {
      Authorization: `Bearer ${access_token}`,
      "X-Target-Environment": Deno.env.get("MTN_MOMO_TARGET_ENV") ?? "sandbox",
      "Ocp-Apim-Subscription-Key": subKey,
    },
  });
  return res.json(); // { status, externalId, amount, ... }
}

async function getCinetPayStatus(transId: string) {
  const res = await fetch("https://api-checkout.cinetpay.com/v2/payment/check", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      apikey: Deno.env.get("CINETPAY_APIKEY"),
      site_id: Deno.env.get("CINETPAY_SITE_ID"),
      transaction_id: transId,
    }),
  });
  const data = await res.json();
  return { status: data.data?.status }; // "ACCEPTED" | "REFUSED" | etc, per their docs
}