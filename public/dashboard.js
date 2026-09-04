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

// Upload Status WA HD — sistem token sederhana.
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
const waMemberStatus = document.getElementById("waMemberStatus");
const waGenerateTokenBtn = document.getElementById("waGenerateTokenBtn");
const waBotBtn = document.getElementById("waBotBtn");
const waTokenValue = document.getElementById("waTokenValue");
const waTokenStatus = document.getElementById("waTokenStatus");
let waSelectedFile = null;
let waSelectedObjectUrl = null;
let waToken = "";

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
  waDropzone.addEventListener("drop", e => { const f=e.dataTransfer.files?.[0]; if(f) processWaHdFile(f); });
}
if (waGenerateTokenBtn) waGenerateTokenBtn.addEventListener("click", generateWaToken);
if (waBotBtn) waBotBtn.addEventListener("click", sendWaTokenToBot);

function isSupportedWaMedia(file) { return !!file && /^(image\/(jpeg|png|webp)|video\/(mp4|quicktime|webm))$/.test(file.type); }
function formatBytes(bytes) {
  if (!Number.isFinite(bytes)) return "-";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024*1024) return `${(bytes/1024).toFixed(1)} KB`;
  if (bytes < 1024*1024*1024) return `${(bytes/(1024*1024)).toFixed(2)} MB`;
  return `${(bytes/(1024*1024*1024)).toFixed(2)} GB`;
}
function formatDuration(seconds) { if(!Number.isFinite(seconds)) return "-"; const t=Math.max(0,Math.round(seconds)); return `${Math.floor(t/60)}:${String(t%60).padStart(2,"0")}`; }
function setTokenStatus(type, text) { if(!waMemberStatus)return; waMemberStatus.hidden=false; waMemberStatus.className=`wa-member-status ${type}`; waMemberStatus.textContent=text; }
function processWaHdFile(file) {
  if (!file) return;
  if (!isSupportedWaMedia(file)) return showToast("Pilih foto JPG/PNG/WebP atau video MP4/MOV/WebM.");
  if (file.size > 200*1024*1024) return showToast("Ukuran media maksimal 200 MB.");
  if (waSelectedObjectUrl) URL.revokeObjectURL(waSelectedObjectUrl);
  waSelectedFile=file; waSelectedObjectUrl=URL.createObjectURL(file); waToken="";
  waTokenValue.textContent="—"; waTokenStatus.textContent="Upload selesai. Tekan Generate Token.";
  waGenerateTokenBtn.disabled=false; waBotBtn.disabled=true; waHdResult.hidden=true; waMemberStatus.hidden=true;
  waMediaPreview.hidden=false; waPreviewMedia.innerHTML="";
  if(file.type.startsWith("video/")) {
    const v=document.createElement("video"); v.controls=true; v.playsInline=true; v.preload="metadata"; v.src=waSelectedObjectUrl;
    v.addEventListener("loadedmetadata",()=>{waFileInfo.innerHTML=`<div><span>Nama</span><strong>${escapeHtml(file.name)}</strong></div><div><span>Ukuran</span><strong>${formatBytes(file.size)}</strong></div><div><span>Resolusi</span><strong>${v.videoWidth||"-"} × ${v.videoHeight||"-"}</strong></div><div><span>Durasi</span><strong>${formatDuration(v.duration)}</strong></div><div><span>Format</span><strong>${escapeHtml(file.type)}</strong></div>`;});
    waPreviewMedia.appendChild(v); waFileInfo.innerHTML=`<div><span>Nama</span><strong>${escapeHtml(file.name)}</strong></div><div><span>Ukuran</span><strong>${formatBytes(file.size)}</strong></div>`;
  } else {
    const img=document.createElement("img"); img.alt="Preview foto asli"; img.src=waSelectedObjectUrl;
    img.addEventListener("load",()=>{waFileInfo.innerHTML=`<div><span>Nama</span><strong>${escapeHtml(file.name)}</strong></div><div><span>Ukuran</span><strong>${formatBytes(file.size)}</strong></div><div><span>Resolusi</span><strong>${img.naturalWidth||"-"} × ${img.naturalHeight||"-"}</strong></div><div><span>Format</span><strong>${escapeHtml(file.type)}</strong></div>`;});
    waPreviewMedia.appendChild(img); waFileInfo.innerHTML=`<div><span>Nama</span><strong>${escapeHtml(file.name)}</strong></div><div><span>Ukuran</span><strong>${formatBytes(file.size)}</strong></div>`;
  }
}
async function generateWaToken() {
  if (!waSelectedFile) return showToast("Pilih foto atau video terlebih dahulu.");
  waGenerateTokenBtn.disabled=true; waBotBtn.disabled=true; waTokenStatus.textContent="Membuat token dan mengirim media ke bot…";
  setTokenStatus("checking","Mengirim media ke nomor bot…");
  try {
    const form=new FormData();
    form.append("media",waSelectedFile,waSelectedFile.name);
    const r=await fetch("/api/wa/generate-token",{method:"POST",credentials:"same-origin",body:form});
    const d=await r.json().catch(()=>({}));
    if(!r.ok||!d.ok) throw new Error(d.message||"Gagal membuat token.");
    waToken=d.token;
    waTokenValue.textContent=waToken;
    waTokenStatus.textContent="Token siap. Langsung kirim token ini ke group WhatsApp.";
    waHdResult.hidden=false;
    waSendTitle.textContent="Token siap";
    waSendDetail.textContent=`${waToken} • media sudah diterima bot. Kirim token ini ke group WhatsApp.`;
    setTokenStatus("success","✓ Token dibuat • media sudah masuk ke bot");
    showToast("Token siap. Kirim ke group WhatsApp.");
  } catch(e) {
    waGenerateTokenBtn.disabled=false;
    waTokenStatus.textContent="Gagal membuat token.";
    setTokenStatus("error",`✕ ${e.message}`);
    showToast(e.message);
  }
}
async function sendWaTokenToBot() {
  if(!waSelectedFile||!waToken) return showToast("Generate token terlebih dahulu.");
  waBotBtn.disabled=true; waGenerateTokenBtn.disabled=true; setTokenStatus("checking","Mengirim media ke nomor bot…"); waTokenStatus.textContent="Mengirim media ke bot…";
  try {
    const form=new FormData(); form.append("token",waToken); form.append("media",waSelectedFile,waSelectedFile.name);
    const r=await fetch("/api/wa/token-media",{method:"POST",credentials:"same-origin",body:form}); const d=await r.json().catch(()=>({}));
    if(!r.ok||d.ok!==true) throw new Error(d.message||"Bot gagal menerima media.");
    setTokenStatus("success","✓ Media sudah masuk ke nomor bot"); waTokenStatus.textContent="Sekarang kirim token ini ke group WhatsApp."; waSendTitle.textContent="Jadi Bot berhasil"; waSendDetail.textContent=`Kirim ${waToken} ke group WhatsApp.`; showToast("Media berhasil dikirim ke nomor bot.");
  } catch(e) { waBotBtn.disabled=false; waGenerateTokenBtn.disabled=false; setTokenStatus("error",`✕ ${e.message}`); waTokenStatus.textContent="Gagal mengirim ke bot."; showToast(e.message); }
}
function resetWaHdTool() {
  if(waSelectedObjectUrl) URL.revokeObjectURL(waSelectedObjectUrl);
  waSelectedObjectUrl=null; waSelectedFile=null; waToken="";
  if(waHdWorkspace) waHdWorkspace.hidden=true; if(waHdInput) waHdInput.value=""; if(waMediaPreview) waMediaPreview.hidden=true; if(waHdResult) waHdResult.hidden=true; if(waPreviewMedia) waPreviewMedia.innerHTML=""; if(waFileInfo) waFileInfo.innerHTML="";
  if(waGenerateTokenBtn) waGenerateTokenBtn.disabled=true; if(waBotBtn) waBotBtn.disabled=true; if(waTokenValue) waTokenValue.textContent="—"; if(waTokenStatus) waTokenStatus.textContent="Upload media lalu generate token."; if(waMemberStatus){waMemberStatus.hidden=true;waMemberStatus.textContent="";}
}
function escapeHtml(value) { return String(value).replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c])); }
