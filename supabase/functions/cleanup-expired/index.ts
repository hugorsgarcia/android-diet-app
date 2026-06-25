import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    let totalDeleted = 0;

    // 1. Remover dietas expiradas
    const { data: expiredDiets } = await supabase
      .from("diets")
      .delete()
      .lt("expires_at", new Date().toISOString())
      .select("id");

    totalDeleted += expiredDiets?.length || 0;

    // 2. Remover water entries com mais de 30 dias
    const cutoff30d = new Date();
    cutoff30d.setDate(cutoff30d.getDate() - 30);
    const cutoffDateStr = cutoff30d.toISOString().slice(0, 10);

    const { data: oldWater } = await supabase
      .from("water_tracking")
      .delete()
      .lt("date", cutoffDateStr)
      .select("id");

    totalDeleted += oldWater?.length || 0;

    // 3. Remover rate limits antigas (> 2 horas)
    const rateLimitCutoff = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

    const { data: oldRateLimits } = await supabase
      .from("rate_limits")
      .delete()
      .lt("window_start", rateLimitCutoff)
      .select("id");

    totalDeleted += oldRateLimits?.length || 0;

    console.log(`[cleanup-expired] Removidos ${totalDeleted} registros expirados.`);

    return new Response(
      JSON.stringify({ success: true, deleted: totalDeleted }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("Erro no cleanup:", err);
    return new Response(
      JSON.stringify({ error: "Falha no cleanup." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
