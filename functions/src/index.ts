import { onCall, HttpsError } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
import * as admin from "firebase-admin";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { defineSecret } from "firebase-functions/params";

admin.initializeApp();
const db = admin.firestore();

// A chave do Gemini será armazenada no Google Cloud Secret Manager
const geminiApiKey = defineSecret("GEMINI_API_KEY");

// Schema de resposta idêntico ao que estava no NutritionService
const dietResponseSchema = {
    type: SchemaType.OBJECT,
    properties: {
        nome: { type: SchemaType.STRING },
        sexo: { type: SchemaType.STRING },
        idade: { type: SchemaType.INTEGER },
        altura: { type: SchemaType.STRING },
        peso: { type: SchemaType.STRING },
        objetivo: { type: SchemaType.STRING },
        calorias_diarias: { type: SchemaType.INTEGER },
        macronutrientes: {
            type: SchemaType.OBJECT,
            properties: {
                proteinas: { type: SchemaType.STRING },
                carboidratos: { type: SchemaType.STRING },
                gorduras: { type: SchemaType.STRING },
            },
        },
        refeicoes: {
            type: SchemaType.ARRAY,
            items: {
                type: SchemaType.OBJECT,
                properties: {
                    horario: { type: SchemaType.STRING },
                    nome: { type: SchemaType.STRING },
                    alimentos: {
                        type: SchemaType.ARRAY,
                        items: { type: SchemaType.STRING }
                    }
                }
            }
        },
        suplementos: {
            type: SchemaType.ARRAY,
            items: {
                type: SchemaType.OBJECT,
                properties: {
                    nome: { type: SchemaType.STRING },
                    dosagem: { type: SchemaType.STRING },
                    quando_tomar: { type: SchemaType.STRING },
                }
            }
        }
    },
    required: ["nome", "sexo", "idade", "altura", "peso", "objetivo", "calorias_diarias", "macronutrientes", "refeicoes", "suplementos"]
};

// Regex de sanitização anti-Prompt Injection
const DANGEROUS_PATTERNS = /ignore|esqueça|forget|override|aja como|act as|system prompt|admin/i;

export const generateDiet = onCall(
    { 
        timeoutSeconds: 120, 
        secrets: [geminiApiKey],
        enforceAppCheck: false // Ativar na Sprint 2
    }, 
    async (request) => {
        // 1. Validar autenticação
        if (!request.auth) {
            throw new HttpsError("unauthenticated", "O usuário deve estar logado.");
        }

        const { name, weight, height, age, gender, objective, level } = request.data;

        // 2. Validação básica dos campos
        if (!name || !weight || !height || !age || !gender || !objective || !level) {
            throw new HttpsError("invalid-argument", "Todos os campos são obrigatórios.");
        }

        // 3. Anti-Prompt Injection
        const allFields = [name, weight, height, age, gender, objective, level].join(" ");
        if (DANGEROUS_PATTERNS.test(allFields)) {
            throw new HttpsError("invalid-argument", "Entrada contém conteúdo não permitido.");
        }

        // 4. Verificar tamanho dos campos
        if (name.length > 100 || objective.length > 255) {
            throw new HttpsError("invalid-argument", "Campos excedem o tamanho máximo permitido.");
        }

        try {
            // 5. Chamada ao Gemini
            const genAI = new GoogleGenerativeAI(geminiApiKey.value());
            const model = genAI.getGenerativeModel({
                model: "gemini-2.0-flash",
                generationConfig: {
                    temperature: 0.7,
                    topP: 0.8,
                    topK: 40,
                    maxOutputTokens: 8192,
                    responseMimeType: "application/json",
                    responseSchema: dietResponseSchema as any,
                }
            });

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
Siga o schema JSON definido rigorosamente, sem nenhuma quebra extra.

Retorne APENAS o JSON, sem comentários ou formatação markdown.`;

            const response = await model.generateContent(prompt);

            if (!response.response?.candidates?.[0]?.content?.parts?.[0]) {
                throw new HttpsError("internal", "Resposta da IA está vazia.");
            }

            const candidate = response.response.candidates[0];

            if (candidate.finishReason === "MAX_TOKENS") {
                throw new HttpsError("resource-exhausted", "Resposta da IA foi truncada. Tente novamente.");
            }

            const jsonText = candidate.content.parts[0].text as string;
            const dietObject = JSON.parse(jsonText.trim());

            // 6. Salvar no Firestore com TTL de 30 dias (DBA fix #3)
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 30);

            await db.collection("users").doc(request.auth.uid).collection("diets").add({
                name,
                weight,
                height,
                age,
                gender,
                objective,
                level,
                dietData: dietObject,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                expiresAt: admin.firestore.Timestamp.fromDate(expiresAt)
            });

            return { success: true, data: dietObject };

        } catch (err: any) {
            console.error("Erro na geração de dieta:", err);

            if (err instanceof HttpsError) throw err;

            if (err.status === 429) {
                throw new HttpsError("resource-exhausted", "Limite de requisições excedido. Aguarde e tente novamente.");
            }
            if (err.status === 401 || err.status === 403) {
                throw new HttpsError("permission-denied", "Erro de autenticação com a API Gemini.");
            }

            throw new HttpsError("internal", "Falha ao gerar dieta. Tente novamente.");
        }
    }
);

// Cloud Function para buscar histórico de dietas
export const getDietHistory = onCall(
    { timeoutSeconds: 30 },
    async (request) => {
        if (!request.auth) {
            throw new HttpsError("unauthenticated", "O usuário deve estar logado.");
        }

        const snapshot = await db
            .collection("users")
            .doc(request.auth.uid)
            .collection("diets")
            .orderBy("createdAt", "desc")
            .limit(10)
            .get();

        const diets = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        return { diets };
    }
);

// DBA fix #3: Limpeza automática de dietas expiradas (roda todo dia às 02:00)
export const cleanupExpiredDiets = onSchedule(
    {
        schedule: "0 2 * * *",  // Cron: todo dia às 02:00 UTC
        timeZone: "America/Sao_Paulo",
        timeoutSeconds: 300
    },
    async () => {
        const now = admin.firestore.Timestamp.now();
        const usersSnapshot = await db.collection("users").listDocuments();

        let totalDeleted = 0;

        for (const userRef of usersSnapshot) {
            const expired = await userRef
                .collection("diets")
                .where("expiresAt", ">=", admin.firestore.Timestamp.fromMillis(0))
                .where("expiresAt", "<", now)
                .get();

            const batch = db.batch();
            expired.docs.forEach(doc => batch.delete(doc.ref));

            if (!expired.empty) {
                await batch.commit();
                totalDeleted += expired.size;
            }
        }

        console.log(`[cleanupExpiredDiets] Removidas ${totalDeleted} dietas expiradas.`);
    }
);
