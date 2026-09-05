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

// Upload Status WA HD — pairing + kirim ke nomor WhatsApp sendiri.
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
const waMemberStatus = document.getElementById("waMemberStatus");
const waPairBtn = document.getElementById("waPairBtn");
const waPairResult = document.getElementById("waPairResult");
const waPairDetail = document.getElementById("waPairDetail");
const waCopyPairBtn = document.getElementById("waCopyPairBtn");
let waSelectedFile = null;
let waSelectedObjectUrl = null;
let waPairingCode = "";
let waPaired = false;

function openWaHdTool(){ if(!waHdWorkspace)return; waHdWorkspace.hidden=false; waHdWorkspace.scrollIntoView({behavior:"smooth",block:"start"}); }
function closeWaHdTool(){ resetWaHdTool(); }
if(openWaHdBtn)openWaHdBtn.addEventListener("click",openWaHdTool);
if(closeWaHdBtn)closeWaHdBtn.addEventListener("click",closeWaHdTool);

if(waHdInput) waHdInput.addEventListener("change",()=>processWaHdFile(waHdInput.files?.[0]));
if(waTargetInput) waTargetInput.addEventListener("input",()=>{waPaired=false; waPairingCode=""; clearMemberStatus(); updateWaHdState();});
if(waDropzone){
  ["dragover","dragenter"].forEach(t=>waDropzone.addEventListener(t,e=>{e.preventDefault();waDropzone.classList.add("dragging");}));
  ["dragleave","drop"].forEach(t=>waDropzone.addEventListener(t,e=>{e.preventDefault();waDropzone.classList.remove("dragging");}));
  waDropzone.addEventListener("drop",e=>{const f=e.dataTransfer.files?.[0];if(f)processWaHdFile(f);});
}
if(waPairBtn) waPairBtn.addEventListener("click", requestPairing);
if(waSendBtn) waSendBtn.addEventListener("click", handleSelfSend);
if(waCopyPairBtn) waCopyPairBtn.addEventListener("click", async()=>{if(!waPairingCode)return;try{await navigator.clipboard.writeText(waPairingCode);showToast("Kode pairing disalin.");}catch{showToast("Salin kode secara manual.");}});

function normalizeWaNumber(v){const d=String(v||"").replace(/\D/g,"");if(d.startsWith("62"))return d;if(d.startsWith("0"))return `62${d.slice(1)}`;if(d.startsWith("8"))return `62${d}`;return d;}
function isSupportedWaMedia(f){return !!f&&/^(image\/(jpeg|png|webp)|video\/(mp4|quicktime|webm))$/.test(f.type);}
function formatBytes(b){if(!Number.isFinite(b))return "-";if(b<1024)return `${b} B`;if(b<1048576)return `${(b/1024).toFixed(1)} KB`;if(b<1073741824)return `${(b/1048576).toFixed(2)} MB`;return `${(b/1073741824).toFixed(2)} GB`;}
function formatDuration(s){if(!Number.isFinite(s))return "-";const t=Math.max(0,Math.round(s));return `${Math.floor(t/60)}:${String(t%60).padStart(2,"0")}`;}
function processWaHdFile(file){
  if(!file)return;
  if(!isSupportedWaMedia(file)){showToast("Pilih foto JPG/PNG/WebP atau video MP4/MOV/WebM.");return;}
  if(file.size>200*1024*1024){showToast("Ukuran media maksimal 200 MB.");return;}
  if(waSelectedObjectUrl)URL.revokeObjectURL(waSelectedObjectUrl);
  waSelectedFile=file;waSelectedObjectUrl=URL.createObjectURL(file);
  waMediaPreview.hidden=false;waHdResult.hidden=false;waPreviewMedia.innerHTML="";
  if(file.type.startsWith("video/")){
    const v=document.createElement("video");v.controls=true;v.playsInline=true;v.preload="metadata";v.src=waSelectedObjectUrl;
    v.addEventListener("loadedmetadata",()=>waFileInfo.innerHTML=`<div><span>Nama</span><strong>${escapeHtml(file.name)}</strong></div><div><span>Ukuran</span><strong>${formatBytes(file.size)}</strong></div><div><span>Resolusi</span><strong>${v.videoWidth||"-"} × ${v.videoHeight||"-"}</strong></div><div><span>Durasi</span><strong>${formatDuration(v.duration)}</strong></div><div><span>Format</span><strong>${escapeHtml(file.type)}</strong></div>`);
    waPreviewMedia.appendChild(v);
  }else{
    const img=document.createElement("img");img.alt="Preview foto asli";img.src=waSelectedObjectUrl;
    img.addEventListener("load",()=>waFileInfo.innerHTML=`<div><span>Nama</span><strong>${escapeHtml(file.name)}</strong></div><div><span>Ukuran</span><strong>${formatBytes(file.size)}</strong></div><div><span>Resolusi</span><strong>${img.naturalWidth||"-"} × ${img.naturalHeight||"-"}</strong></div><div><span>Format</span><strong>${escapeHtml(file.type)}</strong></div>`);
    waPreviewMedia.appendChild(img);
  }
  waFileInfo.innerHTML=`<div><span>Nama</span><strong>${escapeHtml(file.name)}</strong></div><div><span>Ukuran</span><strong>${formatBytes(file.size)}</strong></div>`;
  updateWaHdState();
}
function updateWaHdState(){
  const number=normalizeWaNumber(waTargetInput?.value);const valid=/^628\d{7,13}$/.test(number);
  if(waSendBtn)waSendBtn.disabled=!(valid&&waSelectedFile&&waPaired);
  if(!waSelectedFile){waSendTitle.textContent="Siap";waSendDetail.textContent="Pairing dulu, lalu pilih media.";return;}
  if(!valid){waSendTitle.textContent="Nomor belum valid";waSendDetail.textContent="Masukkan nomor WhatsApp Indonesia.";return;}
  if(!waPaired){waSendTitle.textContent="Pairing belum selesai";waSendDetail.textContent="Tekan Jadi Bot dan tautkan perangkat di WhatsApp.";return;}
  waSendTitle.textContent="Siap dikirim";waSendDetail.textContent=`${waSelectedFile.name} → chat WhatsApp sendiri`;
}
function setMemberStatus(type,text){if(!waMemberStatus)return;waMemberStatus.hidden=false;waMemberStatus.className=`wa-member-status ${type}`;waMemberStatus.textContent=text;}
function clearMemberStatus(){if(!waMemberStatus)return;waMemberStatus.hidden=true;waMemberStatus.textContent="";waMemberStatus.className="wa-member-status";}

