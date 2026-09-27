// supabase/functions/verify-and-payout/index.ts
//
// Called by the Next.js admin screen when an admin taps "Confirm" on a
// pending_verification transfer. Flow:
//   1. Load the transfer, assert it's pending_verification
//   2. Sanity-check the collection_reference
//   3. Flip status -> confirmed, stamp reviewed_by / reviewed_at
//   4. Call the payout API for the destination country/network
//        - to_country = GH  -> MTN MoMo Disbursement API
//        - to_country = TG  -> CinetPay Transfer API (best-guess params,
//          their docs were down when this was written -- see the
//          CINETPAY SECTION comment below, verify once docs are back)
//   5. On success: status -> paid_out, store payout_reference
//   6. On failure: status -> failed, stash the error in payout_reference
//      prefixed with "ERROR:" since there's no failure_reason column yet.
//      (Worth adding a real column later -- flagging here rather than
//      silently working around it.)
//
// Deploy:  supabase functions deploy verify-and-payout
// Invoke:  supabase.functions.invoke('verify-and-payout', { body: { transferId } })
//
// Required env vars (set via `supabase secrets set`):
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
//   MTN_MOMO_SUBSCRIPTION_KEY, MTN_MOMO_API_USER, MTN_MOMO_API_KEY,
//   MTN_MOMO_TARGET_ENV (sandbox|production), MTN_MOMO_BASE_URL
//   CINETPAY_APIKEY, CINETPAY_PASSWORD, CINETPAY_BASE_URL

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// When DEMO_MODE=true, skip the real MTN/CinetPay calls entirely and just
// simulate a successful payout after a short pause. Use this to demo the
// full flow before you have real API credentials. Set it back to "false"
// (or remove the secret) once you're ready to go live.
const DEMO_MODE = (Deno.env.get("DEMO_MODE") ?? "false") === "true";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Transfer {
  id: string;
  sender_id: string;
  recipient_name: string;
  recipient_phone: string;
  from_country: string;
  to_country: string;
  amount_sent: number;
  rate_used: number;
  amount_received: number;
  status: string;
  fee: number;
  recipient_id: string | null;
  network: "mtn" | "flooz" | "tmoney" | null;
  collection_reference: string | null;
  payout_reference: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
}

