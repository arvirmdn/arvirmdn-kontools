
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
  settings: document.getElementById("settingsPage")
};

const pageLabels = {
  overview: "Overview",
  tools: "Tools",
  profile: "Profil",
  youtube: "YouTube",
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
const ytResults = document.getElementById("ytResults");
const ytEmptySlate = document.getElementById("ytEmptySlate");
const ytPlayerWrap = document.getElementById("ytPlayerWrap");
const ytPlayer = document.getElementById("ytPlayer");

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text || "";
  return div.innerHTML;
}

function playYoutubeVideo(videoId) {
  ytPlayer.src = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
  ytPlayerWrap.hidden = false;
  ytPlayerWrap.scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderYtResults(items) {
  ytResults.innerHTML = "";
  if (!items.length) {
    ytEmptySlate.hidden = false;
    ytEmptySlate.querySelector("h3").textContent = "Tidak ada hasil";
    ytEmptySlate.querySelector("p").textContent = "Coba kata kunci lain.";
    return;
  }
  ytEmptySlate.hidden = true;
  items.forEach(item => {
    const card = document.createElement("div");
    card.className = "yt-card";
    card.innerHTML = `
      <img class="yt-thumb" src="${item.thumbnail}" alt="" loading="lazy">
      <div class="yt-card-body">
        <strong>${escapeHtml(item.title)}</strong>
        <small>${escapeHtml(item.channel)}</small>
      </div>`;
    card.addEventListener("click", () => playYoutubeVideo(item.videoId));
    ytResults.appendChild(card);
  });
}

if (ytSearchForm) {
  ytSearchForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const q = ytSearchInput.value.trim();
    if (!q) return;
    ytResults.innerHTML = "";
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
