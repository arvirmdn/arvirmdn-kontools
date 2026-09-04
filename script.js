// ===== KONFIGURASI BACKEND =====
// Railway akan otomatis detect domain sendiri
const API_URL = '';  // Kosong = same origin

// ===== DEVICE FINGERPRINT =====
function getDeviceFingerprint() {
  // Kombinasi beberapa data device untuk membuat fingerprint unik
  const raw = [
    navigator.userAgent,
    navigator.platform,
    navigator.language,
    screen.width + 'x' + screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    navigator.hardwareConcurrency || 'unknown',
    navigator.deviceMemory || 'unknown'
  ].join('::');

  // Simple hash function
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return 'fp_' + Math.abs(hash).toString(16);
}

const DEVICE_FINGERPRINT = getDeviceFingerprint();

// ===== PARTICLES =====
(function() {
  const container = document.getElementById('particles');
  if (!container) return;
  for (let i = 0; i < 18; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.style.left = Math.random() * 100 + '%';
    p.style.top = Math.random() * 100 + '%';
    p.style.animationDelay = (Math.random() * 8) + 's';
    p.style.animationDuration = (10 + Math.random() * 8) + 's';
    p.style.width = (2 + Math.random() * 3) + 'px';
    p.style.height = p.style.width;
    container.appendChild(p);
  }
})();

// ===== TAB SLIDER =====
function updateSlider() {
  const activeTab = document.querySelector('.tab.active');
  const slider = document.getElementById('tabSlider');
  const container = document.getElementById('tabContainer');
  if (activeTab && slider && container) {
    const rect = activeTab.getBoundingClientRect();
    const cRect = container.getBoundingClientRect();
    slider.style.left = (rect.left - cRect.left) + 'px';
    slider.style.width = rect.width + 'px';
    slider.style.opacity = '1';
  }
}

function switchTab(mode) {
  const isLogin = mode === 'login';
  const isRegister = mode === 'register';
  const isForgot = mode === 'forgot';
  const tabLogin = document.getElementById('tabLogin');
  const tabRegister = document.getElementById('tabRegister');
  const slider = document.getElementById('tabSlider');
  const footer = document.getElementById('authFooter');

  if (isForgot) {
    tabLogin.classList.remove('active');
    tabRegister.classList.remove('active');
    slider.style.opacity = '0';
    document.getElementById('formLogin').classList.remove('active');
    document.getElementById('formRegister').classList.remove('active');
    document.getElementById('formForgot').classList.add('active');
    document.getElementById('authTitle').textContent = 'Lupa Kata Sandi';
    document.getElementById('authSubtitle').textContent = 'Masukkan nama pengguna untuk reset kata sandi';
    footer.style.display = 'none';
  } else {
    tabLogin.classList.toggle('active', isLogin);
    tabRegister.classList.toggle('active', isRegister);
    document.getElementById('formLogin').classList.toggle('active', isLogin);
    document.getElementById('formRegister').classList.toggle('active', isRegister);
    document.getElementById('formForgot').classList.remove('active');
    document.getElementById('authTitle').textContent = isLogin ? 'Masuk ke Akun' : 'Buat Akun Baru';
    document.getElementById('authSubtitle').textContent = isLogin
      ? 'Silakan masuk untuk melanjutkan'
      : 'Daftar untuk mengakses arvirmdn kontools v0.1';
    footer.style.display = '';
    requestAnimationFrame(updateSlider);
  }
}

window.addEventListener('load', function() {
  updateSlider();
  checkSession();
});
window.addEventListener('resize', updateSlider);

// ===== TOASTS =====
const TOAST_ICONS = {
  success: '<path d="M20 6 9 17l-5-5"/>',
  error: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>',
  info: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>'
};
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = 'toast ' + type;
  toast.innerHTML = `
    <svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${TOAST_ICONS[type] || TOAST_ICONS.info}</svg>
    <span class="toast-msg"></span>
    <button class="toast-close" aria-label="Tutup">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </button>`;
  toast.querySelector('.toast-msg').textContent = message;
  const remove = () => {
    toast.classList.add('hide');
    setTimeout(() => toast.remove(), 250);
  };
  toast.querySelector('.toast-close').onclick = remove;
  container.appendChild(toast);
  setTimeout(remove, 4000);
}

