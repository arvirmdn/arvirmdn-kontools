
async function shareMediaFile(file) {
  if (!file) throw new Error("File belum dipilih.");
  // Chrome Android may reject sharing large video Files from a web page.
  // For video, save the original file first and let Android's file/Downloads UI
  // handle the next share step. For smaller/compatible files, try Web Share.
  if (file.type && file.type.startsWith("video/")) {
    downloadMediaFile(file);
    return { downloaded: true };
  }
  if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
    await navigator.share({ files: [file] });
    return { shared: true };
  }
  downloadMediaFile(file);
  return { downloaded: true };
}


function downloadMediaFile(file) {
  const url = URL.createObjectURL(file);
  const a = document.createElement("a");
  a.href = url;
  a.download = file.name || (file.type.startsWith("video/") ? "video.mp4" : "image");
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

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
  youtube: document.getElementById("youtubePage"),
  playlist: document.getElementById("playlistPage"),
  settings: document.getElementById("settingsPage")
};

const pageLabels = {
  overview: "Overview",
  tools: "Tools",
  profile: "Profil",
  youtube: "YouTube",
  playlist: "Playlist",
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
      if (window.playSuccessSound) window.playSuccessSound();
      showToast("Foto profil berhasil diubah.");
    } catch (error) {
      if (window.playErrorSound) window.playErrorSound();
      showToast(error.message);
    }
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
    if (window.playSuccessSound) window.playSuccessSound();
    showToast("Sandi berhasil diganti.");
  } catch (error) {
    if (window.playErrorSound) window.playErrorSound();
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

// ===== YouTube: cari & tonton di dashboard =====
const ytSearchForm = document.getElementById("ytSearchForm");
const ytSearchInput = document.getElementById("ytSearchInput");
const ytClearInput = document.getElementById("ytClearInput");
const ytResults = document.getElementById("ytResults");
const ytResultsHead = document.getElementById("ytResultsHead");
const ytResultsCount = document.getElementById("ytResultsCount");
const ytClearResults = document.getElementById("ytClearResults");
const ytEmptySlate = document.getElementById("ytEmptySlate");
const ytPlayerWrap = document.getElementById("ytPlayerWrap");
const ytPlayerFrame = document.getElementById("ytPlayerFrame");
const ytAudioBar = document.getElementById("ytAudioBar");
const ytAudioTitle = document.getElementById("ytAudioTitle");
const ytAudioModeToggle = document.getElementById("ytAudioModeToggle");
const ytPlayPauseBtn = document.getElementById("ytPlayPauseBtn");
const ytPlayIcon = document.getElementById("ytPlayIcon");
const ytPauseIcon = document.getElementById("ytPauseIcon");
const ytPlayPauseLabel = document.getElementById("ytPlayPauseLabel");
const playlistResults = document.getElementById("playlistResults");
const playlistEmptySlate = document.getElementById("playlistEmptySlate");

const YT_AUDIO_MODE_KEY = "kontools_yt_audio_mode";
let ytPlayerInstance = null;
let ytApiReady = false;
let ytPendingVideo = null;
let currentPlaylist = [];

function toggleYtClearInputBtn() {
  ytClearInput.hidden = ytSearchInput.value.length === 0;
}
ytSearchInput.addEventListener("input", toggleYtClearInputBtn);
ytClearInput.addEventListener("click", () => {
  ytSearchInput.value = "";
  toggleYtClearInputBtn();
  ytSearchInput.focus();
});

function resetYtResultsView() {
  ytResults.innerHTML = "";
  ytResultsHead.hidden = true;
  ytPlayerWrap.hidden = true;
  if (ytPlayerInstance && ytPlayerInstance.stopVideo) ytPlayerInstance.stopVideo();
  updatePlayPauseUi(false);
  ytEmptySlate.hidden = false;
  ytEmptySlate.querySelector("h3").textContent = "Cari video untuk mulai nonton";
  ytEmptySlate.querySelector("p").textContent = "Hasil pencarian akan muncul di sini dan bisa langsung diputar tanpa keluar dashboard.";
}
ytClearResults.addEventListener("click", () => {
  resetYtResultsView();
  if (window.playTouchSound) window.playTouchSound();
});

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text || "";
  return div.innerHTML;
}

