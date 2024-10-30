import {FastifyRequest, FastifyReply} from "fastify"
import { NutritionService} from "../services/NutritionService"

export interface DataProps{
    name: String;
    weight: String;
    height: String;
    age: String;
    gender: String;
    objective: String;
    level: String;
}

class NutritionController{
    async handle(request: FastifyRequest, reply: FastifyReply){
        const {name, weight, height, age, gender, objective, level} = request.body as DataProps;
        
        const createNutrition = new NutritionService();
        const nutrition = await createNutrition.execute({name, weight, height, age, gender, objective, level});
        reply.send(nutrition);
    }
}

export {NutritionController}