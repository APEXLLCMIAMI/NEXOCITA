// ─── Configuración de Firebase para NEXOCITA ─────────────────────────────────
// Puedes pegar tus credenciales aquí o directamente desde el Panel de Control.
// Si las guardas en el panel, se sincronizan de inmediato en este dispositivo.
// Para que aplique a TODOS los clientes y teléfonos públicos, pégalas aquí y súbelas a GitHub.

window.NEXOCITA_FIREBASE_CONFIG = window.NEXOCITA_FIREBASE_CONFIG || (() => {
  try {
    const saved = localStorage.getItem('nexocita_firebase_config');
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  return {
    apiKey: "",
    authDomain: "",
    projectId: "",
    storageBucket: "",
    messagingSenderId: "",
    appId: ""
  };
})();
