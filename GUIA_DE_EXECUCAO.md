# Guia Definitivo: Como Rodar o App Dieta.AI sem Erros

Este projeto utiliza ferramentas nativas muito robustas (como **Firebase** e **Google AdMob**) que não funcionam no aplicativo padrão "Expo Go". Para rodar o app 100% livre de erros (com anúncios e backend), você precisa compilar um Aplicativo de Desenvolvimento Customizado (Dev Client).

Siga os passos rigorosamente:

---

## 🛑 Passo 1: Pare o Servidor Atual
Se você tem um terminal rodando o comando `npx expo start` ou algum erro vermelho na tela, interrompa-o.
1. Vá no seu terminal onde o servidor está rodando.
2. Pressione `Ctrl + C` duas vezes para matar o processo do Expo.

---

## 🔑 Passo 2: Configure o Firebase (`google-services.json`)
O aplicativo precisa das suas chaves de acesso do Firebase para iniciar.
1. Acesse o [Console do Firebase](https://console.firebase.google.com/).
2. Selecione o seu projeto (provavelmente "Dieta.AI" ou similar).
3. Na barra lateral esquerda, clique na **Engrenagem ⚙️** > **Configurações do projeto**.
4. Role para baixo até a seção **Seus aplicativos** e clique no aplicativo **Android**.
5. Baixe o arquivo chamado `google-services.json`.
6. Mova este arquivo *exatamente com esse nome* para a pasta `mobile/` do seu projeto.
   - O caminho deve ficar: `c:\Users\Hugo Garcia\Desktop\android-diet-app\mobile\google-services.json`

---

## 🛠 Passo 3: Prepare o seu Ambiente Android
Como você está no Windows e vamos "fabricar" o app, você precisa do ambiente Android pronto na sua máquina.
1. Feche o emulador do Expo Go (se estiver usando seu celular, desinstale o app "Expo Go" para evitar confusão. Fique tranquilo, não usaremos ele).
2. Abra o **Android Studio**.
3. Inicie o seu Emulador Android (Virtual Device), **ou** conecte seu celular Android via cabo USB com a Depuração USB ativada.
4. Mantenha o dispositivo ligado e na tela inicial.

---

## 🏗 Passo 4: Compile o Aplicativo de Desenvolvimento (Dev Client)
Agora nós vamos construir o aplicativo do zero, incluindo o código do Firebase e AdMob dentro da "casca" do app.
1. Abra um novo terminal no VSCode e tenha certeza de estar na pasta `mobile/`.
2. Digite o seguinte comando e aperte Enter:
   ```bash
   npx expo run:android
   ```
3. O Expo vai baixar as ferramentas do Android (Gradle, SDKs) e compilar todo o projeto java/kotlin. **Isso pode demorar de 2 a 10 minutos na primeira vez**, seja paciente.
4. Quando terminar, o terminal vai instalar um aplicativo chamado **Dieta.AI** (com o ícone do projeto) direto no seu emulador ou celular conectado.

---

## 🚀 Passo 5: Rodando o App no Dia a Dia
O processo demorado acabou! O aplicativo de desenvolvimento já está no seu celular/emulador.

Sempre que você for programar a partir de agora, não use mais `npx expo start`. Para desenvolver, você executará:
```bash
npx expo start --dev-client
```
1. Aperte a tecla `a` no terminal (para abrir no Android).
2. O aplicativo Dieta.AI vai abrir, exibir a tela de carregamento e conectar com o código do seu VSCode! Tudo com Firebase e AdMob 100% nativo.

> **💡 Dica de Ouro:** Se no futuro você instalar *outra* biblioteca que use código nativo (como câmera, mapas, bluetooth), basta rodar `npx expo run:android` novamente para recompilar a "casca" do aplicativo.
