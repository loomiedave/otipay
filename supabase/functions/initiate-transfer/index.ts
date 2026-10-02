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
    } else if (fromCountry === "TG") {
      await initiateCinetPayCollection(transfer.id, amountSent, payerPhone, network);
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

async function initiateCinetPayCollection(transferId: string, amount: number, payerPhone: string, network: string) {
  // ⚠️ Best-effort against confirmed docs — the exact push-vs-redirect behavior
  // needs a one-time real test once you have live credentials. If this
  // returns a payment_url instead of pushing directly, you'll need a WebView
  // step here instead of a pure API push — flag it back to me if so.
  const apikey = Deno.env.get("CINETPAY_APIKEY")!;
  const siteId = Deno.env.get("CINETPAY_SITE_ID")!;
  const notifyUrl = Deno.env.get("CINETPAY_NOTIFY_URL")!;

  const paymentMethod = network === "flooz" ? "FLOOZTG" : "TmoneyTG";

  const res = await fetch("https://api-checkout.cinetpay.com/v2/payment", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      apikey,
      site_id: siteId,
      transaction_id: transferId,
      amount,
      currency: "XOF",
      description: "OtiPay transfer",
      notify_url: notifyUrl,
      channels: "MOBILE_MONEY",
      customer_phone_number: payerPhone,
      lock_phone_number: true,
      payment_method: paymentMethod,
    }),
  });

  const data = await res.json();
  if (data.code !== "201" && data.code !== 201) {
    throw new Error(`CinetPay init failed: ${JSON.stringify(data)}`);
  }

  await supabase.from("transfers").update({ collection_reference: transferId }).eq("id", transferId);
}