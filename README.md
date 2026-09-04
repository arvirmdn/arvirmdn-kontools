<div align="center">

<svg width="100%" height="180" viewBox="0 0 800 180" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0a0a0f"/>
      <stop offset="100%" stop-color="#13131c"/>
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="800" height="180" fill="url(#bg)" rx="12"/>

  <!-- Floating particles -->
  <circle cx="100" cy="40" r="2" fill="#7c3aed" opacity="0.4">
    <animate attributeName="cy" values="40;30;40" dur="4s" repeatCount="indefinite"/>
    <animate attributeName="opacity" values="0.4;0.8;0.4" dur="4s" repeatCount="indefinite"/>
  </circle>
  <circle cx="250" cy="120" r="1.5" fill="#7c3aed" opacity="0.3">
    <animate attributeName="cy" values="120;100;120" dur="5s" repeatCount="indefinite"/>
    <animate attributeName="opacity" values="0.3;0.6;0.3" dur="5s" repeatCount="indefinite"/>
  </circle>
  <circle cx="500" cy="50" r="2" fill="#7c3aed" opacity="0.5">
    <animate attributeName="cy" values="50;35;50" dur="3.5s" repeatCount="indefinite"/>
    <animate attributeName="opacity" values="0.5;0.9;0.5" dur="3.5s" repeatCount="indefinite"/>
  </circle>
  <circle cx="650" cy="140" r="1.5" fill="#7c3aed" opacity="0.3">
    <animate attributeName="cy" values="140;125;140" dur="6s" repeatCount="indefinite"/>
  </circle>
  <circle cx="720" cy="60" r="2" fill="#7c3aed" opacity="0.4">
    <animate attributeName="cy" values="60;45;60" dur="4.5s" repeatCount="indefinite"/>
    <animate attributeName="opacity" values="0.4;0.7;0.4" dur="4.5s" repeatCount="indefinite"/>
  </circle>
  <circle cx="350" cy="150" r="1" fill="#7c3aed" opacity="0.5">
    <animate attributeName="cy" values="150;135;150" dur="3s" repeatCount="indefinite"/>
  </circle>

  <!-- Title -->
  <text x="400" y="85" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" font-size="32" font-weight="700" fill="#ececf3" filter="url(#glow)">
    arvirmdn kontools
    <animate attributeName="opacity" values="0.9;1;0.9" dur="3s" repeatCount="indefinite"/>
  </text>

  <!-- Subtitle -->
  <text x="400" y="115" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" font-size="13" fill="#9b9bb0">
    Kumpulan tools & utilities dalam satu dashboard dark modern
  </text>

  <!-- Version badge -->
  <rect x="365" y="135" width="70" height="22" rx="11" fill="none" stroke="#7c3aed" stroke-width="1" opacity="0.6"/>
  <text x="400" y="150" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" font-size="11" fill="#7c3aed" font-weight="500">v0.1.0</text>
</svg>

---

## ✦ Fitur

| Fitur | Status |
|-------|--------|
| 🔐 Autentikasi | ✅ Aktif |
| 👤 Profil | ✅ Aktif |
| 🔗 Link to APK | 🚧 Dalam Pengembangan |
| 📊 Status HD | 🚧 Dalam Pengembangan |
| 🛡️ 1 Perangkat = 1 Akun | ✅ Aktif |

---

<div align="center">

**arvirmdn kontools v0.1**  
*Dibuat dengan 💜 oleh arvirmdn*

</div>