// ----- Mode Hemat Data (audio-only visual) -----
ytAudioModeToggle.checked = localStorage.getItem(YT_AUDIO_MODE_KEY) === "1";

function applyAudioModeVisual() {
  const on = ytAudioModeToggle.checked;
  ytPlayerFrame.classList.toggle("audio-hidden", on);
  ytAudioBar.hidden = !on;
  if (on && ytPlayerInstance && ytPlayerInstance.setPlaybackQuality) {
    try { ytPlayerInstance.setPlaybackQuality("tiny"); } catch (e) {}
  }
}
ytAudioModeToggle.addEventListener("change", () => {
  localStorage.setItem(YT_AUDIO_MODE_KEY, ytAudioModeToggle.checked ? "1" : "0");
  applyAudioModeVisual();
  if (window.playTouchSound) window.playTouchSound();
});

// ----- Player via YouTube IFrame API resmi -----
function loadYoutubeIframeApi() {
  if (window.YT && window.YT.Player) { ytApiReady = true; return; }
  if (document.getElementById("ytIframeApiScript")) return;
  const tag = document.createElement("script");
  tag.id = "ytIframeApiScript";
  tag.src = "https://www.youtube.com/iframe_api";
  document.head.appendChild(tag);
}
window.onYouTubeIframeAPIReady = function () {
  ytApiReady = true;
  if (ytPendingVideo) {
    createOrLoadPlayer(ytPendingVideo.videoId, ytPendingVideo.title);
    ytPendingVideo = null;
  }
};

function updatePlayPauseUi(isPlaying) {
  ytPlayIcon.hidden = isPlaying;
  ytPauseIcon.hidden = !isPlaying;
  ytPlayPauseLabel.textContent = isPlaying ? "Sedang diputar" : "Dihentikan";
}

function handleYtStateChange(event) {
  applyAudioModeVisual();
  if (event && typeof event.data === "number") {
    updatePlayPauseUi(event.data === 1); // 1 = YT.PlayerState.PLAYING
  }
}

ytPlayPauseBtn.addEventListener("click", () => {
  if (!ytPlayerInstance || !ytPlayerInstance.getPlayerState) return;
  const state = ytPlayerInstance.getPlayerState();
  if (state === 1) {
    ytPlayerInstance.pauseVideo();
    updatePlayPauseUi(false);
  } else {
    ytPlayerInstance.playVideo();
    updatePlayPauseUi(true);
  }
  if (window.playTouchSound) window.playTouchSound();
});

function createOrLoadPlayer(videoId, title) {
  ytAudioTitle.textContent = title || "";
  if (ytPlayerInstance && ytPlayerInstance.loadVideoById) {
    ytPlayerInstance.loadVideoById(videoId);
    applyAudioModeVisual();
    updatePlayPauseUi(true);
    return;
  }
  ytPlayerInstance = new YT.Player("ytPlayer", {
    videoId,
    playerVars: { autoplay: 1, playsinline: 1 },
    events: {
      onReady: applyAudioModeVisual,
      onStateChange: handleYtStateChange
    }
  });
}

function playYoutubeVideo(videoId, title) {
  ytPlayerWrap.hidden = false;
  ytPlayerWrap.scrollIntoView({ behavior: "smooth", block: "start" });
  if (!ytApiReady) {
    ytPendingVideo = { videoId, title };
    loadYoutubeIframeApi();
    return;
  }
  createOrLoadPlayer(videoId, title);
}

