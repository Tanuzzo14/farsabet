/* ============================================================
   scommesse.js – FarsaBet bets history page
   ============================================================ */

const STORAGE_KEY = 'farsabet_bets';

/* ---------- Load bets ---------- */
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

/* ---------- Render ---------- */
function render() {
  const bets      = loadBets();
  const listEl    = document.getElementById('bets-list');
  const countEl   = document.getElementById('stat-count');
  const importoEl = document.getElementById('stat-importo');
  const vincitaEl = document.getElementById('stat-vincita');

  /* Stats */
  const totalImporto = bets.reduce((s, b) => s + parseFloat(b.importo), 0);
  const totalVincita = bets.reduce((s, b) => s + parseFloat(b.vincitaPotenziale), 0);

  countEl.textContent   = bets.length;
  importoEl.textContent = '€' + totalImporto.toFixed(2);
  vincitaEl.textContent = '€' + totalVincita.toFixed(2);

  /* List */
  listEl.innerHTML = '';

  if (bets.length === 0) {
    listEl.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🎰</div>
        <p>Nessuna scommessa ancora piazzata.<br>
           <a href="index.html">Vai al palinsesto</a> e piazza la tua prima scommessa!</p>
      </div>`;
    return;
  }

  /* Show newest first */
  bets.slice().reverse().forEach((bet, idx) => {
    const date = new Date(bet.data).toLocaleString('it-IT', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });

    const card = document.createElement('div');
    card.className = 'bet-card';
    card.dataset.id = bet.id;

    card.innerHTML = `
      <div class="bet-card-left">
        <div class="bettor-name">${escHtml(bet.nome)} ${escHtml(bet.cognome)}</div>
        <div class="bet-selection">📌 ${escHtml(bet.scommessa)}</div>
        <div class="bet-meta">
          <span>📞 ${escHtml(bet.telefono)}</span>
          <span>🕐 ${date}</span>
        </div>
      </div>
      <div class="bet-card-right">
        <div class="bet-amount">€${parseFloat(bet.importo).toFixed(2)}</div>
        <div class="odd-badge-card">@${escHtml(bet.quota)}</div>
        <div class="win-amount">Vincita: €${escHtml(bet.vincitaPotenziale)}</div>
      </div>`;

    listEl.appendChild(card);
  });
}

/* ---------- Escape helper ---------- */
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ---------- Export JSON ---------- */
document.getElementById('btn-export').addEventListener('click', () => {
  const bets = loadBets();
  if (bets.length === 0) {
    showToast('⚠️ Nessuna scommessa da esportare.', '#b45309');
    return;
  }
  const blob = new Blob([JSON.stringify(bets, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = 'farsabet_scommesse.json';
  a.click();
  URL.revokeObjectURL(url);
  showToast('✅ File JSON scaricato!');
});

/* ---------- Clear all ---------- */
document.getElementById('btn-clear').addEventListener('click', () => {
  const bets = loadBets();
  if (bets.length === 0) {
    showToast('⚠️ Non ci sono scommesse da cancellare.', '#b45309');
    return;
  }
  if (confirm(`Sei sicuro di voler cancellare tutte le ${bets.length} scommesse? L'operazione non è reversibile.`)) {
    localStorage.removeItem(STORAGE_KEY);
    render();
    showToast('🗑 Tutte le scommesse sono state cancellate.');
  }
});

/* ---------- Toast ---------- */
let toastTimer = null;

function showToast(msg, bg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.style.background = bg || '';
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3800);
}

/* ---------- Init ---------- */
render();
