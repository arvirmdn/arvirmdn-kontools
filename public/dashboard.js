const sidebar = document.getElementById("sidebar");
const backdrop = document.getElementById("backdrop");
const openSidebar = document.getElementById("openSidebar");
const closeSidebar = document.getElementById("closeSidebar");
const logoutBtn = document.getElementById("logoutBtn");
const toast = document.getElementById("toast");
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
    document.getElementById("profileAvatar").textContent = initial;
    document.getElementById("profileName").textContent = user.name;
    document.getElementById("profileEmail").textContent = user.email;
    document.getElementById("profileNameValue").textContent = user.name;
    document.getElementById("profileEmailValue").textContent = user.email;
  })
  .catch(() => window.location.assign("/"));
