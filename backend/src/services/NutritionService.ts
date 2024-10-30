import { DataProps } from "../controllers/NutritionController"

class NutritionService{
    async execute({name, age, gender, weight, height, objective, level}: DataProps){
        console.log("TESTE")

        return {message:"SERVICE CHAMADO"}
    }
}

export {NutritionService}