// ===== INPUT VALIDATION HELPERS =====
function markError(input) {
  if (!input) return;
  input.classList.remove('success');
  input.classList.add('error');
}
function clearFieldStates(...inputs) {
  inputs.forEach(i => i && i.classList.remove('error', 'success'));
}

// ===== AUTH FUNCTIONS =====
function setLoading(btn, loading) {
  if (loading) {
    btn.dataset.original = btn.innerHTML;
    btn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="animation:spin 1s linear infinite"><circle cx="12" cy="12" r="10" stroke-dasharray="32" stroke-dashoffset="12"/></svg> Memproses...';
    btn.disabled = true;
  } else {
    btn.innerHTML = btn.dataset.original;
    btn.disabled = false;
  }
}

async function api(endpoint, options = {}) {
  const url = (API_URL || window.location.origin) + endpoint;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

async function doAuth(action) {
  const btn = event.currentTarget;

  if (action === 'daftar') {
    const userInput = document.getElementById('regUser');
    const passInput = document.getElementById('regPass');
    const confirmInput = document.getElementById('regConfirm');
    const user = userInput.value.trim();
    const pass = passInput.value;
    const confirm = confirmInput.value;
    clearFieldStates(userInput, passInput, confirmInput);

    if (!user) { markError(userInput); showToast('Nama pengguna wajib diisi.', 'error'); return; }
    if (!pass) { markError(passInput); showToast('Kata sandi wajib diisi.', 'error'); return; }
    if (pass.length < 4) { markError(passInput); showToast('Kata sandi minimal 4 karakter.', 'error'); return; }
    if (pass !== confirm) { markError(confirmInput); showToast('Konfirmasi kata sandi tidak cocok.', 'error'); return; }

    userInput.classList.add('success');
    passInput.classList.add('success');
    confirmInput.classList.add('success');

    setLoading(btn, true);
    try {
      await api('/api/register', {
        method: 'POST',
        body: JSON.stringify({ username: user, password: pass, device_fingerprint: DEVICE_FINGERPRINT })
      });
      showToast('Akun berhasil dibuat! Silakan masuk.', 'success');
      switchTab('login');
      document.getElementById('logUser').value = user;
    } catch (err) {
      showToast(err.message || 'Gagal membuat akun.', 'error');
    } finally {
      setLoading(btn, false);
    }
    return;
  }

  if (action === 'masuk') {
    const userInput = document.getElementById('logUser');
    const passInput = document.getElementById('logPass');
    const user = userInput.value.trim();
    const pass = passInput.value;
    clearFieldStates(userInput, passInput);

    if (!user) { markError(userInput); showToast('Nama pengguna wajib diisi.', 'error'); return; }
    if (!pass) { markError(passInput); showToast('Kata sandi wajib diisi.', 'error'); return; }

    setLoading(btn, true);
    try {
      const data = await api('/api/login', {
        method: 'POST',
        body: JSON.stringify({ username: user, password: pass })
      });
      localStorage.setItem('arvirmdn_token', data.token);
      enterDashboard(data.user);
    } catch (err) {
      markError(passInput);
      showToast(err.message || 'Nama pengguna atau kata sandi salah.', 'error');
    } finally {
      setLoading(btn, false);
    }
  }
}

function enterDashboard(user, skipAnim) {
  const username = user.username || 'Pengguna';
  const joinDate = user.created_at
    ? new Date(user.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
    : '-';

  document.getElementById('userName').textContent = username;
  document.getElementById('profilName').textContent = username;
  document.getElementById('profilEmail').textContent = user.email || '-';
  document.getElementById('profilUid').textContent = 'ID: ' + (user.id || '-');
  document.getElementById('profilUser').textContent = username;
  document.getElementById('profilId').textContent = user.id ? ('ID-' + String(user.id).padStart(6, '0')) : '-';
  document.getElementById('profilJoin').textContent = joinDate;
  const avatarEl = document.getElementById('profilAvatar');
  avatarEl.textContent = username.charAt(0).toUpperCase();
  avatarEl.style.backgroundImage = '';

  const authPage = document.getElementById('authPage');

  if (skipAnim) {
    // Sesi udah valid dari awal load - langsung ke dashboard, auth page nggak pernah kelihatan.
    authPage.style.display = 'none';
    document.getElementById('dashPage').classList.add('active');
    return;
  }

  authPage.style.transition = 'opacity 0.35s ease, transform 0.35s ease';
  authPage.style.opacity = '0';
  authPage.style.transform = 'scale(0.97)';
  setTimeout(() => {
    authPage.style.display = 'none';
    document.getElementById('dashPage').classList.add('active');
  }, 350);
}

async function checkSession() {
  const loader = document.getElementById('appLoader');
  const authPage = document.getElementById('authPage');
  const token = localStorage.getItem('arvirmdn_token');

  if (!token) {
    revealAuthPage();
    return;
  }
  try {
    const data = await api('/api/me', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    if (data.user) {
      enterDashboard(data.user, true);
    } else {
      revealAuthPage();
    }
  } catch {
    localStorage.removeItem('arvirmdn_token');
    revealAuthPage();
  } finally {
    if (loader) loader.classList.add('hide');
  }
}

function revealAuthPage() {
  const loader = document.getElementById('appLoader');
  const authPage = document.getElementById('authPage');
  if (authPage) authPage.style.visibility = 'visible';
  if (loader) loader.classList.add('hide');
}

async function doForgot() {
  const field = document.getElementById('forgotInput');
  const input = field.value.trim();
  clearFieldStates(field);
  if (!input) { markError(field); showToast('Silakan masukkan nama pengguna.', 'error'); return; }

  try {
    const data = await api('/api/forgot', {
      method: 'POST',
      body: JSON.stringify({ username: input })
    });
    showToast('Kata sandi baru: ' + data.newPassword + ' — simpan dengan baik.', 'success');
    switchTab('login');
  } catch (err) {
    markError(field);
    showToast(err.message || 'Gagal reset kata sandi.', 'error');
  }
}

function doLogout() {
  localStorage.removeItem('arvirmdn_token');
  const dashPage = document.getElementById('dashPage');
  dashPage.style.transition = 'opacity 0.3s ease';
  dashPage.style.opacity = '0';
  setTimeout(() => {
    dashPage.classList.remove('active');
    dashPage.style.opacity = '';
    dashPage.style.transition = '';
    const authPage = document.getElementById('authPage');
    authPage.style.display = 'flex';
    authPage.style.visibility = 'visible';
    requestAnimationFrame(() => {
      authPage.style.opacity = '0';
      authPage.style.transform = 'scale(0.97)';
      requestAnimationFrame(() => {
        authPage.style.opacity = '1';
        authPage.style.transform = 'scale(1)';
      });
    });
    document.querySelectorAll('.input').forEach(i => { i.value = ''; i.classList.remove('error', 'success'); });
    document.getElementById('apkResult').classList.remove('show');
    document.getElementById('pwStrength').removeAttribute('data-level');
    document.getElementById('pwStrengthLabel').textContent = 'Minimal 4 karakter';
    const avatar = document.getElementById('profilAvatar');
    avatar.style.backgroundImage = '';
    waFiles = [];
    renderWaGrid();
    switchTab('login');
    goPage('profil', document.querySelector('.nav-item'));
    const sb = document.getElementById('sidebar');
    sb.classList.remove('collapsed');
    sb.style.transform = '';
    sb.style.marginLeft = '';
    sb.style.opacity = '';
    sb.style.pointerEvents = '';
    sidebarCollapsed = false;
    document.getElementById('collapseText').textContent = 'Sembunyikan Menu';
  }, 300);
}

// ===== SIDEBAR & PAGE ROUTING =====
function toggleSidebar() {
  const sb = document.getElementById('sidebar');
  const ov = document.getElementById('sidebarOverlay');
  sb.classList.toggle('open');
  ov.classList.toggle('active');
}

let sidebarCollapsed = false;
function toggleSidebarDesktop() {
  const sb = document.getElementById('sidebar');
  const txt = document.getElementById('collapseText');
  const icon = document.querySelector('#collapseBtn svg');
  sidebarCollapsed = !sidebarCollapsed;

  // PENTING: animasi geser dipaksa lewat inline style di sini (bukan cuma
  // toggle class .collapsed di style.css). Inline style dari JS ini SELALU
  // menang di atas aturan CSS manapun, jadi dijamin kelihatan begitu
  // script.js ini ke-deploy -- gak tergantung lagi apakah style.css yang
  // baru beneran ke-deploy/ke-cache dengan benar di server.
  const w = sb.offsetWidth || 240;
  sb.style.transition = 'transform .35s cubic-bezier(.22,1,.36,1), margin-left .35s cubic-bezier(.22,1,.36,1), opacity .35s ease';

  if (sidebarCollapsed) {
    sb.classList.add('collapsed');
    sb.style.transform = 'translateX(-' + w + 'px)';
    sb.style.marginLeft = '-' + w + 'px';
    sb.style.opacity = '0';
    sb.style.pointerEvents = 'none';
    txt.textContent = 'Tampilkan Menu';
    icon.innerHTML = '<polyline points="9 18 15 12 9 6"/>';
  } else {
    sb.classList.remove('collapsed');
    sb.style.transform = 'translateX(0)';
    sb.style.marginLeft = '0';
    sb.style.opacity = '1';
    sb.style.pointerEvents = '';
    txt.textContent = 'Sembunyikan Menu';
    icon.innerHTML = '<polyline points="15 18 9 12 15 6"/>';
  }
}

function goPage(pageId, el) {
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  if (el) el.classList.add('active');
  const titles = { profil: 'Profil', linktoapk: 'Link to APK', statuswa: 'Status WA HD' };
  document.getElementById('pageTitle').textContent = titles[pageId] || 'Profil';
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const target = document.getElementById('page-' + pageId);
  if (target) target.classList.add('active');
  if (window.innerWidth <= 768 && !sidebarCollapsed) toggleSidebarDesktop();
}

// ===== LINK TO APK =====
function generateApk() {
  const urlInput = document.getElementById('apkUrl');
  const url = urlInput.value.trim();
  clearFieldStates(urlInput);
  if (!url) { markError(urlInput); showToast('Masukkan URL terlebih dahulu.', 'error'); return; }

  const btn = event.currentTarget;
  const original = btn.innerHTML;
  btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="animation:spin 1s linear infinite"><circle cx="12" cy="12" r="10" stroke-dasharray="32" stroke-dashoffset="12"/></svg> Memproses...';
  btn.disabled = true;
  setTimeout(() => {
    btn.innerHTML = original;
    btn.disabled = false;
    urlInput.classList.add('success');
    const domain = url.replace(/^https?:\/\//, '').split('/')[0];
    document.getElementById('apkFileName').textContent = domain + '.apk';
    document.getElementById('apkResult').classList.add('show');
    showToast('APK berhasil dibuat.', 'success');
  }, 1500);
}

// ===== AVATAR UPLOAD =====
function handleAvatarUpload(input) {
  const file = input.files && input.files[0];
  if (!file) return;
  if (!file.type.startsWith('image/')) { showToast('File harus berupa gambar.', 'error'); return; }
  const reader = new FileReader();
  reader.onload = (e) => {
    const avatar = document.getElementById('profilAvatar');
    avatar.style.backgroundImage = `url(${e.target.result})`;
    avatar.textContent = '';
    showToast('Foto profil diperbarui.', 'success');
  };
  reader.readAsDataURL(file);
}

// ===== STATUS WA HD (upload UI) =====
let waFiles = [];

function handleWaUpload(fileList) {
  const files = Array.from(fileList || []);
  if (!files.length) return;
  files.forEach(file => {
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      waFiles.push({ url: e.target.result, type: file.type, name: file.name });
      renderWaGrid();
    };
    reader.readAsDataURL(file);
  });
}

function removeWaFile(index) {
  waFiles.splice(index, 1);
  renderWaGrid();
}

function renderWaGrid() {
  const grid = document.getElementById('waGrid');
  const empty = document.getElementById('waEmpty');
  const count = document.getElementById('waCount');
  count.textContent = waFiles.length + ' file';

  grid.querySelectorAll('.wa-item').forEach(el => el.remove());

  if (!waFiles.length) {
    empty.style.display = 'flex';
    return;
  }
  empty.style.display = 'none';

  waFiles.forEach((f, i) => {
    const item = document.createElement('div');
    item.className = 'wa-item';
    const isVideo = f.type.startsWith('video/');
    item.innerHTML = `
      ${isVideo ? `<video src="${f.url}" muted></video>` : `<img src="${f.url}" alt="${f.name}">`}
      <span class="wa-item-badge">${isVideo ? 'Video' : 'Foto'}</span>
      <button class="wa-item-remove" title="Hapus">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>`;
    item.querySelector('.wa-item-remove').onclick = (ev) => { ev.stopPropagation(); removeWaFile(i); };
    grid.appendChild(item);
  });
}

(function setupWaDropzone() {
  document.addEventListener('DOMContentLoaded', () => {
    const zone = document.getElementById('waDropzone');
    if (!zone) return;
    ['dragenter', 'dragover'].forEach(evt => {
      zone.addEventListener(evt, (e) => { e.preventDefault(); zone.classList.add('drag-over'); });
    });
    ['dragleave', 'drop'].forEach(evt => {
      zone.addEventListener(evt, (e) => { e.preventDefault(); zone.classList.remove('drag-over'); });
    });
    zone.addEventListener('drop', (e) => {
      if (e.dataTransfer && e.dataTransfer.files) handleWaUpload(e.dataTransfer.files);
    });
  });
})();

// Ilangin state error di input begitu user mulai ngetik ulang
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.input').forEach(input => {
    input.addEventListener('input', () => input.classList.remove('error'));
  });
});

