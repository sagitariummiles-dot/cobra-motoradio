# Guia de Transição para a Nuvem (100% Gratuito) ☁️📻

Este guia explica como tirar a **Cobra Motoradio** do seu computador local e colocá-la na nuvem de forma **permanente, estável e 100% gratuita** usando o **Google Drive** e o **Google Apps Script**.

---

## Passo 1: Organizar e Compartilhar no Google Drive

1. Abra o seu **Google Drive** (acesse [drive.google.com](https://drive.google.com)).
2. Crie uma nova pasta principal chamada `Cobra Motoradio`.
3. Clique com o botão direito nesta pasta `Cobra Motoradio`, selecione **Compartilhar** -> **Compartilhar** e altere o Acesso Geral para **"Qualquer pessoa com o link"** (como Leitor).
   > [!IMPORTANT]
   > Este passo é crucial para que o player consiga ler as músicas!
4. Abra a pasta `Cobra Motoradio` no Drive e faça o upload das três pastas de músicas que foram organizadas no seu computador:
   - `PASTA MASTER 1 ROCK CLÁSSICO`
   - `PASTA MASTER 2 BLUES-FOLK`
   - `PASTA MASTER 3 NACIONAL`
5. Anote o **ID da pasta principal** `Cobra Motoradio`. O ID é o código longo de letras e números que fica na barra de endereços do seu navegador quando você está dentro da pasta.
   *Exemplo*: Se a URL for `https://drive.google.com/drive/folders/1aBcDeFgHiJkLmNoPqRsTuVwXyZ123456`, o ID é `1aBcDeFgHiJkLmNoPqRsTuVwXyZ123456`.

---

## Passo 2: Criar a API no Google Apps Script

O Google Apps Script funcionará como o "servidor" da rádio, gerando o arquivo da playlist gratuitamente.

1. Acesse o **Google Apps Script** (em [script.google.com](https://script.google.com)).
2. Clique em **"Novo Projeto"**.
3. Apague todo o código do editor e cole o código fornecido abaixo:

```javascript
// Substitua pelo ID da sua pasta principal do Google Drive anotado no Passo 1
const PASTA_PRINCIPAL_ID = "SEU_ID_AQUI"; 

function doGet() {
  const playlistData = getPlaylistData();
  
  return ContentService.createTextOutput(JSON.stringify(playlistData))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeader("Access-Control-Allow-Origin", "*");
}

function getPlaylistData() {
  const data = {
    rock: [],
    blues: [],
    nacional: []
  };
  
  try {
    const mainFolder = DriveApp.getFolderById(PASTA_PRINCIPAL_ID);
    const subFolders = mainFolder.getFolders();
    
    while (subFolders.hasNext()) {
      const folder = subFolders.next();
      const folderName = folder.getName().toLowerCase();
      
      let category = "";
      if (folderName.includes("rock")) {
        category = "rock";
      } else if (folderName.includes("blues")) {
        category = "blues";
      } else if (folderName.includes("nacional")) {
        category = "nacional";
      }
      
      if (category) {
        scanFolderRecursively(folder, category, data);
      }
    }
  } catch (e) {
    Logger.log("Erro ao escanear pastas: " + e.toString());
  }
  
  return data;
}

function scanFolderRecursively(folder, category, data) {
  // Escanear arquivos da pasta
  const files = folder.getFiles();
  while (files.hasNext()) {
    const file = files.next();
    const fileName = file.getName();
    
    if (fileName.toLowerCase().endsWith(".mp3")) {
      const fileId = file.getId();
      // URL direta de download do Google Drive que o HTML5 Audio consegue tocar
      const url = "https://docs.google.com/uc?export=download&id=" + fileId;
      
      // Limpeza de nome para exibição na UI
      let cleanName = fileName.replace(/\.mp3$/i, "");
      const suffixes = [
        " - Cobra Motoradio - A Radio Rock do Motociclista", 
        " - Cobra MotoRadio - A Radio Rock do Motociclista", 
        " - Cobra Motoradio - A Rario Rock do Motociclista",
        " - Cobra Moto Radio - A Radio Rock do Motociclista",
        " - A Radio Rock do Motociclista"
      ];
      
      for (let k = 0; k < suffixes.length; k++) {
        const idx = cleanName.toLowerCase().indexOf(suffixes[k].toLowerCase());
        if (idx !== -1) {
          cleanName = cleanName.substring(0, idx);
          break;
        }
      }
      
      const parts = cleanName.split(" - ");
      const artist = parts.length >= 2 ? parts[0].trim() : "Artista Desconhecido";
      const title = parts.length >= 2 ? parts[1].trim() : cleanName;
      
      data[category].push({
        name: cleanName,
        artist: artist,
        title: title,
        url: url
      });
    }
  }
  
  // Escanear subpastas de artistas recursivamente
  const subFolders = folder.getFolders();
  while (subFolders.hasNext()) {
    scanFolderRecursively(subFolders.next(), category, data);
  }
}
```

4. Substitua `"SEU_ID_AQUI"` na primeira linha pelo ID da sua pasta principal anotado no Passo 1 (mantenha as aspas).
5. Clique no ícone de disquete (Salvar Projeto) e dê o nome de `Cobra Motoradio API`.

---

## Passo 3: Publicar a API (Web App)

Para expor a API publicamente:

1. No painel do Apps Script, clique no botão azul **Implantar** -> **Nova implantação** (canto superior direito).
2. Clique no ícone de engrenagem (Selecione o tipo) e escolha **"App da Web"**.
3. Preencha as configurações exatamente assim:
   - **Descrição**: `Cobra Motoradio API`
   - **Executar como**: **"Eu"** (sua conta do Google)
   - **Quem tem acesso**: **"Qualquer pessoa"** (isso permite que o site acesse a lista)
4. Clique em **Implantar**.
5. O Google pedirá que você conceda permissões (clique em "Autorizar acesso", selecione sua conta, clique em "Advanced" e depois em "Go to Cobra Motoradio API (unsafe)" para liberar).
6. Copie a **URL do URL do App da Web** gerada (ela termina em `/exec`).
   *Exemplo*: `https://script.google.com/macros/s/AKfycbz.../exec`.

---

## Passo 4: Conectar a API ao Player da Rádio

1. Abra o arquivo `app.js` na pasta do site da sua rádio.
2. Na segunda linha, altere a variável `PLAYLIST_API` para a URL que você acabou de copiar no Passo 3:

```javascript
// Substitua o endereço local pela URL da sua API do Google Apps Script
const PLAYLIST_API = "https://script.google.com/macros/s/AKfycbz.../exec"; 
```

3. Salve o arquivo `app.js`.

---

## Passo 5: Hospedar o Site Gratuitamente (GitHub Pages)

Com a API e as músicas na nuvem, basta hospedar o site de forma gratuita:

1. Crie uma conta gratuita no **GitHub** (se não tiver) em [github.com](https://github.com).
2. Crie um novo repositório chamado `cobra-motoradio` e marque-o como **Público**.
3. Envie os arquivos do site para lá:
   - `index.html`
   - `style.css`
   - `app.js`
   - `logo.png`
4. Vá em **Settings** (Configurações) no seu repositório no GitHub.
5. No menu lateral esquerdo, clique em **Pages**.
6. Em *Build and deployment*, na seção *Source*, selecione **"Deploy from a branch"**.
7. Selecione a branch **"main"** (ou `master`) e a pasta **"/(root)"**, e clique em **Save**.
8. Aguarde cerca de 1 a 2 minutos. O GitHub gerará um link público gratuito e seguro (`https://seu-usuario.github.io/cobra-motoradio/`).

Pronto! Sua rádio estará **100% online na nuvem, funcionando 24 horas por dia, totalmente grátis e sem precisar deixar nenhum computador ligado!** 🏍🔥🐍