interface PayoutResult {
  success: boolean;
  reference?: string;
  error?: string;
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
     return new Response("ok", { headers: corsHeaders });
   }

   if (req.method !== "POST") {
     return json({ error: "Method not allowed" }, 405);
   }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return json({ error: "Missing Authorization header" }, 401);
    }

    const { transferId, reviewerId } = await req.json();
    if (!transferId || !reviewerId) {
      return json({ error: "transferId and reviewerId are required" }, 400);
    }

    // 1. Load transfer
    const { data: transfer, error: fetchErr } = await supabase
      .from("transfers")
      .select("*")
      .eq("id", transferId)
      .single<Transfer>();

    if (fetchErr || !transfer) {
      return json({ error: "Transfer not found" }, 404);
    }

    if (transfer.status !== "pending_verification") {
      return json(
        { error: `Transfer is '${transfer.status}', not pending_verification` },
        409,
      );
    }

    // 2. Sanity-check collection_reference
    const refCheck = validateCollectionReference(transfer);
    if (!refCheck.ok) {
      await markFailed(transfer.id, `ERROR: ${refCheck.reason}`);
      return json({ error: refCheck.reason }, 422);
    }

    // 3. Mark confirmed
    const { error: confirmErr } = await supabase
      .from("transfers")
      .update({
        status: "confirmed",
        reviewed_by: reviewerId,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", transfer.id);

    if (confirmErr) {
      return json({ error: "Failed to mark confirmed", detail: confirmErr.message }, 500);
    }

    // 4. Call payout API for destination country
    let payoutResult: PayoutResult;
    if (transfer.to_country === "GH") {
      payoutResult = await payoutMtnMomo(transfer);
    } else if (transfer.to_country === "TG") {
      payoutResult = await payoutCinetPay(transfer);
    } else {
      payoutResult = {
        success: false,
        error: `No payout integration for to_country=${transfer.to_country}`,
      };
    }

    // 5/6. Update final status
    if (payoutResult.success) {
      await supabase
        .from("transfers")
        .update({
          status: "paid_out",
          payout_reference: payoutResult.reference ?? null,
        })
        .eq("id", transfer.id);

      return json({ success: true, status: "paid_out", reference: payoutResult.reference });
    } else {
      await markFailed(transfer.id, `ERROR: ${payoutResult.error}`);
      return json({ success: false, status: "failed", error: payoutResult.error }, 502);
    }
  } catch (err) {
    console.error("verify-and-payout unhandled error:", err);
    return json({ error: "Internal error", detail: String(err) }, 500);
  }
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

async function markFailed(transferId: string, reason: string) {
  await supabase
    .from("transfers")
    .update({ status: "failed", payout_reference: reason.slice(0, 500) })
    .eq("id", transferId);
}

function validateCollectionReference(
  transfer: Transfer,
): { ok: true } | { ok: false; reason: string } {
  const ref = transfer.collection_reference?.trim();
  if (!ref) {
    return { ok: false, reason: "Missing collection_reference" };
  }
  // Loose guardrails only -- there's no live API to actually verify the
  // collection side yet. Adjust these per real-world transaction ID
  // formats as you see them come in.
  if (ref.length < 6 || ref.length > 40) {
    return { ok: false, reason: "collection_reference has an unexpected length" };
  }
  return { ok: true };
}

// ---------------------------------------------------------------------------
// MTN MOMO SECTION (Ghana payout) -- Disbursement API
// Docs: https://momodeveloper.mtn.com  (Disbursement product)
// Flow: get OAuth token -> POST /disbursement/v1_0/deposit
// ---------------------------------------------------------------------------

async function getMtnMomoToken(): Promise<string> {
  const baseUrl = Deno.env.get("MTN_MOMO_BASE_URL")!;
  const subscriptionKey = Deno.env.get("MTN_MOMO_SUBSCRIPTION_KEY")!;
  const apiUser = Deno.env.get("MTN_MOMO_API_USER")!;
  const apiKey = Deno.env.get("MTN_MOMO_API_KEY")!;

  const basicAuth = btoa(`${apiUser}:${apiKey}`);

  const res = await fetch(`${baseUrl}/disbursement/token/`, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${basicAuth}`,
      "Ocp-Apim-Subscription-Key": subscriptionKey,
    },
  });

  if (!res.ok) {
    throw new Error(`MTN MoMo token request failed: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  return data.access_token as string;
}

async function payoutMtnMomo(transfer: Transfer): Promise<PayoutResult> {
  if (DEMO_MODE) {
    return simulatePayout();
  }
  try {
    const baseUrl = Deno.env.get("MTN_MOMO_BASE_URL")!;
    const subscriptionKey = Deno.env.get("MTN_MOMO_SUBSCRIPTION_KEY")!;
    const targetEnv = Deno.env.get("MTN_MOMO_TARGET_ENV") ?? "sandbox";

    const token = await getMtnMomoToken();
    const referenceId = crypto.randomUUID();

    const res = await fetch(`${baseUrl}/disbursement/v1_0/deposit`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "X-Reference-Id": referenceId,
        "X-Target-Environment": targetEnv,
        "Ocp-Apim-Subscription-Key": subscriptionKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: transfer.amount_received.toString(),
        currency: "GHS",
        externalId: transfer.id,
        payee: {
          partyIdType: "MSISDN",
          partyId: normalizePhone(transfer.recipient_phone),
        },
        payerMessage: "OtiPay transfer",
        payeeNote: "OtiPay transfer",
      }),
    });

    // MTN's deposit endpoint returns 202 Accepted with no body; the actual
    // result is async, fetched via GET /disbursement/v1_0/deposit/{referenceId}.
    if (res.status !== 202) {
      return { success: false, error: `MTN MoMo deposit request failed: ${res.status} ${await res.text()}` };
    }

    // Poll for the result (MTN sandbox/prod typically resolves within seconds).
    const outcome = await pollMtnMomoStatus(baseUrl, subscriptionKey, targetEnv, token, referenceId);
    if (outcome.status === "SUCCESSFUL") {
      return { success: true, reference: referenceId };
    }
    return { success: false, error: `MTN MoMo payout not successful: ${outcome.status} ${outcome.reason ?? ""}` };
  } catch (err) {
    return { success: false, error: `MTN MoMo payout threw: ${String(err)}` };
  }
}

