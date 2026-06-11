/* ============================================================
   app.js – FarsaBet main page logic
   ============================================================ */

const STORAGE_KEY  = 'farsabet_bets';
const CONFIG_KEY   = 'farsabet_config';

/* ---------- Default config (fallback when no admin data saved) ---------- */
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

/* ---------- Load & apply player config ---------- */
function loadConfig() {
  try {
    return JSON.parse(localStorage.getItem(CONFIG_KEY)) || DEFAULT_CONFIG;
  } catch {
    return DEFAULT_CONFIG;
  }
}

function applyConfig(config) {
  const { players, playerOdds } = config;

  /* Update teams-card lists */
  const elFarsa = document.getElementById('team-players-farsa');
  const elBirre = document.getElementById('team-players-birre');
  if (elFarsa) elFarsa.textContent = players.farsa.join(', ');
  if (elBirre) elBirre.textContent = players.birre.join(', ');

  /* Update marcatori player rows */
  document.querySelectorAll('[data-player-row]').forEach(row => {
    const pid       = row.dataset.playerRow;           // e.g. "birre-0"
    const [team, i] = pid.split('-');
    const name      = players[team][parseInt(i)];
    const teamLabel = team === 'farsa' ? 'Farsa' : 'Birre';
    const odds      = (playerOdds[pid] || DEFAULT_CONFIG.playerOdds[pid]);

    /* Update visible name */
    const nameSpan = row.querySelector('.pn-text');
    if (nameSpan) nameSpan.textContent = name;

    /* Update each bet button */
    const typeLabels = { segna: 'Segna', doppietta: 'Doppietta', tripletta: 'Tripletta' };
    const typeIndex  = { segna: 0, doppietta: 1, tripletta: 2 };
    row.querySelectorAll('[data-bet-type]').forEach(btn => {
      const type  = btn.dataset.betType;
      const odd   = parseFloat(odds[typeIndex[type]]).toFixed(2);
      btn.dataset.bet = `${name} (${teamLabel}) – ${typeLabels[type]}`;
      btn.dataset.odd = odd;
      btn.textContent = odd;
    });
  });
}

/* Apply config before attaching any listeners */
applyConfig(loadConfig());

/* ---------- Tab switching ---------- */
const tabs      = document.querySelectorAll('.tab[data-tab]');
const sections  = document.querySelectorAll('.tab-section');

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('active'));
    sections.forEach(s => s.classList.remove('active'));
    tab.classList.add('active');
    const target = document.getElementById('tab-' + tab.dataset.tab);
    if (target) target.classList.add('active');
  });
});

/* ---------- Modal ---------- */
const overlay      = document.getElementById('modal');
const modalClose   = document.getElementById('modal-close');
const betForm      = document.getElementById('bet-form');
const modalBetName = document.getElementById('modal-bet-name');
const modalBetOdd  = document.getElementById('modal-bet-odd');

let currentBet = null;

/* Attach click to every odds button */
document.querySelectorAll('.odd-btn, .odd-btn-sm').forEach(btn => {
  btn.addEventListener('click', () => {
    currentBet = {
      scommessa: btn.dataset.bet,
      quota:     btn.dataset.odd
    };
    modalBetName.textContent = currentBet.scommessa;
    modalBetOdd.textContent  = '@' + currentBet.quota;
    overlay.classList.add('active');
    document.getElementById('inp-nome').focus();
  });
});

modalClose.addEventListener('click', closeModal);

overlay.addEventListener('click', e => {
  if (e.target === overlay) closeModal();
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal();
});

function closeModal() {
  overlay.classList.remove('active');
  betForm.reset();
}

/* ---------- Form submit – save bet ---------- */
betForm.addEventListener('submit', e => {
  e.preventDefault();

  const nome     = document.getElementById('inp-nome').value.trim();
  const cognome  = document.getElementById('inp-cognome').value.trim();
  const telefono = document.getElementById('inp-telefono').value.trim();
  const importo  = parseFloat(document.getElementById('inp-importo').value);

  if (!nome || !cognome || !telefono || isNaN(importo) || importo <= 0) {
    showToast('⚠️ Compila tutti i campi correttamente.', '#b45309');
    return;
  }

  const quota             = parseFloat(currentBet.quota);
  const vincitaPotenziale = (importo * quota).toFixed(2);

  const bet = {
    id:                Date.now(),
    nome,
    cognome,
    telefono,
    scommessa:         currentBet.scommessa,
    quota:             currentBet.quota,
    importo:           importo.toFixed(2),
    vincitaPotenziale,
    data:              new Date().toISOString()
  };

  /* Persist to localStorage */
  const bets = loadBets();
  bets.push(bet);
  saveBets(bets);

  closeModal();
  showToast(`✅ Scommessa piazzata! ${nome} ${cognome} – ${currentBet.scommessa} @${currentBet.quota} · Vincita potenziale: 🍺 ${vincitaPotenziale}`);
});

/* ---------- Storage helpers ---------- */
function loadBets() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveBets(bets) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bets, null, 2));
}

/* ---------- Toast ---------- */
let toastTimer = null;

function showToast(msg, bg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  if (bg) toast.style.background = bg;
  else    toast.style.background = '';
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3800);
}
