/* ============================================================
   admin.js – FarsaBet admin panel logic
   ============================================================ */

const CONFIG_KEY = 'farsabet_config';
const ADMIN_PASS = 'farsabet2026';

/* ---------- Default config ---------- */
const DEFAULT_CONFIG = {
  players: {
    farsa: ['Simone', 'Peppe', 'Andrea', 'Raffaele', 'Luigi F.'],
    birre: ['Gaetano', 'Ale', 'Serafino', 'Diego', 'Luigi B.']
  },
  playerOdds: {
    'birre-0': [1.10, 1.45, 2.20],
    'birre-1': [1.65, 2.60, 4.50],
    'birre-2': [1.85, 3.20, 6.00],
    'birre-3': [2.10, 4.00, 8.00],
    'birre-4': [2.50, 6.00, 15.00],
    'farsa-0': [1.25, 1.75, 2.80],
    'farsa-1': [1.40, 2.10, 3.50],
    'farsa-2': [2.35, 5.50, 12.00],
    'farsa-3': [3.00, 8.50, 25.00],
    'farsa-4': [3.50, 12.00, 35.00]
  }
};

/* ---------- Skill levels (higher = more likely to score → lower odds) ---------- */
const SKILL = {
  'birre-0': 0.90, // star striker
  'birre-1': 0.60,
  'birre-2': 0.50,
  'birre-3': 0.42,
  'birre-4': 0.36,
  'farsa-0': 0.80, // best on Farsa
  'farsa-1': 0.70,
  'farsa-2': 0.32,
  'farsa-3': 0.22,
  'farsa-4': 0.16
};

/* ---------- Storage helpers ---------- */
function loadConfig() {
  try {
    return JSON.parse(localStorage.getItem(CONFIG_KEY)) || DEFAULT_CONFIG;
  } catch {
    return DEFAULT_CONFIG;
  }
}

function saveConfig(cfg) {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(cfg, null, 2));
}

/* ---------- Random credible odds ---------- */
function generatePlayerOdds() {
  const odds = {};
  Object.entries(SKILL).forEach(([pid, skill]) => {
    const jitter = () => 0.88 + Math.random() * 0.24;      // ±12%
    const segna     = Math.max(1.05, Math.min(9.00, (1 + (1 - skill) * 4.8) * jitter()));
    const doppietta = Math.max(segna + 0.10, segna * (1.35 + Math.random() * 0.55) * jitter());
    const tripletta = Math.max(doppietta + 0.20, doppietta * (1.90 + Math.random() * 1.40) * jitter());
    odds[pid] = [
      parseFloat(segna.toFixed(2)),
      parseFloat(doppietta.toFixed(2)),
      parseFloat(tripletta.toFixed(2))
    ];
  });
  return odds;
}

/* ---------- Render odds preview table ---------- */
function renderOddsPreview(config) {
  const container = document.getElementById('odds-preview');
  if (!container) return;

  const allPids = ['birre-0','birre-1','birre-2','birre-3','birre-4','farsa-0','farsa-1','farsa-2','farsa-3','farsa-4'];

  let html = `
    <div class="odds-preview-table">
      <div class="opr-header">
        <span>Giocatore</span>
        <span>Segna</span>
        <span>Doppietta</span>
        <span>Tripletta</span>
      </div>`;

  allPids.forEach(pid => {
    const [team, i]   = pid.split('-');
    const name        = config.players[team][parseInt(i)];
    const teamLabel   = team === 'farsa' ? 'Farsa' : 'Birre';
    const teamClass   = team;
    const [s, d, t]   = config.playerOdds[pid] || DEFAULT_CONFIG.playerOdds[pid];
    html += `
      <div class="opr-row">
        <span class="opr-name">${escHtml(name)} <span class="player-team ${teamClass}">${teamLabel}</span></span>
        <span class="opr-odd">${parseFloat(s).toFixed(2)}</span>
        <span class="opr-odd">${parseFloat(d).toFixed(2)}</span>
        <span class="opr-odd">${parseFloat(t).toFixed(2)}</span>
      </div>`;
  });

  html += '</div>';
  container.innerHTML = html;
}

/* ---------- Populate form from config ---------- */
function populateForm(config) {
  document.querySelectorAll('.player-input').forEach(inp => {
    const team = inp.dataset.team;
    const idx  = parseInt(inp.dataset.idx);
    inp.value  = config.players[team][idx] || '';
  });
  renderOddsPreview(config);
}

/* ---------- Read player names from form ---------- */
function readFormPlayers() {
  const players = { farsa: Array(5).fill(''), birre: Array(5).fill('') };
  document.querySelectorAll('.player-input').forEach(inp => {
    const team = inp.dataset.team;
    const idx  = parseInt(inp.dataset.idx);
    players[team][idx] = inp.value.trim() || DEFAULT_CONFIG.players[team][idx];
  });
  return players;
}

/* ---------- HTML escape ---------- */
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ---------- Toast ---------- */
let toastTimer = null;
function showToast(msg, bg) {
  const toast = document.getElementById('toast');
  toast.textContent      = msg;
  toast.style.background = bg || '';
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3800);
}

/* ---------- Session state ---------- */
let authed = false;

function showPanel() {
  document.getElementById('gate').hidden  = true;
  document.getElementById('panel').hidden = false;
  authed = true;
  populateForm(loadConfig());
}

function showGate() {
  document.getElementById('gate').hidden  = false;
  document.getElementById('panel').hidden = true;
  authed = false;
  document.getElementById('gate-form').reset();
}

/* ---------- Password gate ---------- */
document.getElementById('gate-form').addEventListener('submit', e => {
  e.preventDefault();
  const val = document.getElementById('inp-pass').value;
  if (val === ADMIN_PASS) {
    document.getElementById('gate-error').hidden = true;
    showPanel();
  } else {
    document.getElementById('gate-error').hidden = false;
  }
});

/* ---------- Logout ---------- */
document.getElementById('btn-logout').addEventListener('click', () => {
  showGate();
});

/* ---------- Regen odds ---------- */
document.getElementById('btn-regen').addEventListener('click', () => {
  const newOdds  = generatePlayerOdds();
  const players  = readFormPlayers();
  renderOddsPreview({ players, playerOdds: newOdds });

  /* Stash new odds in a temp attribute so Save can pick them up */
  document.getElementById('btn-save').dataset.pendingOdds = JSON.stringify(newOdds);
  showToast('🎲 Nuove quote generate! Clicca Salva per confermare.', '#1a4d2e');
});

/* ---------- Save ---------- */
document.getElementById('btn-save').addEventListener('click', () => {
  const current  = loadConfig();
  const players  = readFormPlayers();

  /* Use pending odds if regen was clicked, otherwise keep current */
  let playerOdds = current.playerOdds;
  const pending  = document.getElementById('btn-save').dataset.pendingOdds;
  if (pending) {
    try { playerOdds = JSON.parse(pending); } catch { /* keep current */ }
    delete document.getElementById('btn-save').dataset.pendingOdds;
  }

  saveConfig({ players, playerOdds });
  renderOddsPreview({ players, playerOdds });
  showToast('✅ Modifiche salvate! Il palinsesto è aggiornato.');
});
