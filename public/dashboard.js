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

// Upload Status WA HD — media tetap asli; belum dikirim ke server sampai bot diintegrasikan.
const waHdInput = document.getElementById("waHdInput");
const waHdWorkspace = document.getElementById("waHdWorkspace");
const openWaHdBtn = document.getElementById("openWaHdBtn");
const closeWaHdBtn = document.getElementById("closeWaHdBtn");
const waDropzone = document.getElementById("waDropzone");
const waTargetInput = document.getElementById("waTargetInput");
const waMediaPreview = document.getElementById("waMediaPreview");
const waPreviewMedia = document.getElementById("waPreviewMedia");
const waFileInfo = document.getElementById("waFileInfo");
const waHdResult = document.getElementById("waHdResult");
const waSendTitle = document.getElementById("waSendTitle");
const waSendDetail = document.getElementById("waSendDetail");
const waSendBtn = document.getElementById("waSendBtn");
let waSelectedFile = null;
let waSelectedObjectUrl = null;

if (openWaHdBtn) {
  openWaHdBtn.addEventListener("click", () => {
    waHdWorkspace.hidden = false;
    waHdWorkspace.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

if (closeWaHdBtn) {
  closeWaHdBtn.addEventListener("click", resetWaHdTool);
}

if (waHdInput) {
  waHdInput.addEventListener("change", () => processWaHdFile(waHdInput.files && waHdInput.files[0]));
}

if (waTargetInput) {
  waTargetInput.addEventListener("input", updateWaHdState);
}

if (waDropzone) {
  ["dragover", "dragenter"].forEach(type => waDropzone.addEventListener(type, event => {
    event.preventDefault();
    waDropzone.classList.add("dragging");
  }));
  ["dragleave", "drop"].forEach(type => waDropzone.addEventListener(type, event => {
    event.preventDefault();
    waDropzone.classList.remove("dragging");
  }));
  waDropzone.addEventListener("drop", event => {
    const file = event.dataTransfer.files && event.dataTransfer.files[0];
    if (file) processWaHdFile(file);
  });
}

if (waSendBtn) {
  waSendBtn.addEventListener("click", () => {
    showToast("Bot WhatsApp belum terhubung. Tool sudah siap untuk integrasi bot.");
  });
}

function normalizeWaNumber(value) {
  const digits = String(value || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("62")) return digits;
  if (digits.startsWith("0")) return `62${digits.slice(1)}`;
  if (digits.startsWith("8")) return `62${digits}`;
  return digits;
}

function isSupportedWaMedia(file) {
  return !!file && /^(image\/(jpeg|png|webp)|video\/(mp4|quicktime|webm))$/.test(file.type);
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes)) return "-";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function formatDuration(seconds) {
  if (!Number.isFinite(seconds)) return "-";
  const total = Math.max(0, Math.round(seconds));
  const min = Math.floor(total / 60);
  const sec = String(total % 60).padStart(2, "0");
  return `${min}:${sec}`;
}

function processWaHdFile(file) {
  if (!file) return;
  if (!isSupportedWaMedia(file)) {
    showToast("Pilih foto JPG/PNG/WebP atau video MP4/MOV/WebM.");
    return;
  }
  if (file.size > 200 * 1024 * 1024) {
    showToast("Ukuran media maksimal 200 MB.");
    return;
  }

  if (waSelectedObjectUrl) URL.revokeObjectURL(waSelectedObjectUrl);
  waSelectedFile = file;
  waSelectedObjectUrl = URL.createObjectURL(file);

  waMediaPreview.hidden = false;
  waHdResult.hidden = false;
  waPreviewMedia.innerHTML = "";

  if (file.type.startsWith("video/")) {
    const video = document.createElement("video");
    video.controls = true;
    video.playsInline = true;
    video.preload = "metadata";
    video.src = waSelectedObjectUrl;
    video.addEventListener("loadedmetadata", () => {
      waFileInfo.innerHTML = `
        <div><span>Nama</span><strong>${escapeHtml(file.name)}</strong></div>
        <div><span>Ukuran</span><strong>${formatBytes(file.size)}</strong></div>
        <div><span>Resolusi</span><strong>${video.videoWidth || "-"} × ${video.videoHeight || "-"}</strong></div>
        <div><span>Durasi</span><strong>${formatDuration(video.duration)}</strong></div>
        <div><span>Format</span><strong>${escapeHtml(file.type)}</strong></div>
      `;
    });
    waPreviewMedia.appendChild(video);
    waFileInfo.innerHTML = `<div><span>Nama</span><strong>${escapeHtml(file.name)}</strong></div><div><span>Ukuran</span><strong>${formatBytes(file.size)}</strong></div>`;
  } else {
    const img = document.createElement("img");
    img.alt = "Preview foto asli";
    img.src = waSelectedObjectUrl;
    img.addEventListener("load", () => {
      waFileInfo.innerHTML = `
        <div><span>Nama</span><strong>${escapeHtml(file.name)}</strong></div>
        <div><span>Ukuran</span><strong>${formatBytes(file.size)}</strong></div>
        <div><span>Resolusi</span><strong>${img.naturalWidth || "-"} × ${img.naturalHeight || "-"}</strong></div>
        <div><span>Format</span><strong>${escapeHtml(file.type)}</strong></div>
      `;
    });
    waPreviewMedia.appendChild(img);
    waFileInfo.innerHTML = `<div><span>Nama</span><strong>${escapeHtml(file.name)}</strong></div><div><span>Ukuran</span><strong>${formatBytes(file.size)}</strong></div>`;
  }

  updateWaHdState();
}

function updateWaHdState() {
  const number = normalizeWaNumber(waTargetInput ? waTargetInput.value : "");
  const validNumber = /^628\d{7,13}$/.test(number);
  const ready = validNumber && !!waSelectedFile;

  if (waHdResult) waHdResult.hidden = !waSelectedFile;
  if (waSendBtn) waSendBtn.disabled = !ready;

  if (!waSelectedFile) {
    if (waSendTitle) waSendTitle.textContent = "Media siap";
    if (waSendDetail) waSendDetail.textContent = "Masukkan nomor dan pilih media.";
    return;
  }

  if (!validNumber) {
    waSendTitle.textContent = "Nomor belum valid";
    waSendDetail.textContent = "Masukkan nomor WhatsApp Indonesia, misalnya 81234567890.";
    return;
  }

  waSendTitle.textContent = "Siap dikirim ke bot";
  waSendDetail.textContent = `Target tag: @${number} • file asli dipertahankan`;
}

function resetWaHdTool() {
  if (waSelectedObjectUrl) URL.revokeObjectURL(waSelectedObjectUrl);
  waSelectedObjectUrl = null;
  waSelectedFile = null;
  if (waHdWorkspace) waHdWorkspace.hidden = true;
  if (waHdInput) waHdInput.value = "";
  if (waTargetInput) waTargetInput.value = "";
  if (waMediaPreview) waMediaPreview.hidden = true;
  if (waHdResult) waHdResult.hidden = true;
  if (waPreviewMedia) waPreviewMedia.innerHTML = "";
  if (waFileInfo) waFileInfo.innerHTML = "";
  if (waSendBtn) waSendBtn.disabled = true;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
  })[char]);
}

