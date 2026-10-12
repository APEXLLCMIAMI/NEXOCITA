// ─── URL del servidor API ─────────────────────────────────────────────────────
// Si el sitio se sirve desde el mismo servidor (local o Railway), usa rutas relativas.
// Si está en GitHub Pages u otro hosting estático, define window.NEXOCITA_API_URL
// apuntando al servidor Railway, p.ej.:
//   window.NEXOCITA_API_URL = 'https://tu-app.up.railway.app';
// (puedes ponerlo en un <script> en index.html y panel.html)
const API_BASE = (typeof window !== 'undefined' && window.NEXOCITA_API_URL)
  ? window.NEXOCITA_API_URL.replace(/\/$/, '')
  : '';
