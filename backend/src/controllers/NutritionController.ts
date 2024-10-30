import {FastifyRequest, FastifyReply} from "fastify"

class NutritionController{
    async handle(request: FastifyRequest, reply: FastifyReply){
        console.log("Roda foi chamada")
        reply.send({message: "Rota foi chamada"})
    }
}

export {NutritionController}