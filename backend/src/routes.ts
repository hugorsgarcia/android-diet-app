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

/* Função assíncrona que define rotas para uma instância Fastify.
A função recebe a instância do servidor Fastify e as opções do plugin.*/
export async function routes(fastify: FastifyInstance, options: FastifyPluginOptions){
    /* Define uma rota HTTP GET para o caminho "/teste".
     Envia uma resposta JSON com o objeto { Ok: true }.*/
    fastify.get("/teste", (request: FastifyRequest, reply: FastifyReply) =>{
        console.log("Rota chamada")
        reply.send({Ok: true})
    })
}