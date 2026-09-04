const sidebar = document.getElementById("sidebar");
const backdrop = document.getElementById("backdrop");
const openSidebar = document.getElementById("openSidebar");
const closeSidebar = document.getElementById("closeSidebar");
const logoutBtn = document.getElementById("logoutBtn");
const toast = document.getElementById("toast");
const photoInput = document.getElementById("photoInput");
const passwordForm = document.getElementById("passwordForm");
const passwordMessage = document.getElementById("passwordMessage");
const navItems = document.querySelectorAll(".nav-item");
const pageName = document.getElementById("pageName");
const pages = {
  overview: document.getElementById("overviewPage"),
  tools: document.getElementById("toolsPage"),
  profile: document.getElementById("profilePage"),
  settings: document.getElementById("settingsPage")
};

const pageLabels = {
  overview: "Overview",
  tools: "Tools",
  profile: "Profil",
  settings: "Pengaturan"
};

function showToast(text) {
  toast.textContent = text;
  toast.classList.add("show");
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(() => toast.classList.remove("show"), 2400);
}

function openNav() {
  sidebar.classList.add("open");
  backdrop.classList.add("show");
}
function closeNav() {
  sidebar.classList.remove("open");
  backdrop.classList.remove("show");
}

function showPage(page) {
  if (!pages[page]) return;
  navItems.forEach(item => item.classList.toggle("active", item.dataset.page === page));
  Object.entries(pages).forEach(([key, el]) => el.classList.toggle("active", key === page));
  pageName.textContent = pageLabels[page];
  // Jangan biarkan workspace tool tetap terbuka saat pindah menu.
  if (page !== "tools" && waHdWorkspace && !waHdWorkspace.hidden) {
    resetWaHdTool();
  }
  if (window.innerWidth < 900) closeNav();
}

openSidebar.addEventListener("click", openNav);
closeSidebar.addEventListener("click", closeNav);
backdrop.addEventListener("click", closeNav);

navItems.forEach(item => {
  item.addEventListener("click", () => showPage(item.dataset.page));
});

document.querySelectorAll("[data-page-target]").forEach(button => {
  button.addEventListener("click", () => showPage(button.dataset.pageTarget));
});

document.getElementById("notifyBtn").addEventListener("click", () => {
  showToast("Belum ada notifikasi baru.");
});

logoutBtn.addEventListener("click", async () => {
  logoutBtn.disabled = true;
  try {
    await fetch("/api/logout", { method: "POST", credentials: "same-origin" });
  } finally {
    window.location.assign("/");
  }
});

function setAvatar(photo, initial) {
  ["avatar", "topAvatar", "profileAvatar"].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    if (photo) {
      el.style.backgroundImage = `url("${photo}")`;
      el.style.backgroundSize = "cover";
      el.style.backgroundPosition = "center";
      el.textContent = "";
      el.classList.add("has-photo");
    } else {
      el.style.backgroundImage = "";
      el.textContent = initial;
      el.classList.remove("has-photo");
    }
  });
}