async function pollMtnMomoStatus(
  baseUrl: string,
  subscriptionKey: string,
  targetEnv: string,
  token: string,
  referenceId: string,
  attempts = 5,
  delayMs = 2000,
): Promise<{ status: string; reason?: string }> {
  for (let i = 0; i < attempts; i++) {
    await new Promise((r) => setTimeout(r, delayMs));
    const res = await fetch(`${baseUrl}/disbursement/v1_0/deposit/${referenceId}`, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "X-Target-Environment": targetEnv,
        "Ocp-Apim-Subscription-Key": subscriptionKey,
      },
    });
    if (res.ok) {
      const data = await res.json();
      if (data.status && data.status !== "PENDING") {
        return { status: data.status, reason: data.reason };
      }
    }
  }
  return { status: "TIMEOUT" };
}

async function simulatePayout(): Promise<PayoutResult> {
  // A short pause so the demo still *feels* like a real network call,
  // rather than resolving instantly and looking fake.
  await new Promise((r) => setTimeout(r, 1500));
  return { success: true, reference: `DEMO-${crypto.randomUUID().slice(0, 8).toUpperCase()}` };
}

function normalizePhone(phone: string): string {
  // MTN MoMo wants MSISDN without leading '+'. Adjust if your stored
  // phone format differs (e.g. already E.164 with '+').
  return phone.replace(/^\+/, "").replace(/\s/g, "");
}

// ---------------------------------------------------------------------------
// CINETPAY SECTION (Togo payout) -- Transfer / Payout API
// ⚠️ BEST-GUESS IMPLEMENTATION -- CinetPay's docs were inaccessible when
// this was written. This follows their commonly-documented Transfer API
// shape (auth/login -> bearer token -> transfer/money/send), but field
// names, endpoint paths, and the exact auth flow need verification against
// https://docs.cinetpay.com once their docs are back up. Treat every
// endpoint path and field name below as unverified.
// ---------------------------------------------------------------------------

async function getCinetPayToken(): Promise<string> {
  const baseUrl = Deno.env.get("CINETPAY_BASE_URL")!;
  const apikey = Deno.env.get("CINETPAY_APIKEY")!;
  const password = Deno.env.get("CINETPAY_PASSWORD")!;

  const res = await fetch(`${baseUrl}/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ apikey, password }),
  });

  if (!res.ok) {
    throw new Error(`CinetPay auth failed: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  // GUESS: token likely nested under data.token or data.access_token --
  // verify against real docs/response once available.
  return (data.token ?? data.access_token ?? data.data?.token) as string;
}

async function payoutCinetPay(transfer: Transfer): Promise<PayoutResult> {
  if (DEMO_MODE) {
    return simulatePayout();
  }
  try {
    const baseUrl = Deno.env.get("CINETPAY_BASE_URL")!;
    const token = await getCinetPayToken();
    const clientTransactionId = crypto.randomUUID();

    // GUESS: CinetPay's transfer API commonly requires registering a
    // "contact" (recipient) before sending money to them. If that step
    // turns out to be required, add a `POST /v1/transfer/contact` call
    // here first and pass its returned contact id into the send call.
    const res = await fetch(`${baseUrl}/v1/transfer/money/send?token=${encodeURIComponent(token)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prefix: "228", // Togo country code
        phone: normalizePhone(transfer.recipient_phone),
        amount: transfer.amount_received,
        notify_url: "", // TODO: set a webhook URL if you want async confirmation
        client_transaction_id: clientTransactionId,
        payment_method: transfer.network === "flooz" ? "FLOOZ" : "TMONEY",
      }),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok || !data) {
      return { success: false, error: `CinetPay transfer failed: ${res.status} ${JSON.stringify(data)}` };
    }

    // GUESS: success shape unverified -- adjust once docs confirm the
    // real response fields (could be data.code === '0' / data.status, etc.)
    const looksSuccessful = data.code === "0" || data.status === "success" || data.success === true;
    if (looksSuccessful) {
      return { success: true, reference: data.transaction_id ?? clientTransactionId };
    }
    return { success: false, error: `CinetPay transfer not successful: ${JSON.stringify(data)}` };
  } catch (err) {
    return { success: false, error: `CinetPay payout threw: ${String(err)}` };
  }
}
