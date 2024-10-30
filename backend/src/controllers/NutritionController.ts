import {FastifyRequest, FastifyReply} from "fastify"
import { NutritionService} from "../services/NutritionService"

class NutritionController{
    async handle(request: FastifyRequest, reply: FastifyReply){
        console.log("Roda foi chamada")
        
        const createNutrition = new NutritionService();
        const nutrition = await createNutrition.execute();
        reply.send(nutrition);
    }
}

export {NutritionController}