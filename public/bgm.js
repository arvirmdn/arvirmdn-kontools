(function () {
  var STORAGE_KEY = "kontools_bgm_muted";

  var audio = new Audio("/audio/backsound.mp3");
  audio.loop = true;
  audio.volume = 0.22; // pelan ala backsound menu game
  audio.preload = "auto";
  audio.muted = localStorage.getItem(STORAGE_KEY) === "1";

  function setMuted(muted) {
    localStorage.setItem(STORAGE_KEY, muted ? "1" : "0");
    audio.muted = muted;
  }

  function tryPlay() {
    var p = audio.play();
    if (p && p.catch) p.catch(function () {});
  }

  // Coba langsung main; kalau diblokir browser, tunggu interaksi pertama
  tryPlay();

  function firstInteraction() {
    tryPlay();
    document.removeEventListener("click", firstInteraction);
    document.removeEventListener("touchstart", firstInteraction);
    document.removeEventListener("keydown", firstInteraction);
  }
  document.addEventListener("click", firstInteraction, { once: true });
  document.addEventListener("touchstart", firstInteraction, { once: true });
  document.addEventListener("keydown", firstInteraction, { once: true });

  function updateIcon(btn) {
    btn.innerHTML = audio.muted
      ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M11 5L6 9H3v6h3l5 4V5z"/><path d="M17 9l6 6M23 9l-6 6"/></svg>'
      : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M11 5L6 9H3v6h3l5 4V5z"/><path d="M15.5 8.5a5 5 0 010 7M18.5 6a9 9 0 010 12"/></svg>';
  }

  function createToggle() {
    var btn = document.createElement("button");
    btn.id = "bgmToggle";
    btn.className = "bgm-toggle";
    btn.type = "button";
    btn.setAttribute("aria-label", "Musik latar");
    updateIcon(btn);
    btn.addEventListener("click", function () {
      var muted = !audio.muted;
      setMuted(muted);
      updateIcon(btn);
      if (window.playTouchSound) window.playTouchSound();
      if (!muted) tryPlay();
    });
    document.body.appendChild(btn);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", createToggle);
  } else {
    createToggle();
  }
})();