// ===== NOTIFICATION DROPDOWN =====
function toggleNotif() {
  document.getElementById('notifDropdown').classList.toggle('open');
}
document.addEventListener('click', (e) => {
  const dropdown = document.getElementById('notifDropdown');
  if (!dropdown || !dropdown.classList.contains('open')) return;
  if (!e.target.closest('.icon-btn') && !e.target.closest('.notif-dropdown')) {
    dropdown.classList.remove('open');
  }
});

// ===== MOBILE SEARCH TOGGLE =====
function toggleMobileSearch() {
  const wrap = document.getElementById('topbarSearchWrap');
  wrap.classList.toggle('open');
  if (wrap.classList.contains('open')) document.getElementById('topbarSearch').focus();
}

// ===== PASSWORD STRENGTH =====
function updatePwStrength(value) {
  const box = document.getElementById('pwStrength');
  const label = document.getElementById('pwStrengthLabel');
  if (!value) {
    box.removeAttribute('data-level');
    label.textContent = 'Minimal 4 karakter';
    return;
  }
  let score = 0;
  if (value.length >= 4) score++;
  if (value.length >= 8 && /[0-9]/.test(value) && /[a-zA-Z]/.test(value)) score++;
  if (value.length >= 10 && /[^a-zA-Z0-9]/.test(value)) score++;
  const level = Math.max(1, score);
  box.setAttribute('data-level', level);
  const labels = { 1: 'Lemah', 2: 'Sedang', 3: 'Kuat' };
  label.textContent = labels[level];
}
