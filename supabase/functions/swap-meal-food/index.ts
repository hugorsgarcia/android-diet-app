import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import OpenAI from "https://esm.sh/openai@4.73.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DANGEROUS_PATTERNS = /ignore|esqueça|forget|override|aja como|act as|system prompt|admin/i;

const swapResponseSchema = {
  type: "object",
  properties: {
    newAlimentos: {
      type: "array",
      items: { type: "string" },
    },
  },
  required: ["newAlimentos"],
  additionalProperties: false,
};

async function checkRateLimit(
  supabaseAdmin: ReturnType<typeof createClient>,
  userId: string,
  functionName: string,
  maxCalls: number = 20,
  windowMs: number = 60 * 60 * 1000,
): Promise<void> {
  const windowStart = new Date(Date.now() - windowMs).toISOString();

  const { data: existing } = await supabaseAdmin
    .from("rate_limits")
    .select("*")
    .eq("user_id", userId)
    .eq("function_name", functionName)
    .single();

  if (!existing) {
    await supabaseAdmin.from("rate_limits").upsert({
      user_id: userId,
      function_name: functionName,
      call_count: 1,
      window_start: new Date().toISOString(),
    }, { onConflict: "user_id,function_name" });
    return;
  }

  const withinWindow = new Date(existing.window_start) > new Date(windowStart);

  if (withinWindow && existing.call_count >= maxCalls) {
    throw new Error(`Limite de ${maxCalls} requisições por hora atingido.`);
  }

  if (withinWindow) {
    await supabaseAdmin
      .from("rate_limits")
      .update({ call_count: existing.call_count + 1 })
      .eq("user_id", userId)
      .eq("function_name", functionName);
  } else {
    await supabaseAdmin.from("rate_limits").upsert({
      user_id: userId,
      function_name: functionName,
      call_count: 1,
      window_start: new Date().toISOString(),
    }, { onConflict: "user_id,function_name" });
  }
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const githubToken = Deno.env.get("GITHUB_TOKEN")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autenticado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAuth = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Usuário não autenticado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Rate limiting
    await checkRateLimit(supabaseAdmin, user.id, "swapMealFood", 20);

    const { mealName, currentFoods, reason, dietContext } = await req.json();

    if (!mealName || !currentFoods || !reason) {
      return new Response(JSON.stringify({ error: "Dados incompletos para troca de alimentos." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Anti-Prompt Injection
    const allFields = [mealName, reason, dietContext, ...currentFoods].join(" ");
    if (DANGEROUS_PATTERNS.test(allFields)) {
      return new Response(JSON.stringify({ error: "Entrada contém conteúdo não permitido." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const openai = new OpenAI({
      baseURL: "https://models.inference.ai.azure.com",
      apiKey: githubToken,
    });

    const prompt = `
REFEIÇÃO: ${mealName}
ALIMENTOS ATUAIS: ${currentFoods.join(", ")}
MOTIVO DA TROCA: ${reason}
CONTEXTO DA DIETA: ${dietContext}

INSTRUÇÕES:
1. Substitua TODOS os alimentos desta refeição por alternativas equivalentes em macronutrientes.
2. Mantenha a mesma quantidade de itens.
3. Considere o motivo da troca (ex: se é alergia, evite alimentos similares).
4. Retorne apenas a lista de novos alimentos no formato JSON.
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Você é um nutricionista especialista. Retorne EXATAMENTE o JSON estrito cobrado pelo esquema sem explicações.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 1024,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "swapResponse",
          strict: true,
          schema: swapResponseSchema,
        },
      },
    });

    if (!response.choices?.[0]?.message?.content) {
      return new Response(JSON.stringify({ error: "Resposta da IA está vazia." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = JSON.parse(response.choices[0].message.content.trim());
    return new Response(
      JSON.stringify({ newAlimentos: result.newAlimentos }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err: unknown) {
    console.error("Erro na troca de alimentos:", err);
    const message = err instanceof Error ? err.message : "Falha ao trocar alimentos.";
    const status = message.includes("Limite de") ? 429 : 500;
    return new Response(
      JSON.stringify({ error: message }),
      { status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