// ----- Simpan/hapus ke Playlist -----
async function addToPlaylist(item, btn) {
  try {
    const response = await fetch("/api/playlist", {
      method: "POST", headers: { "Content-Type": "application/json" }, credentials: "same-origin",
      body: JSON.stringify(item)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Gagal menyimpan ke playlist.");
    currentPlaylist = data.playlist || [];
    renderPlaylist();
    if (window.playSuccessSound) window.playSuccessSound();
    showToast("Ditambahkan ke playlist.");
  } catch (error) {
    if (window.playErrorSound) window.playErrorSound();
    showToast(error.message);
  }
}

async function removeFromPlaylist(videoId) {
  try {
    const response = await fetch(`/api/playlist/${encodeURIComponent(videoId)}`, {
      method: "DELETE", credentials: "same-origin"
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Gagal menghapus dari playlist.");
    currentPlaylist = data.playlist || [];
    renderPlaylist();
    if (window.playTouchSound) window.playTouchSound();
    showToast("Dihapus dari playlist.");
  } catch (error) {
    if (window.playErrorSound) window.playErrorSound();
    showToast(error.message);
  }
}

function renderPlaylist() {
  playlistResults.innerHTML = "";
  if (!currentPlaylist.length) {
    playlistEmptySlate.hidden = false;
    return;
  }
  playlistEmptySlate.hidden = true;
  currentPlaylist.forEach(item => {
    const card = document.createElement("div");
    card.className = "yt-card";
    card.innerHTML = `
      <div class="yt-thumb-wrap">
        <img class="yt-thumb" src="${item.thumbnail}" alt="" loading="lazy">
        <button class="yt-remove-btn" type="button" aria-label="Hapus dari playlist">&times;</button>
      </div>
      <div class="yt-card-body">
        <strong>${escapeHtml(item.title)}</strong>
        <small>${escapeHtml(item.channel)}</small>
      </div>`;
    card.querySelector(".yt-remove-btn").addEventListener("click", (e) => {
      e.stopPropagation();
      removeFromPlaylist(item.videoId);
    });
    card.addEventListener("click", () => {
      showPage("youtube");
      playYoutubeVideo(item.videoId, item.title);
    });
    playlistResults.appendChild(card);
  });
}

function loadPlaylist() {
  fetch("/api/playlist", { credentials: "same-origin" })
    .then(r => r.json())
    .then(data => {
      currentPlaylist = (data && data.playlist) || [];
      renderPlaylist();
    })
    .catch(() => {});
}
loadPlaylist();

function renderYtResults(items) {
  ytResults.innerHTML = "";
  if (!items.length) {
    ytResultsHead.hidden = true;
    ytEmptySlate.hidden = false;
    ytEmptySlate.querySelector("h3").textContent = "Tidak ada hasil";
    ytEmptySlate.querySelector("p").textContent = "Coba kata kunci lain.";
    return;
  }
  ytEmptySlate.hidden = true;
  ytResultsHead.hidden = false;
  ytResultsCount.textContent = `${items.length} hasil ditemukan`;
  items.forEach(item => {
    const card = document.createElement("div");
    card.className = "yt-card";
    card.innerHTML = `
      <div class="yt-thumb-wrap">
        <img class="yt-thumb" src="${item.thumbnail}" alt="" loading="lazy">
        <button class="yt-add-btn" type="button" aria-label="Simpan ke playlist">+</button>
      </div>
      <div class="yt-card-body">
        <strong>${escapeHtml(item.title)}</strong>
        <small>${escapeHtml(item.channel)}</small>
      </div>`;
    card.querySelector(".yt-add-btn").addEventListener("click", (e) => {
      e.stopPropagation();
      addToPlaylist(item);
    });
    card.addEventListener("click", () => playYoutubeVideo(item.videoId, item.title));
    ytResults.appendChild(card);
  });
}

if (ytSearchForm) {
  ytSearchForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const q = ytSearchInput.value.trim();
    if (!q) return;
    ytResults.innerHTML = "";
    ytResultsHead.hidden = true;
    ytEmptySlate.hidden = false;
    ytEmptySlate.querySelector("h3").textContent = "Mencari...";
    ytEmptySlate.querySelector("p").textContent = "Sebentar ya.";
    try {
      const response = await fetch(`/api/youtube/search?q=${encodeURIComponent(q)}`, { credentials: "same-origin" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Gagal mencari video.");
      renderYtResults(data.items || []);
    } catch (error) {
      if (window.playErrorSound) window.playErrorSound();
      ytEmptySlate.hidden = false;
      ytEmptySlate.querySelector("h3").textContent = "Gagal mencari video";
      ytEmptySlate.querySelector("p").textContent = error.message;
    }
  });
}
