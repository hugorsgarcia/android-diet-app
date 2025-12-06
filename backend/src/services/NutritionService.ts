import { DataProps } from "../controllers/NutritionController"
// Importa a biblioteca Google Generative AI
import { GoogleGenerativeAI } from "@google/generative-ai"

class NutritionService {
    async execute({ name, age, gender, weight, height, objective, level }: DataProps) {
        try {
            const genAI = new GoogleGenerativeAI(process.env.API_KEY!)
            const model = genAI.getGenerativeModel({ 
                model: "gemini-2.5-flash",
                generationConfig: {
                    temperature: 0.7,
                    topP: 0.8,
                    topK: 40,
                    maxOutputTokens: 2048,
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

                const jsonText = response.response.candidates[0]?.content.parts[0].text as String;

                // Remove qualquer formatação markdown e espaços em branco
                let jsonString = jsonText.replace(/```\w*\n/g, '').replace(/\n```/g, '').trim();

                // Converte a string JSON para um objeto JavaScript
                let jsonObject = JSON.parse(jsonString)
                
                // Retorna o objeto JSON contendo a dieta gerada
                return { data: jsonObject }
            }



        } catch (err) {
            console.log("Erro JSON", err)
            throw new Error("Falha")
        }
    }
}

export { NutritionService }