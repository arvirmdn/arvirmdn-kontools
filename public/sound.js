(function () {
  let ctx;

  function getCtx() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  function tone({ freqStart, freqEnd, duration, volume, type }) {
    try {
      const c = getCtx();
      const osc = c.createOscillator();
      const gain = c.createGain();

      osc.type = type || "square";
      osc.frequency.setValueAtTime(freqStart, c.currentTime);
      if (freqEnd) osc.frequency.exponentialRampToValueAtTime(freqEnd, c.currentTime + duration);

      gain.gain.setValueAtTime(volume, c.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);

      osc.connect(gain).connect(c.destination);
      osc.start();
      osc.stop(c.currentTime + duration + 0.02);
    } catch (e) {
      /* audio not available, fail silently */
    }
  }

  // Klik ringan ala menu GTA (blip pendek turun nada)
  window.playTouchSound = function () {
    tone({ freqStart: 1200, freqEnd: 600, duration: 0.08, volume: 0.6, type: "square" });
  };

  // Nada naik untuk aksi berhasil
  window.playSuccessSound = function () {
    tone({ freqStart: 700, freqEnd: 1150, duration: 0.13, volume: 0.6, type: "square" });
  };

  // Nada turun/kasar untuk error
  window.playErrorSound = function () {
    tone({ freqStart: 320, freqEnd: 170, duration: 0.16, volume: 0.62, type: "sawtooth" });
  };

  // Auto-attach ke semua elemen yang bisa disentuh
  document.addEventListener(
    "click",
    function (e) {
      const el = e.target.closest("button, .tab, .nav-item, .side-brand, .ghost-btn");
      if (!el || el.disabled) return;
      window.playTouchSound();
    },
    true
  );
})();
