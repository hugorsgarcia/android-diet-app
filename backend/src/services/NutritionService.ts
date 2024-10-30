import { DataProps } from "../controllers/NutritionController"
import {GoogleGenerativeAI} from "@google/generative-ai"

class NutritionService{
    async execute({name, age, gender, weight, height, objective, level}: DataProps){
        try{
            const genAI = new GoogleGenerativeAI(process.env.API_KEY!)
            const model = genAI.getGenerativeModel({model: "gemini-1.5-flash"})

            const response = await model.generateContent("Em que ano o C++ foi criado");
            console.log(JSON.stringify(response, null, 2));
            return {ok: true}


        }catch(err){
            console.log("Erro JSON", err)
            throw new Error("Falha")
        }
    }
}

export {NutritionService}