async function requestPairing(){
  const phone=normalizeWaNumber(waTargetInput?.value);
  if(!/^628\d{7,13}$/.test(phone)){showToast("Masukkan nomor WhatsApp terlebih dahulu.");return;}
  waPairBtn.disabled=true;setMemberStatus("checking","Meminta kode pairing…");
  try{
    const r=await fetch("/api/wa/pair",{method:"POST",headers:{"Content-Type":"application/json"},credentials:"same-origin",body:JSON.stringify({phone})});
    const d=await r.json().catch(()=>({}));
    if(d.code==="ALREADY_PAIRED"){
      waPaired=true;
      waPairingCode="";
      if(waPairResult)waPairResult.hidden=true;
      if(waPairDetail)waPairDetail.textContent="";
      setMemberStatus("success",`✓ WhatsApp sudah terhubung${d.pairedNumber?` • ${String(d.pairedNumber).split(":")[0]}`:""}`);
      waPairBtn.textContent="Bot Terhubung ✓";
      showToast("WhatsApp sudah terhubung. Tidak perlu pairing lagi.");
      updateWaHdState();
      return;
    }
    if(!r.ok)throw new Error(d.message||"Gagal mendapatkan kode pairing.");
    if(!d.pairingCode)throw new Error("Server tidak mengirim kode pairing.");
    waPairingCode=d.pairingCode;
    waPairDetail.textContent=`Kode: ${waPairingCode} • WhatsApp → Perangkat tertaut → Tautkan perangkat.`;
    waPairResult.hidden=false;
    setMemberStatus("success","✓ Kode pairing siap");
    showToast("Kode pairing berhasil dibuat.");
    waPairBtn.textContent="Kode Dibuat ✓";
  }catch(e){setMemberStatus("error",`✕ ${e.message}`);showToast(e.message||"Gagal pairing.");}
  finally{waPairBtn.disabled=false;}
}

async function handleSelfSend(){
  const phone=normalizeWaNumber(waTargetInput?.value);
  if(!/^628\d{7,13}$/.test(phone)){showToast("Nomor WhatsApp belum valid.");return;}
  if(!waSelectedFile){showToast("Pilih foto atau video terlebih dahulu.");return;}
  if(!waPaired){showToast("Tautkan perangkat dulu.");return;}
  waSendBtn.disabled=true;setMemberStatus("checking","Mengirim media ke WhatsApp sendiri…");waSendTitle.textContent="Mengirim media…";
  try{
    const form=new FormData();form.append("media",waSelectedFile,waSelectedFile.name);form.append("phone",phone);
    const r=await fetch("/api/wa/send-self",{method:"POST",credentials:"same-origin",body:form});
    const d=await r.json().catch(()=>({}));
    if(!r.ok||d.ok!==true)throw new Error(d.message||"Gagal mengirim media.");
    setMemberStatus("success","✓ Media berhasil dikirim");waSendTitle.textContent="Berhasil";waSendDetail.textContent="Media sudah masuk ke chat WhatsApp sendiri.";showToast("Media berhasil dikirim ke WhatsApp.");
  }catch(e){setMemberStatus("error",`✕ ${e.message}`);waSendTitle.textContent="Gagal mengirim";waSendDetail.textContent=e.message||"Coba lagi.";showToast(e.message||"Gagal mengirim media.");}
  finally{waSendBtn.disabled=false;}
}
function resetWaHdTool(){if(waSelectedObjectUrl)URL.revokeObjectURL(waSelectedObjectUrl);waSelectedObjectUrl=null;waSelectedFile=null;waPairingCode="";waPaired=false;if(waHdWorkspace)waHdWorkspace.hidden=true;if(waHdInput)waHdInput.value="";if(waTargetInput)waTargetInput.value="";if(waMediaPreview)waMediaPreview.hidden=true;if(waHdResult)waHdResult.hidden=true;if(waPairResult)waPairResult.hidden=true;if(waPreviewMedia)waPreviewMedia.innerHTML="";if(waFileInfo)waFileInfo.innerHTML="";if(waSendBtn)waSendBtn.disabled=true;if(waPairBtn)waPairBtn.textContent="Jadi Bot →";clearMemberStatus();}
function escapeHtml(value){return String(value).replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));}
