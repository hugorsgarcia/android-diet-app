# 🍎 AI Diet Planner - React Native & Google Gemini

Bem-vindo ao repositório do meu **primeiro aplicativo mobile desenvolvido com React Native**! 🚀

Este projeto é uma aplicação completa (Fullstack) que utiliza Inteligência Artificial para gerar planos de dieta personalizados. O usuário insere seus dados físicos e objetivos, e o app consulta o modelo **Google Gemini 2.0** para criar um cardápio completo, balanceado e estruturado.

## 🧠 O que eu aprendi neste projeto

Como este é meu marco inicial no desenvolvimento mobile, o foco foi dominar tecnologias modernas e a integração entre Front e Back:

* **React Native & Expo:** Aprendi a configurar o ambiente, criar interfaces nativas e usar o **Expo Router** para navegação baseada em arquivos.
* **Gerenciamento de Estado com Zustand:** Implementei o Zustand para gerenciar os dados do usuário entre as telas (Wizard Form) de forma simples e performática, evitando a complexidade do Redux.
* **Backend com Fastify:** Criei uma API robusta e veloz utilizando Node.js e Fastify, aplicando princípios de arquitetura limpa (Services/Controllers).
* **Integração com IA Generativa:** Aprendi a manipular a SDK do **Google Generative AI**, criando prompts otimizados e forçando saídas em JSON para consumo estruturado no App.
* **TypeScript Fullstack:** Mantive a tipagem forte em todo o projeto, garantindo que os dados enviados pelo mobile sejam exatamente os esperados pelo backend.

## 🛠️ Tecnologias Utilizadas

### Mobile
-   **React Native** (com Expo SDK 52)
-   **TypeScript**
-   **Zustand** (Global State Management)
-   **Expo Router** (Navegação)
-   **Axios** (Requisições HTTP)

### Backend
-   **Node.js**
-   **Fastify** (Framework Web)
-   **Google Gemini AI** (Modelo `gemini-2.0-flash`)
-   **TypeScript**

## 📱 Funcionalidades

1.  **Coleta de Dados:** Interface intuitiva para input de nome, peso, altura, idade, sexo e nível de atividade física.
2.  **Definição de Objetivo:** O usuário seleciona se quer perder peso, ganhar massa ou manter a forma.
3.  **Geração Inteligente:** O backend processa os dados e utiliza IA para calcular:
    -   Taxa metabólica e calorias diárias.
    -   Divisão de macronutrientes.
    -   Sugestão de suplementação.
4.  **Plano Alimentar:** Exibição de um cardápio completo com horários e alimentos sugeridos.

## 🚀 Como rodar o projeto

### Pré-requisitos
* Node.js instalado.
* Uma API Key do Google Gemini (AI Studio).

### 1. Configurando o Backend

```bash
# Entre na pasta do servidor
cd backend

# Instale as dependências
npm install

# Crie um arquivo .env na raiz do backend e adicione sua chave:
# API_KEY=Sua_Chave_Gemini_Aqui

# Rode o servidor
npm run dev

O servidor iniciará (geralmente em http://localhost:3333).

2. Configurando o Mobile
Bash
# Entre na pasta do mobile
cd mobile

# Instale as dependências
npm install

# Inicie o Expo
npx expo start
Escaneie o QR Code com seu celular (usando o app Expo Go) ou rode em um emulador Android/iOS.

Nota: Certifique-se de que o IP na configuração do axios no mobile aponta para o IP da sua máquina local (ex: 192.168.x.x:3333) se estiver testando no dispositivo físico.

📂 Estrutura do Projeto
/
├── backend/           # API Node.js com Fastify
│   ├── src/
│   │   ├── controllers/
│   │   ├── services/  # Lógica de integração com a IA
│   │   └── routes.ts
│
└── mobile/            # App React Native
    ├── app/           # Rotas e Telas (Expo Router)
    ├── store/         # Gerenciamento de estado (Zustand)
    └── components/
