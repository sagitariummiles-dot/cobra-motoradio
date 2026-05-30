// cobra_motoradio - app.js (front‑end)
// Substitua PLAYLIST_API pela URL do Web App que você obteve ao publicar o Apps Script.
// Exemplo: "https://script.google.com/macros/s/AKfycbXXXXXXXXXXXX/exec"

const PLAYLIST_API = "playlist.json";

const $upNextList = document.getElementById('up-next-song-list');
const $list = $upNextList;
const $title     = document.getElementById('track-title-heading');
const $artist    = document.getElementById('track-artist-text');
const $playBtn   = document.getElementById('play-pause-action-btn');
// No separate previous/next buttons in the UI; they are omitted

const audio = new Audio();
// Helper reference to the up‑next list for highlighting

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
    // Add category flag to each track for styling
    tracks.rock = tracks.rock.map(t => ({ ...t, category: 'rock' }));
    tracks.blues = tracks.blues.map(t => ({ ...t, category: 'blues' }));
    tracks.nacional = tracks.nacional.map(t => ({ ...t, category: 'nacional' }));
    renderTrackList();
    loadTrack(0); // carrega a primeira faixa (sem tocar)
  } catch (e) {
    console.error('Erro ao carregar playlist:', e);
    $upNextList.innerHTML = '<li class="error">Não foi possível obter a playlist.</li>';
  }
}

// ---------------------------------------------------------------
// Monta a lista visual (clicável)
// ---------------------------------------------------------------
function renderTrackList() {
  // Empty any existing content
  $upNextList.innerHTML = '';
  const flat = [...tracks.rock, ...tracks.blues, ...tracks.nacional];
  flat.forEach((track, i) => {
    const li = document.createElement('li');
    li.className = 'song-item';
    li.dataset.idx = i;
    li.dataset.category = track.category;
    li.innerHTML = `
      <span class="song-item-idx">${i + 1}</span>
      <div class="song-item-details">
        <div class="song-item-title">${track.name}</div>
        <div class="song-item-artist">${track.artist || ''}</div>
      </div>
      <div class="song-item-category ${track.category}">${track.category}</div>
    `;
    li.addEventListener('click', () => loadTrack(i));
    $upNextList.appendChild(li);
  });
  // Atualiza resumo da programação
  const summaryBadge = document.getElementById('sequence-rule-badge');
  if (summaryBadge) {
    summaryBadge.textContent = `${tracks.rock.length} Rock • ${tracks.blues.length} Blues • ${tracks.nacional.length} Nac`;
  }
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
  const items = $upNextList.querySelectorAll('.song-item');
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
audio.addEventListener('ended', nextTrack);

// Inicia tudo
loadPlaylist();
