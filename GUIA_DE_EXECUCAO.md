# Guia Definitivo: Como Rodar o App Dieta.AI sem Erros

Este projeto usa **Supabase** como backend (auth + banco de dados + Edge Functions) e **Google AdMob** para anúncios. Como o AdMob exige código nativo, o app não funciona no "Expo Go" padrão — é preciso compilar um **Dev Client** customizado.

---

## Stack atual

| Camada | Tecnologia |
|---|---|
| Mobile | React Native + Expo 54 + Expo Router |
| Auth + DB | Supabase (auth anônima + PostgreSQL + RLS) |
| Edge Functions | Supabase Edge Functions (Deno) |
| Anúncios | Google AdMob (`react-native-google-mobile-ads`) |
| Estado | Zustand |

---

## 🛑 Passo 1: Pare o servidor atual

Se há um terminal com `npx expo start` rodando, pressione `Ctrl + C` para encerrá-lo.

---

## 🔑 Passo 2: Verifique as variáveis do Supabase

O app já tem as credenciais do Supabase hardcoded em `mobile/src/services/supabaseClient.ts`:

```
URL:  https://vlllpequigilvzqmwrdj.supabase.co
ANON KEY: (presente no arquivo)
```

Se precisar trocar de projeto Supabase:
1. Acesse [supabase.com](https://supabase.com) → seu projeto → **Project Settings** → **API**
2. Copie a **Project URL** e a **anon public key**
3. Atualize `mobile/src/services/supabaseClient.ts`

> **Importante:** Certifique-se de que **Anonymous Sign-ins** está ativado no Supabase Dashboard:
> **Authentication** → **Sign In Methods** → ativar **Allow anonymous sign-ins**

---

## 🗄 Passo 3: Aplique as migrations do banco (primeira vez)

As tabelas do banco são criadas via migration. Se estiver configurando um projeto Supabase novo:

```bash
# Na raiz do projeto
npx supabase login
npx supabase link --project-ref vlllpequigilvzqmwrdj
npx supabase db push
```

As Edge Functions estão em `supabase/functions/` e podem ser deployadas com:

```bash
npx supabase functions deploy generate-diet
npx supabase functions deploy get-diet-history
npx supabase functions deploy swap-meal-food
npx supabase functions deploy cleanup-expired
```

---

## 🛠 Passo 4: Prepare o ambiente Android

1. Abra o **Android Studio** e inicie um Emulador Android (Virtual Device)  
   **ou** conecte seu celular Android via USB com **Depuração USB** ativada
2. Confirme que o dispositivo está visível:
   ```bash
   adb devices
   ```

---

## 🏗 Passo 5: Compile o Dev Client (primeira vez)

O Dev Client inclui o código nativo do AdMob. Compile a partir da pasta `mobile/`:

```bash
cd mobile
npx expo run:android
```

- Isso baixa dependências Android (Gradle, SDKs) e compila o projeto Kotlin/Java
- **Pode demorar de 5 a 15 minutos na primeira vez**
- Ao terminar, instala o app **Dieta.AI** no dispositivo/emulador automaticamente

---

## 🚀 Passo 6: Desenvolvimento do dia a dia

Com o Dev Client instalado, para desenvolver basta rodar:

```bash
cd mobile
npx expo start --dev-client
```

1. Pressione `a` no terminal para abrir no Android
2. O app abre com hot reload — alterações no código refletem automaticamente

> **Dica:** Só é necessário rodar `npx expo run:android` novamente se você instalar uma biblioteca com código nativo novo (câmera, biometria, etc.).

---

## 🗂 Estrutura do projeto

```
android-diet-app/
├── mobile/          ← App React Native (Expo)
│   ├── app/         ← Telas (Expo Router, file-based)
│   ├── src/
│   │   ├── services/
│   │   │   ├── supabase.ts       ← API de dados (auth, diary, water, etc.)
│   │   │   └── supabaseClient.ts ← Instância do cliente Supabase
│   │   ├── stores/  ← Estado global (Zustand)
│   │   └── components/
│   └── constants/colors.ts
├── supabase/
│   ├── functions/   ← Edge Functions (Deno)
│   │   ├── generate-diet/    ← Geração de dieta via IA (GitHub Models)
│   │   ├── get-diet-history/ ← Histórico de dietas
│   │   ├── swap-meal-food/   ← Troca de alimentos via IA
│   │   └── cleanup-expired/  ← Limpeza agendada de dados expirados
│   └── migrations/
│       └── 001_initial_schema.sql ← Schema completo do banco
└── backend/         ← Serviço Express/Prisma auxiliar (opcional)
```

---

## ❗ Erros comuns

| Erro | Causa | Solução |
|---|---|---|
| `Anonymous sign-ins are disabled` | Login anônimo desativado no Supabase | Ativar em **Authentication → Sign In Methods** |
| `No 'iosAppId' was provided` | AdMob sem ID iOS | Ignorar se só desenvolver para Android |
| App trava na tela branca | Falha silenciosa de auth | Ver logs no terminal do Expo |
| `supabase: command not found` | CLI não instalada | `npm install -g supabase` |
