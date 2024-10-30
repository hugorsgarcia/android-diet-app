
import {
    FastifyInstance,
    FastifyPluginOptions,
    FastifyRequest,
    FastifyReply,
} from "fastify"

// Importa o controller
import { NutritionController } from "./controllers/NutritionController"

// Função exportada que define as rotas no servidor Fastify
export async function routes(fastify: FastifyInstance, options: FastifyPluginOptions) {

    fastify.get("/teste", (request: FastifyRequest, reply: FastifyReply) => {
        // Definindo a resposta como uma string JSON formatada para facilitar a visualização
        let response = "```json\n{\n  \"nome\": \"Hugo\",\n  \"sexo\": \"masculino\",\n  \"idade\": 28,\n  \"altura\": 1.71,\n  \"peso\": 85,\n  \"objetivo\": \"emagrecer\",\n  \"refeicoes\": [\n    {\n      \"horario\": \"08:00\",\n      \"nome\": \"Café da Manhã\",\n      \"alimentos\": [\n        \"1 fatia de pão integral\",\n        \"1 ovo cozido\",\n        \"1 copo de leite desnatado\",\n        \"1 banana\",\n        \"1 xícara de café preto\"\n      ]\n    },\n    {\n      \"horario\": \"10:30\",\n      \"nome\": \"Lanche da Manhã\",\n        \"alimentos\": [\n        \"1 iogurte grego natural\",\n        \"1 colher de sopa de granola\"\n      ]\n    },\n    {\n      \"horario\": \"13:00\",\n      \"nome\": \"Almoço\",\n      \"alimentos\": [\n        \"100g de frango grelhado\",\n        \"1 xícara de arroz integral\",\n        \"1 xícara de brócolis cozido\",\n        \"1 salada verde com azeite de oliva\"\n      ]\n    },\n    {\n      \"horario\": \"15:30\",\n      \"nome\": \"Lanche da Tarde\",\n      \"alimentos\": [\n        \"1 maçã\",\n        \"1 pote de iogurte desnatado\"\n      ]\n    },\n    {\n      \"horario\": \"19:00\",\n      \"nome\": \"Jantar\",\n      \"alimentos\": [\n        \"150g de peixe assado\",\n        \"1 xícara de batata doce cozida\",\n        \"1 xícara de couve refogada\"\n      ]\n    },\n    {\n      \"horario\": \"21:00\",\n      \"nome\": \"Ceia\",\n        \"alimentos\": [\n        \"1 xícara de chá de camomila\"\n      ]\n    }\n  ],\n  \"suplementos\": [\n    \"Proteína do soro do leite\",\n    \"Creatina\",\n    \"Glutamina\"\n  ]\n}\n```"

        try {
            // Remove a formatação markdown de blocos de código para extrair JSON puro
            let jsonString = response.replace(/```\w*\n/g, '').replace(/\n```/g, '').trim();

            // Converte a string JSON para um objeto JavaScript
            let jsonObject = JSON.parse(jsonString)

            // Retorna o objeto JSON como resposta
            return reply.send({ data: jsonObject });
        } catch (err) {
            console.log(err)
        }

    })
    // Rota POST "/create" chama o NutritionController para lidar com a lógica de criação de novos dados
    fastify.post("/create", async (request: FastifyRequest, reply: FastifyReply) => {
        return new NutritionController().handle(request, reply)
    })
}