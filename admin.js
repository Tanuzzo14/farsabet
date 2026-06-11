const CONFIG_KEY = 'farsabet_config';
const ADMIN_SESSION_KEY = 'farsabet_admin_auth';
const MAX_ODD = 7;
const ALL_PIDS = ['birre-0','birre-1','birre-2','birre-3','birre-4','farsa-0','farsa-1','farsa-2','farsa-3','farsa-4'];

const DEFAULT_CONFIG = {
  players: {
    farsa: ['Simone', 'Peppe', 'Andrea', 'Raffaele', 'Luigi F.'],
    birre: ['Gaetano', 'Ale', 'Serafino', 'Diego', 'Luigi B.']
  },
  playerLevels: {
    'birre-0': 'ALTO',
    'birre-1': 'MEDIO',
    'birre-2': 'MEDIO',
    'birre-3': 'BASSO',
    'birre-4': 'PORTIERE',
    'farsa-0': 'ALTO',
    'farsa-1': 'MEDIO',
    'farsa-2': 'MEDIO',
    'farsa-3': 'BASSO',
    'farsa-4': 'PORTIERE'
  },
  playerOdds: {
    'birre-0': [1.35, 1.60, 1.90],
    'birre-1': [1.55, 2.05, 2.60],
    'birre-2': [1.70, 2.20, 2.90],
    'birre-3': [2.35, 3.15, 4.40],
    'birre-4': [5.30, 6.05, 6.80],
    'farsa-0': [1.30, 1.55, 1.85],
    'farsa-1': [1.50, 1.95, 2.50],
    'farsa-2': [1.65, 2.15, 2.85],
    'farsa-3': [2.25, 3.00, 4.20],
    'farsa-4': [5.10, 5.90, 6.60]
  }
};

const LEVEL_RANGES = {
  BASSO: {
    segna: [1.8, 2.8],
    doppietta: [2.2, 3.8],
    tripletta: [3, 5]
  },
  MEDIO: {
    segna: [1.35, 1.9],
    doppietta: [1.65, 2.45],
    tripletta: [2, 3]
  },
  ALTO: {
    segna: [1.1, 1.5],
    doppietta: [1.25, 1.75],
    tripletta: [1.5, 2]
  },
  PORTIERE: {
    segna: [5, 6],
    doppietta: [5.5, 6.7],
    tripletta: [6, 7]
  }
};

if (sessionStorage.getItem(ADMIN_SESSION_KEY) !== '1') {
  window.location.href = 'admin.html';
}

function loadConfig() {
  try {
    const parsed = JSON.parse(localStorage.getItem(CONFIG_KEY)) || {};
    return normalizeConfig(parsed);
  } catch {
    return normalizeConfig({});
  }
}

function normalizeConfig(cfg) {
  const players = {
    farsa: Array(5).fill('').map((_, i) => cfg.players?.farsa?.[i] || DEFAULT_CONFIG.players.farsa[i]),
    birre: Array(5).fill('').map((_, i) => cfg.players?.birre?.[i] || DEFAULT_CONFIG.players.birre[i])
  };

  const playerLevels = {};
  ALL_PIDS.forEach(pid => {
    const lvl = cfg.playerLevels?.[pid];
    playerLevels[pid] = LEVEL_RANGES[lvl] ? lvl : DEFAULT_CONFIG.playerLevels[pid];
  });

  const playerOdds = {};
  ALL_PIDS.forEach(pid => {
    const fallback = DEFAULT_CONFIG.playerOdds[pid];
    const current = cfg.playerOdds?.[pid];
    playerOdds[pid] = sanitizeOdds(current, fallback);
  });

  return { players, playerLevels, playerOdds };
}

function sanitizeOdds(current, fallback) {
  const source = Array.isArray(current) && current.length === 3 ? current : fallback;
  let segna = clampOdd(source[0]);
  let doppietta = clampOdd(Math.max(segna + 0.1, source[1]));
  let tripletta = clampOdd(Math.max(doppietta + 0.1, source[2]));

  if (tripletta >= MAX_ODD && doppietta >= MAX_ODD) {
    doppietta = clampOdd(MAX_ODD - 0.2);
    segna = clampOdd(Math.min(segna, doppietta - 0.1));
  }

  return [
    parseFloat(segna.toFixed(2)),
    parseFloat(doppietta.toFixed(2)),
    parseFloat(tripletta.toFixed(2))
  ];
}

function clampOdd(value) {
  return Math.max(1.05, Math.min(MAX_ODD, Number(value) || 1.05));
}

function saveConfig(cfg) {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(cfg, null, 2));
}

function rand(min, max) {
  return min + Math.random() * (max - min);
}

