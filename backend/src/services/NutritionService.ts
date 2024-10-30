import { DataProps } from "../controllers/NutritionController"
import {GoogleGenerativeAI} from "@google/generative-ai"

class NutritionService{
    async execute({name, age, gender, weight, height, objective, level}: DataProps){
        try{
            
        }catch(err){
            console.log("Erro JSON", err)
            throw new Error("Falha")
        }
    }
}

export {NutritionService}