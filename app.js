// cobra_motoradio - app.js (front‑end)
// Substitua PLAYLIST_API pela URL do Web App que você obteve ao publicar o Apps Script.
// Exemplo: "https://script.google.com/macros/s/AKfycbXXXXXXXXXXXX/exec"

const PLAYLIST_API = "https://script.google.com/macros/s/AKfycbzHMzizo2tbyzX0vlx7Y-qyqE8AJLk2iUmsFhYNNVs_I585IO4Mnk1d-Y4S2K35xS0a/exec";

const $upNextList = document.getElementById('up-next-song-list');
const $title     = document.getElementById('track-title-heading');
const $artist    = document.getElementById('track-artist-text');
const $playBtn   = document.getElementById('btn-play');
const $prevBtn   = document.getElementById('btn-prev');
const $nextBtn   = document.getElementById('btn-next');

const audio = new Audio();
let tracks = [];
let currentIndex = 0;

// ---------------------------------------------------------------
// Carrega a playlist (JSON) da API
// ---------------------------------------------------------------
async function loadPlaylist() {
  try {
    const resp = await fetch(PLAYLIST_API);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    tracks = await resp.json(); // {rock:[], blues:[], nacional:[]}
    renderTrackList();
    loadTrack(0); // carrega a primeira faixa (sem tocar)
  } catch (e) {
    console.error('Erro ao carregar playlist:', e);
    $list.innerHTML = '<li class="error">Não foi possível obter a playlist.</li>';
  }
}

// ---------------------------------------------------------------
// Monta a lista visual (clicável)
// ---------------------------------------------------------------
function renderTrackList() {
  // Empty any existing content
  $upNextList.innerHTML = '';
  const flat = [...tracks.rock, ...tracks.blues, ...tracks.nacional];
  const ul = document.createElement('ul');
  ul.className = 'song-list-items';
  flat.forEach((track, i) => {
    const li = document.createElement('li');
    li.className = 'track-item';
    li.dataset.idx = i;
    li.textContent = track.name;
    li.addEventListener('click', () => loadTrack(i));
    ul.appendChild(li);
  });
  $upNextList.appendChild(ul);
}

// ---------------------------------------------------------------
// Carrega uma faixa sem tocar
// ---------------------------------------------------------------
function loadTrack(idx) {
  const total = tracks.rock.length + tracks.blues.length + tracks.nacional.length;
  if (idx < 0 || idx >= total) return;
  currentIndex = idx;
  const flat = [...tracks.rock, ...tracks.blues, ...tracks.nacional];
  const t = flat[idx];
  audio.src = t.url;
  $title.textContent  = t.name;
  $artist.textContent = '';
  highlightActiveItem();
  // Add to recently played list (simple prepend)
  const recentList = document.getElementById('recently-played-list');
  if (recentList) {
    const li = document.createElement('li');
    li.textContent = t.name;
    recentList.prepend(li);
    // Keep only last 5 entries
    while (recentList.children.length > 5) recentList.removeChild(recentList.lastChild);
  }
}

// ---------------------------------------------------------------
// Destaca a faixa selecionada na lista
// ---------------------------------------------------------------
function highlightActiveItem() {
  const items = $list.querySelectorAll('.track-item');
  items.forEach(it => it.classList.toggle('active',
      parseInt(it.dataset.idx) === currentIndex));
}

// ---------------------------------------------------------------
// Controles de playback
// ---------------------------------------------------------------
function togglePlay() {
  if (audio.paused) {
    audio.play();
    $playBtn.textContent = '⏸️ Pause';
  } else {
    audio.pause();
    $playBtn.textContent = '▶️ Play';
  }
}
function nextTrack() {
  const total = tracks.rock.length + tracks.blues.length + tracks.nacional.length;
  loadTrack((currentIndex + 1) % total);
  audio.play();
  $playBtn.textContent = '⏸️ Pause';
}
function prevTrack() {
  const total = tracks.rock.length + tracks.blues.length + tracks.nacional.length;
  loadTrack((currentIndex - 1 + total) % total);
  audio.play();
  $playBtn.textContent = '⏸️ Pause';
}

// Eventos da UI
$playBtn.addEventListener('click', togglePlay);
$nextBtn.addEventListener('click', nextTrack);
$prevBtn.addEventListener('click', prevTrack);
audio.addEventListener('ended', nextTrack);

// Inicia tudo
loadPlaylist();
