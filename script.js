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
    const user = document.getElementById('regUser').value.trim();
    const pass = document.getElementById('regPass').value;
    const confirm = document.getElementById('regConfirm').value;

    if (!user || !pass) { alert('Nama pengguna dan kata sandi wajib diisi.'); return; }
    if (pass !== confirm) { alert('Konfirmasi kata sandi tidak cocok.'); return; }
    if (pass.length < 4) { alert('Kata sandi minimal 4 karakter.'); return; }

    setLoading(btn, true);
    try {
      await api('/api/register', {
        method: 'POST',
        body: JSON.stringify({ username: user, password: pass, device_fingerprint: DEVICE_FINGERPRINT })
      });
      alert('Akun berhasil dibuat! Silakan masuk.');
      switchTab('login');
      document.getElementById('logUser').value = user;
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setLoading(btn, false);
    }
    return;
  }

  if (action === 'masuk') {
    const user = document.getElementById('logUser').value.trim();
    const pass = document.getElementById('logPass').value;

    if (!user || !pass) { alert('Nama pengguna dan kata sandi wajib diisi.'); return; }

    setLoading(btn, true);
    try {
      const data = await api('/api/login', {
        method: 'POST',
        body: JSON.stringify({ username: user, password: pass })
      });
      localStorage.setItem('arvirmdn_token', data.token);
      enterDashboard(data.user);
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setLoading(btn, false);
    }
  }
}

function enterDashboard(user) {
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
  document.getElementById('profilAvatar').textContent = username.charAt(0).toUpperCase();

  const authPage = document.getElementById('authPage');
  authPage.style.transition = 'opacity 0.35s ease, transform 0.35s ease';
  authPage.style.opacity = '0';
  authPage.style.transform = 'scale(0.97)';
  setTimeout(() => {
    authPage.style.display = 'none';
    document.getElementById('dashPage').classList.add('active');
  }, 350);
}

async function checkSession() {
  const token = localStorage.getItem('arvirmdn_token');
  if (!token) return;
  try {
    const data = await api('/api/me', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    if (data.user) enterDashboard(data.user);
  } catch {
    localStorage.removeItem('arvirmdn_token');
  }
}

async function doForgot() {
  const input = document.getElementById('forgotInput').value.trim();
  if (!input) { alert('Silakan masukkan nama pengguna.'); return; }

  try {
    const data = await api('/api/forgot', {
      method: 'POST',
      body: JSON.stringify({ username: input })
    });
    alert('Kata sandi baru: ' + data.newPassword + '\n(Simpan dengan baik!)');
    switchTab('login');
  } catch (err) {
    alert('Error: ' + err.message);
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
    requestAnimationFrame(() => {
      authPage.style.opacity = '0';
      authPage.style.transform = 'scale(0.97)';
      requestAnimationFrame(() => {
        authPage.style.opacity = '1';
        authPage.style.transform = 'scale(1)';
      });
    });
    document.querySelectorAll('.input').forEach(i => (i.value = ''));
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
  const titles = { profil: 'Profil', linktoapk: 'Link to APK', statushd: 'Status HD' };
  document.getElementById('pageTitle').textContent = titles[pageId] || 'Profil';
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const target = document.getElementById('page-' + pageId);
  if (target) target.classList.add('active');
  if (window.innerWidth <= 768) toggleSidebar();
}

// ===== LINK TO APK =====
function generateApk() {
  const url = document.getElementById('apkUrl').value.trim();
  if (!url) { alert('Masukkan URL terlebih dahulu.'); return; }
  const btn = event.currentTarget;
  const original = btn.innerHTML;
  btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="animation:spin 1s linear infinite"><circle cx="12" cy="12" r="10" stroke-dasharray="32" stroke-dashoffset="12"/></svg> Memproses...';
  btn.disabled = true;
  setTimeout(() => {
    btn.innerHTML = original;
    btn.disabled = false;
    const domain = url.replace(/^https?:\/\//, '').split('/')[0];
    document.getElementById('apkFileName').textContent = domain + '.apk';
    document.getElementById('apkResult').style.display = 'block';
  }, 1500);
}
