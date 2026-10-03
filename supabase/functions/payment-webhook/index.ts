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

  // PayDunya is form-urlencoded — log raw shape first, don't parse blind
  const form = await req.formData();
  const raw = Object.fromEntries(form.entries());
  console.log("RAW PAYDUNYA WEBHOOK:", JSON.stringify(raw));
  // TODO: once you've seen one real payload in `supabase functions logs payment-webhook`,
  // extract transferId + status from the real field names and call finalizeCollection()
  // the same way the MTN branch does above.

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