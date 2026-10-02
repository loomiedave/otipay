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
    result = await payoutMtnMomo(transfer); // reuse your existing function, unchanged
  } else if (transfer.to_country === "TG") {
    result = await payoutCinetPay(transfer); // reuse your existing function, unchanged
  } else {
    result = { success: false, error: `No payout for ${transfer.to_country}` };
  }

  await supabase.from("transfers").update({
    status: result.success ? "paid_out" : "failed",
    payout_reference: result.success ? result.reference : `ERROR: ${result.error}`,
  }).eq("id", transferId);

  return new Response(JSON.stringify(result), { status: result.success ? 200 : 502 });
});

// payoutMtnMomo() and payoutCinetPay() — paste in unchanged from your
// original verify-and-payout function, they don't need to change at all.