function generateOddsByLevel(level) {
  const range = LEVEL_RANGES[level] || LEVEL_RANGES.MEDIO;
  const segna = rand(range.segna[0], range.segna[1]);
  const doppietta = Math.max(segna + 0.1, rand(range.doppietta[0], range.doppietta[1]));
  const tripletta = Math.max(doppietta + 0.1, rand(range.tripletta[0], range.tripletta[1]));
  return sanitizeOdds([segna, doppietta, tripletta], [segna, doppietta, tripletta]);
}

function generatePlayerOdds(levels) {
  const odds = {};
  ALL_PIDS.forEach(pid => {
    odds[pid] = generateOddsByLevel(levels[pid]);
  });
  return odds;
}

function renderOddsPreview(config) {
  const container = document.getElementById('odds-preview');
  if (!container) return;

  let html = `
    <div class="odds-preview-table">
      <div class="opr-header">
        <span>Giocatore</span>
        <span>Livello</span>
        <span>Segna</span>
        <span>Doppietta</span>
        <span>Tripletta</span>
      </div>`;

  ALL_PIDS.forEach(pid => {
    const [team, i] = pid.split('-');
    const name = config.players[team][parseInt(i, 10)];
    const teamLabel = team === 'farsa' ? 'Farsa' : 'Birre';
    const teamClass = team;
    const level = config.playerLevels[pid] || 'MEDIO';
    const [s, d, t] = config.playerOdds[pid] || DEFAULT_CONFIG.playerOdds[pid];

    html += `
      <div class="opr-row">
        <span class="opr-name">${escHtml(name)} <span class="player-team ${teamClass}">${teamLabel}</span></span>
        <span class="opr-level">${escHtml(level)}</span>
        <span class="opr-odd">${parseFloat(s).toFixed(2)}</span>
        <span class="opr-odd">${parseFloat(d).toFixed(2)}</span>
        <span class="opr-odd">${parseFloat(t).toFixed(2)}</span>
      </div>`;
  });

  html += '</div>';
  container.innerHTML = html;
}

function populateForm(config) {
  document.querySelectorAll('.player-input').forEach(inp => {
    const team = inp.dataset.team;
    const idx = parseInt(inp.dataset.idx, 10);
    inp.value = config.players[team][idx] || '';
  });

  document.querySelectorAll('.player-level').forEach(sel => {
    sel.value = config.playerLevels[sel.dataset.pid] || 'MEDIO';
  });

  renderOddsPreview(config);
}

function readFormPlayers() {
  const players = { farsa: Array(5).fill(''), birre: Array(5).fill('') };
  document.querySelectorAll('.player-input').forEach(inp => {
    const team = inp.dataset.team;
    const idx = parseInt(inp.dataset.idx, 10);
    players[team][idx] = inp.value.trim() || DEFAULT_CONFIG.players[team][idx];
  });
  return players;
}

function readFormLevels() {
  const levels = {};
  document.querySelectorAll('.player-level').forEach(sel => {
    const level = sel.value;
    levels[sel.dataset.pid] = LEVEL_RANGES[level] ? level : 'MEDIO';
  });
  return levels;
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

let toastTimer = null;
function showToast(msg, bg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.style.background = bg || '';
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3800);
}

document.getElementById('btn-logout').addEventListener('click', () => {
  sessionStorage.removeItem(ADMIN_SESSION_KEY);
  window.location.href = 'admin.html';
});

document.getElementById('btn-regen').addEventListener('click', () => {
  const levels = readFormLevels();
  const newOdds = generatePlayerOdds(levels);
  const players = readFormPlayers();
  renderOddsPreview({ players, playerLevels: levels, playerOdds: newOdds });

  document.getElementById('btn-save').dataset.pendingOdds = JSON.stringify(newOdds);
  showToast('🎲 Nuove quote generate! Tutti gli eventi restano entro quota 7.', '#1a4d2e');
});

document.getElementById('btn-save').addEventListener('click', () => {
  const current = loadConfig();
  const players = readFormPlayers();
  const playerLevels = readFormLevels();

  let playerOdds = current.playerOdds;
  const pending = document.getElementById('btn-save').dataset.pendingOdds;
  if (pending) {
    try { playerOdds = JSON.parse(pending); } catch { playerOdds = current.playerOdds; }
    delete document.getElementById('btn-save').dataset.pendingOdds;
  }

  playerOdds = normalizeConfig({ playerOdds }).playerOdds;

  const next = { players, playerLevels, playerOdds };
  saveConfig(next);
  renderOddsPreview(next);
  showToast('✅ Modifiche salvate! Quote aggiornate in birre.');
});

populateForm(loadConfig());
