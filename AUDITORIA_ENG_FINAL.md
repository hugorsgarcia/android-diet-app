# 🏢 RELATÓRIO DO CONSELHO DE ENGENHARIA E PRODUTO (Dieta.AI)

**Data da Auditoria:** 23 de Março de 2026
**Objetivo:** Elevar o nível da aplicação Dieta.AI para o padrão Ouro de empresas Big Tech, alinhado 100% com o `INSTRUCTIONS.MD` (TDD, CI/CD, Clean Code e Documentação Definitiva).

---

## 👔 1. Time de Product Managers (PM) e Product Owners (PO)
**Visão de Negócio:** O produto hoje gera um valor enorme criando dietas personalizadas baseadas no GitHub Models (OpenAI), mas ainda sofre com a retenção de longo prazo e métricas rasas.
* **Problema 1 (Onboarding Seco):** Falta uma tela de boas-vindas com a Proposta de Valor bem definida que aumente o LTV do usuário e o engaje a preencher o formulário.
* **Problema 2 (Analytics):** Não sabemos quantas pessoas desistem no passo 1 do formulário. Precisamos de telemetria básica (ex: Firebase Analytics custom events).
* **Melhoria (Retenção):** Notificações push diárias ou semanais ("Já bebeu água hoje?" ou "Hora do seu lanche da tarde").

## 🛡️ 2. Time de Segurança (AppSec)
**Visão de Risco:** A aplicação interage com processamento de IA pago e banco de dados que cresce conforme os usuários interagem.
* **Vulnerabilidade ALTA:** A Cloud Function de geração de IA (`generateDiet`) está com `enforceAppCheck: false`. Qualquer pessoa com a URL do endpoint pode drenar nossos créditos de faturamento via cURL. Precisamos ligar o Firebase AppCheck (Play Integrity).
* **Ponto Cego (LGPD):** Guardamos dados médicos sensíveis (peso, altura, idade) integrados com IDs anônimos e, posteriormente, Auth. Precisamos documentar o Termo de Consentimento na primeira tela.

## 🏗️ 3. Time de Infraestrutura e DevOps
**Visão Operacional:** O processo de deploy hoje é amador (depende da máquina local do desenvolvedor usando `firebase deploy` e `eas build` manual).
* **Ausência de CI/CD (Violação do INSTRUCTIONS.MD):** Falta implantação de um workflow do GitHub Actions. Nenhum PR no `main` deve ser mergeado sem que todos os testes passem.
* **Ambientes:** Tudo roda em um único projeto do Firebase (`dietaai-25a8f`). Precisamos criar um ambiente lógico isolado para homologação/testes, para que novos devs não sujem a base de produção.

## 🧪 4. Time de Qualidade (QA e Automação)
**Visão de Estabilidade:** O código funciona bem hoje, mas é extremamente frágil à refatoração pois zero validações sistêmicas existem.
* **Violação TDD:** Não existem testes unitários (Jest) na pasta `functions` testando lógicas puras (ex: validação de BMI/IMC). Nem testes de componentes no `mobile`.
* **Teste E2E Deficiente:** Precisamos configurar o `Maestro` ou `Detox` no projeto mobile para gravar/testar fluxos completos simulados (abrir o app -> preencher dados -> assistir ad virtual -> tela de dieta validada).

## 🗄️ 5. Time de DBA (Database Administrators)
**Visão de Dados:** A infra atualizou a política de TTL de 30 dias com sucesso, mas há débitos técnicos pendentes.
* **Ausência de Backup Ativo:** Firestore Point-in-Time Recovery (PITR) não foi explicitamente abordado/configurado.
* **Leituras Desnecessárias:** A função `getDietsFromFirestore` puxa e parseia dados direto do front, embora a gente já tenha APIs onCall. Precisamos consolidar um DTO central para a interface da comunicação App-Firestore, para prevenir que o cliente envie dados arbitrários se desvencilhando das Firebase Rules.

## 💻 6. Time de Desenvolvedores Seniores (Arquitetura & Clean Code)
**Visão Técnica:** O código precisa de isolamento de responsabilidades rígido.
* **Acoplamento:** Componentes como `diet/index.tsx` possuem centenas de linhas misturando Camada de Visualização (Text, Views) com lógicas e tipos da dieta. 
* **Falta de Injeção de Dependências:** O Store Zarathustra (Zustand) segura os dados com excelência, mas as chamadas de API do Firebase no arquivo único `firebase.ts` se tornarão "God Classes". 
* **Action:** Refatorar separando em `src/screens`, `src/factories`, `src/domain/models` (TypeScript interfaces universais), aplicando Princípios SOLID.

---

# 🚀 PLANO DE ATAQUE CONJUNTO (Checklist de Execução Direta)

Caso você ordene, assumirei a execução seguindo fielmente a cartilha de Integração Contínua e TDD. Nossas próximas 4 grandes Sprints deveriam ser:

- [ ] **Sprint 1 (Fundação & TDD):** Instalar `jest` (mobile e backend). Escrever 3 testes vitais falhando e arrumar os códigos até os testes passarem. Criar a documentação de arquitetura.
- [ ] **Sprint 2 (DevOps & CI):** Criar `.github/workflows/ci.yml`. Adicionar os steps de `npm run test`, `npm run build` na nuvem para blindar o código.
- [ ] **Sprint 3 (Segurança Max):** Ligar AppCheck, assinar App com regras rígidas do Firestore, embutir Aceite de Política de Privacidade na UI de forma Limpa.
- [ ] **Sprint 4 (Refatoração Limpa):** Segmentar a `diet/index.tsx` em submódulos (`<MacroCard />`, `<MealList />`, etc.).
