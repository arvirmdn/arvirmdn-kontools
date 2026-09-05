const form = document.getElementById("authForm");
const tabs = document.querySelectorAll(".tab");
const nameField = document.getElementById("nameField");
const nameInput = document.getElementById("name");
const passwordInput = document.getElementById("password");
const togglePassword = document.getElementById("togglePassword");
const message = document.getElementById("message");
const submitBtn = document.getElementById("submitBtn");
const submitText = document.getElementById("submitText");
const authTitle = document.getElementById("authTitle");
const authSubtitle = document.getElementById("authSubtitle");

let mode = "login";

function setMessage(text = "", type = "") {
  message.textContent = text;
  message.className = "form-message" + (type ? ` ${type}` : "");
}

function setMode(nextMode) {
  mode = nextMode;
  tabs.forEach(tab => tab.classList.toggle("active", tab.dataset.mode === mode));
  const register = mode === "register";
  nameField.classList.toggle("hidden", !register);
  nameInput.required = register;
  authTitle.textContent = register ? "Buat akun baru" : "Masuk ke akun";
  authSubtitle.textContent = register ? "Buat akses pribadi kamu dalam beberapa detik." : "Kelola semuanya dari satu tempat.";
  submitText.textContent = register ? "Daftar" : "Masuk";
  passwordInput.autocomplete = register ? "new-password" : "current-password";
  setMessage();
}

tabs.forEach(tab => tab.addEventListener("click", () => setMode(tab.dataset.mode)));

togglePassword.addEventListener("click", () => {
  const hidden = passwordInput.type === "password";
  passwordInput.type = hidden ? "text" : "password";
  togglePassword.textContent = hidden ? "Sembunyikan" : "Tampilkan";
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  setMessage();

  const body = Object.fromEntries(new FormData(form).entries());
  if (!body.email || !body.password || (mode === "register" && !body.name)) {
    setMessage("Lengkapi semua kolom terlebih dahulu.", "error");
    return;
  }

  submitBtn.disabled = true;
  submitText.textContent = mode === "register" ? "Membuat..." : "Memeriksa...";

  try {
    const response = await fetch(`/api/${mode}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(body)
    });
    const data = await response.json();

    if (!response.ok) throw new Error(data.message || "Terjadi kesalahan.");

    if (window.playSuccessSound) window.playSuccessSound();
    window.location.assign("/dashboard");
  } catch (error) {
    if (window.playErrorSound) window.playErrorSound();
    setMessage(error.message, "error");
    submitBtn.disabled = false;
    submitText.textContent = mode === "register" ? "Daftar" : "Masuk";
  }
});

fetch("/api/me", { credentials: "same-origin" })
  .then(r => r.json())
  .then(data => {
    if (data.loggedIn) window.location.assign("/dashboard");
  })
  .catch(() => {});
