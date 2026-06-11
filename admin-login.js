const ADMIN_PASS = 'farsabet2026';
const ADMIN_SESSION_KEY = 'farsabet_admin_auth';

if (sessionStorage.getItem(ADMIN_SESSION_KEY) === '1') {
  window.location.href = 'admin-gestione.html';
}

document.getElementById('gate-form').addEventListener('submit', e => {
  e.preventDefault();
  const val = document.getElementById('inp-pass').value;
  if (val === ADMIN_PASS) {
    sessionStorage.setItem(ADMIN_SESSION_KEY, '1');
    document.getElementById('gate-error').hidden = true;
    window.location.href = 'admin-gestione.html';
    return;
  }
  document.getElementById('gate-error').hidden = false;
});
