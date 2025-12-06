import { DataProps } from "../controllers/NutritionController"
// Importa a biblioteca Google Generative AI
import { GoogleGenerativeAI } from "@google/generative-ai"

class NutritionService {
    async execute({ name, age, gender, weight, height, objective, level }: DataProps) {
        try {
            const genAI = new GoogleGenerativeAI(process.env.API_KEY!)
            // Usando gemini-2.0-flash (modelo disponível e estável)
            const model = genAI.getGenerativeModel({ 
                model: "gemini-2.0-flash",
                generationConfig: {
                    temperature: 0.7,
                    topP: 0.8,
                    topK: 40,
                    maxOutputTokens: 8192, // Aumentado para garantir resposta completa
                    responseMimeType: "application/json",
                }
            })
            
            // Define o prompt otimizado para o Gemini 3
            const prompt = `
Você é um nutricionista especialista. Crie uma dieta personalizada completa baseada nos seguintes dados:

DADOS PESSOAIS:
- Nome: ${name}
- Sexo: ${gender}
- Peso: ${weight}kg
- Altura: ${height}
- Idade: ${age} anos
- Objetivo: ${objective}
- Nível de atividade: ${level}

INSTRUÇÕES:
1. Calcule as necessidades calóricas e macronutrientes adequadas
2. Crie um plano alimentar balanceado com 5-6 refeições
3. Sugira suplementos apropriados para o perfil e objetivo
4. Inclua horários específicos para cada refeição

FORMATO DE RESPOSTA (JSON):
{
  "nome": "string",
  "sexo": "string", 
  "idade": number,
  "altura": "string",
  "peso": "string",
  "objetivo": "string",
  "calorias_diarias": number,
  "macronutrientes": {
    "proteinas": "string",
    "carboidratos": "string", 
    "gorduras": "string"
  },
  "refeicoes": [
    {
      "horario": "string",
      "nome": "string",
      "alimentos": ["string"]
    }
  ],
  "suplementos": [
    {
      "nome": "string",
      "dosagem": "string",
      "quando_tomar": "string"
    }
  ]
}

Retorne APENAS o JSON, sem comentários ou formatação markdown.`;

            const response = await model.generateContent(prompt);
            console.log(JSON.stringify(response, null, 2));

            if (response.response && response.response.candidates) {
                const candidate = response.response.candidates[0];
                
                // Verifica se a resposta foi truncada
                if (candidate.finishReason === 'MAX_TOKENS') {
                    console.log("⚠️ Resposta truncada - MAX_TOKENS atingido");
                    throw new Error("Resposta da IA foi truncada. Tente novamente.");
                }
                
                // Verifica se há conteúdo válido
                if (!candidate.content || !candidate.content.parts || !candidate.content.parts[0]) {
                    console.log("⚠️ Resposta sem conteúdo válido");
                    throw new Error("Resposta da IA está vazia. Tente novamente.");
                }

                const jsonText = candidate.content.parts[0].text as String;

                // Remove qualquer formatação markdown e espaços em branco
                let jsonString = jsonText.replace(/```\w*\n/g, '').replace(/\n```/g, '').trim();

                // Converte a string JSON para um objeto JavaScript
                let jsonObject = JSON.parse(jsonString)
                
                // Retorna o objeto JSON contendo a dieta gerada
                return { data: jsonObject }
            }

            throw new Error("Resposta inválida da API");



        } catch (err: any) {
            console.log("Erro na geração de dieta:", err.message || err)
            
            // Tratamento específico para erros de quota
            if (err.status === 429) {
                throw new Error("Limite de requisições excedido. Aguarde alguns minutos e tente novamente.")
            }
            
            // Tratamento para erros de autenticação
            if (err.status === 401 || err.status === 403) {
                throw new Error("Erro de autenticação com a API. Verifique sua API Key.")
            }
            
            throw new Error("Falha ao gerar dieta. Tente novamente.")
        }
    }
}

export { NutritionService }