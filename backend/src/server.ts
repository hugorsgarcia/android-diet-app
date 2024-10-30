import fastify from "fastify";
import cors from "@fastify/cors"
import dotevn from "dotenv"
import {routes} from "./routes"

// Cria uma instância do Fastify com configuração de logger para monitorar as requisições
const app = fastify({ logger: true})
// Carrega variáveis de ambiente do arquivo .env para o processo atual
dotevn.config();
// Define um handler personalizado para tratar erros de requisição
app.setErrorHandler((error, request, reply) =>{
    reply.code(400).send({message:error.message})
})

const start = async () =>{
    app.register(cors);
    app.register(routes);

    try{
        await app.listen({port: 3333, host:"0.0.0.0"});
        console.log("servidor rodando na porta http://localhost:3333" );
    }catch(err){
        console.log(err);
    }
}
start();