// Particle generator
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

// Tab slider positioning
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
    document.getElementById('authSubtitle').textContent = 'Masukkan email atau nama pengguna untuk reset';
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

window.addEventListener('load', updateSlider);
window.addEventListener('resize', updateSlider);

function doAuth(action) {
  const authPage = document.getElementById('authPage');
  authPage.style.transition = 'opacity 0.35s ease, transform 0.35s ease';
  authPage.style.opacity = '0';
  authPage.style.transform = 'scale(0.97)';
  setTimeout(() => {
    authPage.style.display = 'none';
    document.getElementById('dashPage').classList.add('active');
  }, 350);
}

function doForgot() {
  const input = document.getElementById('forgotInput').value.trim();
  if (!input) {
    alert('Silakan masukkan email atau nama pengguna.');
    return;
  }
  alert('Link reset kata sandi telah dikirim ke ' + input + ' (simulasi).');
}

function doLogout() {
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
    // Reset sidebar
    const sb = document.getElementById('sidebar');
    sb.classList.remove('collapsed');
    document.getElementById('collapseText').textContent = 'Sembunyikan Menu';
  }, 300);
}

// Sidebar & page routing
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
  sb.classList.toggle('collapsed', sidebarCollapsed);
  if (sidebarCollapsed) {
    txt.textContent = 'Tampilkan Menu';
    icon.innerHTML = '<polyline points="9 18 15 12 9 6"/>';
  } else {
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

// Link to APK simulation
function generateApk() {
  const url = document.getElementById('apkUrl').value.trim();
  if (!url) {
    alert('Masukkan URL terlebih dahulu.');
    return;
  }
  const btn = event.currentTarget;
  const original = btn.innerHTML;
  btn.innerHTML =
    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="animation:spin 1s linear infinite"><circle cx="12" cy="12" r="10" stroke-dasharray="32" stroke-dashoffset="12"/></svg> Memproses...';
  btn.disabled = true;
  setTimeout(() => {
    btn.innerHTML = original;
    btn.disabled = false;
    const domain = url.replace(/^https?:\/\//, '').split('/')[0];
    document.getElementById('apkFileName').textContent = domain + '.apk';
    document.getElementById('apkResult').style.display = 'block';
  }, 1500);
}
