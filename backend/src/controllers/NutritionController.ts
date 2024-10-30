import { FastifyRequest, FastifyReply } from "fastify"
import { NutritionService } from "../services/NutritionService"

// Define a interface DataProps para tipar os dados recebidos na requisição
export interface DataProps {
    name: String;
    weight: String;
    height: String;
    age: String;
    gender: String;
    objective: String;
    level: String;
}
// Classe NutritionController para controlar as requisições relacionadas a dados de nutrição
class NutritionController {
    // Método handle que lida com as requisições HTTP e interage com o serviço de nutrição
    async handle(request: FastifyRequest, reply: FastifyReply) {
        // Extrai as propriedades do corpo da requisição e as tipa com a interface DataProps
        const { name, weight, height, age, gender, objective, level } = request.body as DataProps;

        // Instancia o NutritionService
        const createNutrition = new NutritionService();
        // Chama o método execute do serviço para processar os dados e aguarda o resultado
        const nutrition = await createNutrition.execute({ name, weight, height, age, gender, objective, level });
        // Envia a resposta com o objeto de dados de nutrição criado
        reply.send(nutrition);
    }
}

export { NutritionController }