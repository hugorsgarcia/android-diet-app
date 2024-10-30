/* Importa os tipos necessários do Fastify, incluindo:
- FastifyInstance: Representa uma instância do servidor Fastify.
- FastifyPluginOptions: Tipo para opções de configuração do plugin Fastify.
- FastifyRequest: Representa o objeto de requisição HTTP.
- FastifyReply: Representa o objeto de resposta HTTP. */
import{
    FastifyInstance,
    FastifyPluginOptions,
    FastifyRequest,
    FastifyReply,
}from "fastify"

import { NutritionController } from "./controllers/NutritionController" 


export async function routes(fastify: FastifyInstance, options: FastifyPluginOptions){

    fastify.get("/teste", (request: FastifyRequest, reply: FastifyReply) =>{
        console.log("Rota chamada")
        reply.send({Ok: true})
    })

    fastify.get("/create", async(request: FastifyRequest, reply: FastifyReply) =>{
        return new NutritionController().handle(request, reply)
    })
}