"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.swapMealFood = exports.cleanupExpiredDiets = exports.getDietHistory = exports.generateDiet = void 0;
const https_1 = require("firebase-functions/v2/https");
const scheduler_1 = require("firebase-functions/v2/scheduler");
const admin = __importStar(require("firebase-admin"));
const openai_1 = __importDefault(require("openai"));
const params_1 = require("firebase-functions/params");
admin.initializeApp();
const db = admin.firestore();
// O token do Copilot Pro / GitHub será armazenado no Secret Manager
const githubToken = (0, params_1.defineSecret)("GITHUB_TOKEN");
// ==========================================
// RATE LIMITING (SEC-02)
// Máximo de 5 chamadas por UID por hora por função
// ==========================================
async function checkRateLimit(uid, functionName, maxCalls = 5, windowMs = 60 * 60 * 1000 // 1 hora
) {
    const windowStart = admin.firestore.Timestamp.fromMillis(Date.now() - windowMs);
    const rateLimitRef = db
        .collection('rateLimits')
        .doc(`${uid}_${functionName}`);
    await db.runTransaction(async (tx) => {
        const doc = await tx.get(rateLimitRef);
        const now = admin.firestore.Timestamp.now();
        if (!doc.exists) {
            tx.set(rateLimitRef, { count: 1, windowStart: now, uid });
            return;
        }
        const data = doc.data();
        const withinWindow = data.windowStart > windowStart;
        if (withinWindow && data.count >= maxCalls) {
            throw new https_1.HttpsError('resource-exhausted', `Limite de ${maxCalls} requisições por hora atingido. Aguarde e tente novamente.`);
        }
        if (withinWindow) {
            tx.update(rateLimitRef, { count: data.count + 1 });
        }
        else {
            tx.set(rateLimitRef, { count: 1, windowStart: now, uid });
        }
    });
}
// Schema de resposta idêntico ao que estava no NutritionService
// Schema OpenAI rigorosamente validado JSON (Structured Outputs)
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
                gorduras: { type: "string" }
            },
            required: ["proteinas", "carboidratos", "gorduras"],
            additionalProperties: false
        },
        refeicoes: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    horario: { type: "string" },
                    nome: { type: "string" },
                    alimentos: {
                        type: "array",
                        items: { type: "string" }
                    }
                },
                required: ["horario", "nome", "alimentos"],
                additionalProperties: false
            }
        },
        suplementos: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    nome: { type: "string" },
                    dosagem: { type: "string" },
                    quando_tomar: { type: "string" }
                },
                required: ["nome", "dosagem", "quando_tomar"],
                additionalProperties: false
            }
        }
    },
    required: ["nome", "sexo", "idade", "altura", "peso", "objetivo", "calorias_diarias", "macronutrientes", "refeicoes", "suplementos"],
    additionalProperties: false
};
// Regex de sanitização anti-Prompt Injection
const DANGEROUS_PATTERNS = /ignore|esqueça|forget|override|aja como|act as|system prompt|admin/i;
exports.generateDiet = (0, https_1.onCall)({
    timeoutSeconds: 120,
    secrets: [githubToken],
    enforceAppCheck: false // SEC-01: habilitar após configurar App Check no console Firebase
}, async (request) => {
    // 1. Validar autenticação
    if (!request.auth) {
        throw new https_1.HttpsError("unauthenticated", "O usuário deve estar logado.");
    }
    // SEC-02: Rate limiting — máximo 5 gerações por hora por UID
    await checkRateLimit(request.auth.uid, 'generateDiet', 5);
    const { name, weight, height, age, gender, objective, level, dietType } = request.data;
    // 2. Validação básica dos campos
    if (!name || !weight || !height || !age || !gender || !objective || !level) {
        throw new https_1.HttpsError("invalid-argument", "Todos os campos são obrigatórios.");
    }
    // 3. Anti-Prompt Injection
    const allFields = [name, weight, height, age, gender, objective, level, dietType || ''].join(" ");
    if (DANGEROUS_PATTERNS.test(allFields)) {
        throw new https_1.HttpsError("invalid-argument", "Entrada contém conteúdo não permitido.");
    }
    // 4. Verificar tamanho dos campos
    if (name.length > 100 || objective.length > 255) {
        throw new https_1.HttpsError("invalid-argument", "Campos excedem o tamanho máximo permitido.");
    }
    try {
        // 5. Chamada ao GitHub Models (OpenAI SDK Endpoint via Copilot Pro)
        // Utilizando o gpt-4o-mini já que "GPT-5 Mini" não existe publicamente ainda na API da Microsoft.
        const openai = new openai_1.default({
            baseURL: "https://models.inference.ai.azure.com",
            apiKey: githubToken.value()
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
- Tipo de dieta: ${dietType && dietType !== 'padrao' ? dietType : 'Padrão (balanceada)'}

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
                    content: "Você é um nutricionista especialista. Retorne EXATAMENTE o JSON estrito cobrado pelo esquema sem explicações, sem markdown."
                },
                { role: "user", content: prompt }
            ],
            temperature: 0.7,
            top_p: 0.8,
            max_tokens: 8192,
            response_format: {
                type: "json_schema",
                json_schema: {
                    name: "dietResponse",
                    strict: true,
                    schema: dietResponseSchema
                }
            }
        });
        if (!response.choices?.[0]?.message?.content) {
            throw new https_1.HttpsError("internal", "Resposta da IA está vazia.");
        }
        if (response.choices[0].finish_reason === "length") {
            throw new https_1.HttpsError("resource-exhausted", "Resposta da IA foi truncada pelo comprimento de tokens.");
        }
        const jsonText = response.choices[0].message.content;
        const dietObject = JSON.parse(jsonText.trim());
        // 6. Salvar no Firestore com TTL de 30 dias (DBA fix #3)
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);
        const dietRef = await db.collection("users").doc(request.auth.uid).collection("diets").add({
            name,
            weight,
            height,
            age,
            gender,
            objective,
            level,
            dietType: dietType || 'padrao',
            dietData: dietObject,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            expiresAt: admin.firestore.Timestamp.fromDate(expiresAt)
        });
        return { success: true, data: dietObject, dietId: dietRef.id };
    }
    catch (err) {
        console.error("Erro na geração de dieta:", err);
        if (err instanceof https_1.HttpsError)
            throw err;
        if (err.status === 429) {
            throw new https_1.HttpsError("resource-exhausted", "Limite de requisições excedido. Aguarde e tente novamente.");
        }
        if (err.status === 401 || err.status === 403) {
            throw new https_1.HttpsError("permission-denied", "Erro de autenticação com o serviço de IA.");
        }
        throw new https_1.HttpsError("internal", "Falha ao gerar dieta. Tente novamente.");
    }
});
// Cloud Function para buscar histórico de dietas
exports.getDietHistory = (0, https_1.onCall)({ timeoutSeconds: 30 }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError("unauthenticated", "O usuário deve estar logado.");
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
});
// DBA-03: Limpeza automática de dietas expiradas usando collectionGroup (não listDocuments)
// DBA-01: Roda 2x/dia para manter a subcoleção `water` limpa também
exports.cleanupExpiredDiets = (0, scheduler_1.onSchedule)({
    schedule: "0 2,14 * * *", // Roda às 02:00 e 14:00 UTC
    timeZone: "America/Sao_Paulo",
    timeoutSeconds: 300
}, async () => {
    const now = admin.firestore.Timestamp.now();
    let totalDeleted = 0;
    // DBA-03: collectionGroup query escala para qualquer número de usuários
    // sem iterar manualmente cada documento de /users
    const expiredDiets = await db
        .collectionGroup("diets")
        .where("expiresAt", "<", now)
        .limit(500) // processa em lotes para evitar timeout
        .get();
    if (!expiredDiets.empty) {
        const batch = db.batch();
        expiredDiets.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
        totalDeleted += expiredDiets.size;
    }
    // DBA-01: Remover entradas de water com mais de 30 dias
    const cutoff30d = new Date();
    cutoff30d.setDate(cutoff30d.getDate() - 30);
    const cutoffDateStr = cutoff30d.toISOString().slice(0, 10); // YYYY-MM-DD
    const oldWater = await db
        .collectionGroup("water")
        .where("date", "<", cutoffDateStr)
        .limit(500)
        .get();
    if (!oldWater.empty) {
        const batch = db.batch();
        oldWater.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
        totalDeleted += oldWater.size;
    }
    // DBA-01: Remover entradas de rateLimits antigas (> 2 horas)
    const rateLimitCutoff = admin.firestore.Timestamp.fromMillis(Date.now() - 2 * 60 * 60 * 1000);
    const oldRateLimits = await db
        .collection("rateLimits")
        .where("windowStart", "<", rateLimitCutoff)
        .limit(500)
        .get();
    if (!oldRateLimits.empty) {
        const batch = db.batch();
        oldRateLimits.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
        totalDeleted += oldRateLimits.size;
    }
    console.log(`[cleanupExpiredDiets] Removidos ${totalDeleted} documentos expirados.`);
});
// ==========================================
// AI FOOD SWAP (Nutricionista de Bolso)
// ==========================================
const swapResponseSchema = {
    type: "object",
    properties: {
        newAlimentos: {
            type: "array",
            items: { type: "string" }
        }
    },
    required: ["newAlimentos"],
    additionalProperties: false
};
exports.swapMealFood = (0, https_1.onCall)({
    timeoutSeconds: 60,
    secrets: [githubToken],
    enforceAppCheck: false // SEC-01: habilitar após configurar App Check no console Firebase
}, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError("unauthenticated", "O usuário deve estar logado.");
    }
    // SEC-02: Rate limiting — máximo 20 trocas por hora por UID
    await checkRateLimit(request.auth.uid, 'swapMealFood', 20);
    const { mealName, currentFoods, reason, dietContext } = request.data;
    if (!mealName || !currentFoods || !reason) {
        throw new https_1.HttpsError("invalid-argument", "Dados incompletos para troca de alimentos.");
    }
    // Anti-Prompt Injection
    const allFields = [mealName, reason, dietContext, ...currentFoods].join(" ");
    if (DANGEROUS_PATTERNS.test(allFields)) {
        throw new https_1.HttpsError("invalid-argument", "Entrada contém conteúdo não permitido.");
    }
    try {
        const openai = new openai_1.default({
            baseURL: "https://models.inference.ai.azure.com",
            apiKey: githubToken.value()
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
                    content: "Você é um nutricionista especialista. Retorne EXATAMENTE o JSON estrito cobrado pelo esquema sem explicações."
                },
                { role: "user", content: prompt }
            ],
            temperature: 0.7,
            max_tokens: 1024,
            response_format: {
                type: "json_schema",
                json_schema: {
                    name: "swapResponse",
                    strict: true,
                    schema: swapResponseSchema
                }
            }
        });
        if (!response.choices?.[0]?.message?.content) {
            throw new https_1.HttpsError("internal", "Resposta da IA está vazia.");
        }
        const result = JSON.parse(response.choices[0].message.content.trim());
        return { newAlimentos: result.newAlimentos };
    }
    catch (err) {
        console.error("Erro na troca de alimentos:", err);
        if (err instanceof https_1.HttpsError)
            throw err;
        throw new https_1.HttpsError("internal", "Falha ao trocar alimentos. Tente novamente.");
    }
});
//# sourceMappingURL=index.js.map