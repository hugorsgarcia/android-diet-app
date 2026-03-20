import { FastifyRequest, FastifyReply } from "fastify"
import { NutritionService } from "../services/NutritionService"
import { z } from "zod"

const DataSchema = z.object({
    name: z.string().min(1, "Nome é obrigatório").max(100),
    weight: z.string().min(1).max(10),
    height: z.string().min(1).max(10),
    age: z.string().min(1).max(5),
    gender: z.string().min(1).max(20),
    objective: z.string().min(1).max(255),
    level: z.string().min(1).max(100),
});

export type DataProps = z.infer<typeof DataSchema>;

class NutritionController {
    async handle(request: FastifyRequest, reply: FastifyReply) {
        const parsedBody = DataSchema.safeParse(request.body);

        if (!parsedBody.success) {
            return reply.status(400).send({ message: "Dados inválidos", errors: parsedBody.error.format() });
        }

        const { name, weight, height, age, gender, objective, level } = parsedBody.data;

        const createNutrition = new NutritionService();
        const nutrition = await createNutrition.execute({ name, weight, height, age, gender, objective, level });
        reply.send(nutrition);
    }
}

export { NutritionController }