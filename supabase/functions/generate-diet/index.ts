import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import OpenAI from "https://esm.sh/openai@4.73.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DANGEROUS_PATTERNS = /ignore|esqueça|forget|override|aja como|act as|system prompt|admin/i;

const dietResponseSchema = {
  type: "object",
  properties: {
    nome: { type: "string" },
    sexo: { type: "string" },
    idade: { type: "integer" },
    altura: { type: "string" },
    peso: { type: "string" },
    objetivo: { type: "string" },
    calorias_diarias: { type: "integer" },
    macronutrientes: {
      type: "object",
      properties: {
        proteinas: { type: "string" },
        carboidratos: { type: "string" },
        gorduras: { type: "string" },
      },
      required: ["proteinas", "carboidratos", "gorduras"],
      additionalProperties: false,
    },
    refeicoes: {
      type: "array",
      items: {
        type: "object",
        properties: {
          horario: { type: "string" },
          nome: { type: "string" },
          alimentos: { type: "array", items: { type: "string" } },
        },
        required: ["horario", "nome", "alimentos"],
        additionalProperties: false,
      },
    },
    suplementos: {
      type: "array",
      items: {
        type: "object",
        properties: {
          nome: { type: "string" },
          dosagem: { type: "string" },
          quando_tomar: { type: "string" },
        },
        required: ["nome", "dosagem", "quando_tomar"],
        additionalProperties: false,
      },
    },
  },
  required: ["nome", "sexo", "idade", "altura", "peso", "objetivo", "calorias_diarias", "macronutrientes", "refeicoes", "suplementos"],
  additionalProperties: false,
};

async function checkRateLimit(
  supabaseAdmin: ReturnType<typeof createClient>,
  userId: string,
  functionName: string,
  maxCalls: number = 5,
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
    throw new Error(`Limite de ${maxCalls} requisições por hora atingido. Aguarde e tente novamente.`);
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

    // Autenticação via JWT do header Authorization
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autenticado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
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

    // Rate limiting
    await checkRateLimit(supabaseAdmin, user.id, "generateDiet", 5);

    const { name, weight, height, age, gender, objective, level, dietType } = await req.json();

    // Validação
    if (!name || !weight || !height || !age || !gender || !objective || !level) {
      return new Response(JSON.stringify({ error: "Todos os campos são obrigatórios." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Anti-Prompt Injection
    const allFields = [name, weight, height, age, gender, objective, level, dietType || ""].join(" ");
    if (DANGEROUS_PATTERNS.test(allFields)) {
      return new Response(JSON.stringify({ error: "Entrada contém conteúdo não permitido." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (name.length > 100 || objective.length > 255) {
      return new Response(JSON.stringify({ error: "Campos excedem o tamanho máximo permitido." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Chamada ao GitHub Models (OpenAI SDK)
    const openai = new OpenAI({
      baseURL: "https://models.inference.ai.azure.com",
      apiKey: githubToken,
    });

    const prompt = `
DADOS PESSOAIS:
- Nome: ${name}
- Sexo: ${gender}
- Peso: ${weight}kg
- Altura: ${height}
- Idade: ${age} anos
- Objetivo: ${objective}
- Nível de atividade: ${level}
- Tipo de dieta: ${dietType && dietType !== "padrao" ? dietType : "Padrão (balanceada)"}

INSTRUÇÕES:
1. Calcule as necessidades calóricas e macronutrientes adequadas
2. Crie um plano alimentar balanceado com 5-6 refeições
3. Sugira suplementos apropriados para o perfil e objetivo
4. Inclua horários específicos para cada refeição
5. Respeite ESTRITAMENTE o tipo de dieta escolhido pelo usuário
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Você é um nutricionista especialista. Retorne EXATAMENTE o JSON estrito cobrado pelo esquema sem explicações, sem markdown.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      top_p: 0.8,
      max_tokens: 8192,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "dietResponse",
          strict: true,
          schema: dietResponseSchema,
        },
      },
    });

    if (!response.choices?.[0]?.message?.content) {
      return new Response(JSON.stringify({ error: "Resposta da IA está vazia." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (response.choices[0].finish_reason === "length") {
      return new Response(JSON.stringify({ error: "Resposta da IA foi truncada." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const dietObject = JSON.parse(response.choices[0].message.content.trim());

    // Salvar no Supabase
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const { data: dietRow, error: insertError } = await supabaseAdmin
      .from("diets")
      .insert({
        user_id: user.id,
        name,
        weight,
        height,
        age,
        gender,
        objective,
        level,
        diet_type: dietType || "padrao",
        diet_data: dietObject,
        expires_at: expiresAt.toISOString(),
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("Erro ao salvar dieta:", insertError);
      return new Response(JSON.stringify({ error: "Falha ao salvar dieta." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ success: true, data: dietObject, dietId: dietRow.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err: unknown) {
    console.error("Erro na geração de dieta:", err);
    const message = err instanceof Error ? err.message : "Falha ao gerar dieta. Tente novamente.";
    const status = message.includes("Limite de") ? 429 : 500;
    return new Response(
      JSON.stringify({ error: message }),
      { status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
