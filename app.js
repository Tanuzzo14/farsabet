/* ============================================================
   app.js – FarsaBet main page logic
   ============================================================ */

const STORAGE_KEY = 'farsabet_bets';

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
  showToast(`✅ Scommessa piazzata! ${nome} ${cognome} – ${currentBet.scommessa} @${currentBet.quota}`);
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
