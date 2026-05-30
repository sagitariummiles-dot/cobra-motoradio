// Cobra Motoradio API – Google Apps Script (script criado do zero)
// ------------------------------------------------
// Substitua o valor abaixo pelo ID da pasta do Google Drive que contém as músicas.
const PASTA_PRINCIPAL_ID = "1vS6RPfQo39f2x9KmoOil4B5jbtMW3v8q"; // <--- atualizar se necessário

/**
 * Endpoint público da Web App.
 * Recebe solicitações GET e devolve um JSON com as playlists.
 * @param {Object} e  Evento GET (não utilizado aqui)
 * @return {GoogleAppsScript.Content.TextOutput} JSON com as categorias de músicas.
 */
function doGet(e) {
  const playlists = getPlaylistData();
  return ContentService
    .createTextOutput(JSON.stringify(playlists))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Monta o objeto contendo as três categorias de playlists.
 * @return {Object} { rock: [], blues: [], nacional: [] }
 */
function getPlaylistData() {
  const rootFolder = DriveApp.getFolderById(PASTA_PRINCIPAL_ID);
  const data = { rock: [], blues: [], nacional: [] };
  scanFolderRecursively(rootFolder, data);
  return data;
}

/**
 * Varre recursivamente a pasta e adiciona arquivos às categorias corretas.
 * A categoria é inferida a partir do nome da pasta ou palavras‑chave no nome do arquivo.
 * @param {GoogleAppsScript.Drive.Folder} folder  Pasta a ser percorrida.
 * @param {Object} categorias  Objeto com arrays rock, blues e nacional.
 */
function scanFolderRecursively(folder, categorias) {
  // Processa arquivos da pasta atual
  const files = folder.getFiles();
  while (files.hasNext()) {
    const file = files.next();
    const name = file.getName();
    const url = "https://docs.google.com/uc?export=download&id=" + file.getId();
    const lower = name.toLowerCase();
    if (lower.includes("rock")) {
      categorias.rock.push({ name, url });
    } else if (lower.includes("blues")) {
      categorias.blues.push({ name, url });
    } else if (lower.includes("nacional")) {
      categorias.nacional.push({ name, url });
    }
  }

  // Processa sub‑pastas
  const subfolders = folder.getFolders();
  while (subfolders.hasNext()) {
    const sub = subfolders.next();
    const subName = sub.getName().toLowerCase();
    // Se a subpasta já indica a categoria, passa apenas o array correspondente
    if (subName.includes("rock")) {
      scanFolderRecursively(sub, { rock: categorias.rock, blues: [], nacional: [] });
    } else if (subName.includes("blues")) {
      scanFolderRecursively(sub, { rock: [], blues: categorias.blues, nacional: [] });
    } else if (subName.includes("nacional")) {
      scanFolderRecursively(sub, { rock: [], blues: [], nacional: categorias.nacional });
    } else {
      // Caso genérico, mantém todas as categorias
      scanFolderRecursively(sub, categorias);
    }
  }
}