photoInput.addEventListener("change", async () => {
  const file = photoInput.files && photoInput.files[0];
  if (!file) return;
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) { showToast("Gunakan JPG, PNG, atau WebP."); return; }
  if (file.size > 2 * 1024 * 1024) { showToast("Ukuran foto maksimal 2 MB."); return; }

  const reader = new FileReader();
  reader.onload = async () => {
    try {
      const response = await fetch("/api/profile/photo", {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "same-origin",
        body: JSON.stringify({ photo: reader.result })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Gagal menyimpan foto.");
      setAvatar(data.user.profilePhoto, (data.user.name || "A").charAt(0).toUpperCase());
      showToast("Foto profil berhasil diubah.");
    } catch (error) { showToast(error.message); }
    photoInput.value = "";
  };
  reader.readAsDataURL(file);
});

passwordForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  passwordMessage.textContent = "";
  passwordMessage.className = "form-message";
  const currentPassword = document.getElementById("currentPassword").value;
  const newPassword = document.getElementById("newPassword").value;
  try {
    const response = await fetch("/api/profile/password", {
      method: "POST", headers: { "Content-Type": "application/json" }, credentials: "same-origin",
      body: JSON.stringify({ currentPassword, newPassword })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Gagal mengganti sandi.");
    passwordForm.reset();
    showToast("Sandi berhasil diganti.");
  } catch (error) {
    passwordMessage.textContent = error.message;
    passwordMessage.classList.add("error");
  }
});

fetch("/api/me", { credentials: "same-origin" })
  .then(r => r.json())
  .then(data => {
    if (!data.loggedIn) {
      window.location.assign("/");
      return;
    }
    const user = data.user;
    const initial = (user.name || "A").charAt(0).toUpperCase();
    document.getElementById("userName").textContent = user.name;
    document.getElementById("userEmail").textContent = user.email;
    document.getElementById("heroName").textContent = user.name.split(" ")[0];
    document.getElementById("avatar").textContent = initial;
    document.getElementById("topAvatar").textContent = initial;
    setAvatar(user.profilePhoto, initial);
    document.getElementById("profileName").textContent = user.name;
    document.getElementById("profileEmail").textContent = user.email;
    document.getElementById("profileNameValue").textContent = user.name;
    document.getElementById("profileEmailValue").textContent = user.email;
  })
  .catch(() => window.location.assign("/"));

// Upload Status WA HD — langsung bagikan ke WhatsApp Status.
const waHdInput = document.getElementById("waHdInput");
const waHdWorkspace = document.getElementById("waHdWorkspace");
const openWaHdBtn = document.getElementById("openWaHdBtn");
const closeWaHdBtn = document.getElementById("closeWaHdBtn");
const waDropzone = document.getElementById("waDropzone");
const waMediaPreview = document.getElementById("waMediaPreview");
const waPreviewMedia = document.getElementById("waPreviewMedia");
const waFileInfo = document.getElementById("waFileInfo");
const waHdResult = document.getElementById("waHdResult");
const waSendTitle = document.getElementById("waSendTitle");
const waSendDetail = document.getElementById("waSendDetail");
const waCreateStatusBtn = document.getElementById("waCreateStatusBtn");
let waSelectedFile = null;
let waSelectedObjectUrl = null;

function openWaHdTool() {
  if (!waHdWorkspace) return;
  waHdWorkspace.hidden = false;
  waHdWorkspace.classList.remove("tool-workspace-opening");
  void waHdWorkspace.offsetWidth;
  waHdWorkspace.classList.add("tool-workspace-opening");
  waHdWorkspace.scrollIntoView({ behavior: "smooth", block: "start" });
}
function closeWaHdTool() { resetWaHdTool(); }
if (openWaHdBtn) openWaHdBtn.addEventListener("click", openWaHdTool);
if (closeWaHdBtn) closeWaHdBtn.addEventListener("click", closeWaHdTool);
document.addEventListener("keydown", e => { if (e.key === "Escape" && waHdWorkspace && !waHdWorkspace.hidden) closeWaHdTool(); });
if (waHdInput) waHdInput.addEventListener("change", () => processWaHdFile(waHdInput.files && waHdInput.files[0]));
if (waDropzone) {
  ["dragover", "dragenter"].forEach(type => waDropzone.addEventListener(type, e => { e.preventDefault(); waDropzone.classList.add("dragging"); }));
  ["dragleave", "drop"].forEach(type => waDropzone.addEventListener(type, e => { e.preventDefault(); waDropzone.classList.remove("dragging"); }));
  waDropzone.addEventListener("drop", e => { const f = e.dataTransfer.files?.[0]; if (f) processWaHdFile(f); });
}
if (waCreateStatusBtn) waCreateStatusBtn.addEventListener("click", shareWaStatus);

function isSupportedWaMedia(file) { return !!file && /^(image\/(jpeg|png|webp)|video\/(mp4|quicktime|webm))$/.test(file.type); }
function formatBytes(bytes) {
  if (!Number.isFinite(bytes)) return "-";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}
function formatDuration(seconds) {
  if (!Number.isFinite(seconds)) return "-";
  const t = Math.max(0, Math.round(seconds));
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`;
}
function processWaHdFile(file) {
  if (!file) return;
  if (!isSupportedWaMedia(file)) return showToast("Pilih foto JPG/PNG/WebP atau video MP4/MOV/WebM.");
  if (file.size > 200 * 1024 * 1024) return showToast("Ukuran media maksimal 200 MB.");
  if (waSelectedObjectUrl) URL.revokeObjectURL(waSelectedObjectUrl);
  waSelectedFile = file;
  waSelectedObjectUrl = URL.createObjectURL(file);
  waMediaPreview.hidden = false;
  waHdResult.hidden = true;
  waPreviewMedia.innerHTML = "";
  waCreateStatusBtn.disabled = false;

  if (file.type.startsWith("video/")) {
    const v = document.createElement("video");
    v.controls = true; v.playsInline = true; v.preload = "metadata"; v.src = waSelectedObjectUrl;
    v.addEventListener("loadedmetadata", () => {
      waFileInfo.innerHTML = `<div><span>Nama</span><strong>${escapeHtml(file.name)}</strong></div><div><span>Ukuran</span><strong>${formatBytes(file.size)}</strong></div><div><span>Resolusi</span><strong>${v.videoWidth || "-"} × ${v.videoHeight || "-"}</strong></div><div><span>Durasi</span><strong>${formatDuration(v.duration)}</strong></div><div><span>Format</span><strong>${escapeHtml(file.type)}</strong></div>`;
    });
    waPreviewMedia.appendChild(v);
    waFileInfo.innerHTML = `<div><span>Nama</span><strong>${escapeHtml(file.name)}</strong></div><div><span>Ukuran</span><strong>${formatBytes(file.size)}</strong></div>`;
  } else {
    const img = document.createElement("img");
    img.alt = "Preview foto asli"; img.src = waSelectedObjectUrl;
    img.addEventListener("load", () => {
      waFileInfo.innerHTML = `<div><span>Nama</span><strong>${escapeHtml(file.name)}</strong></div><div><span>Ukuran</span><strong>${formatBytes(file.size)}</strong></div><div><span>Resolusi</span><strong>${img.naturalWidth || "-"} × ${img.naturalHeight || "-"}</strong></div><div><span>Format</span><strong>${escapeHtml(file.type)}</strong></div>`;
    });
    waPreviewMedia.appendChild(img);
    waFileInfo.innerHTML = `<div><span>Nama</span><strong>${escapeHtml(file.name)}</strong></div><div><span>Ukuran</span><strong>${formatBytes(file.size)}</strong></div>`;
  }
}

async function shareWaStatus() {
  if (!waSelectedFile) return showToast("Pilih foto atau video terlebih dahulu.");

  // Android/Chrome tidak menyediakan deep-link resmi untuk langsung membuka
  // composer Status WhatsApp sambil menyisipkan file. Cara paling dekat adalah
  // Web Share dengan file, sehingga WhatsApp bisa dibuka sebagai tujuan share.
  if (!navigator.share) {
    showToast("Gunakan Chrome Android untuk membagikan media ke WhatsApp.");
    return;
  }

  const shareData = { files: [waSelectedFile] };
  if (navigator.canShare && !navigator.canShare({ files: [waSelectedFile] })) {
    showToast("Media ini tidak bisa dibagikan langsung ke WhatsApp dari browser.");
    return;
  }

  try {
    waCreateStatusBtn.disabled = true;
    waCreateStatusBtn.textContent = "Membuka WhatsApp…";
    await navigator.share(shareData);
    waHdResult.hidden = false;
    waSendTitle.textContent = "WhatsApp dibuka";
    waSendDetail.textContent = "Di WhatsApp, pilih Status saya untuk melanjutkan.";
    showToast("WhatsApp dibuka. Pilih Status saya.");
  } catch (error) {
    if (error && error.name === "AbortError") {
      showToast("Bagikan dibatalkan.");
    } else {
      showToast(error.message || "Gagal membuka WhatsApp.");
    }
  } finally {
    waCreateStatusBtn.disabled = false;
    waCreateStatusBtn.innerHTML = 'Buat Status <span>→</span>';
  }
}

function resetWaHdTool() {
  if (waSelectedObjectUrl) URL.revokeObjectURL(waSelectedObjectUrl);
  waSelectedObjectUrl = null; waSelectedFile = null;
  if (waHdWorkspace) waHdWorkspace.hidden = true;
  if (waHdInput) waHdInput.value = "";
  if (waMediaPreview) waMediaPreview.hidden = true;
  if (waHdResult) waHdResult.hidden = true;
  if (waPreviewMedia) waPreviewMedia.innerHTML = "";
  if (waFileInfo) waFileInfo.innerHTML = "";
  if (waCreateStatusBtn) { waCreateStatusBtn.disabled = true; waCreateStatusBtn.textContent = "Buat Status"; }
}
function escapeHtml(value) { return String(value).replace(/[&<>'"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c])); }

