// ─── Configuración del Servidor Supabase para NEXOCITA ────────────────────────
// Puedes pegar la URL de tu proyecto y la Anon Key directamente aquí, o
// configurarlas desde el Panel de Control en la pestaña "⚡ Servidor Supabase".
//
// Una vez conectado, las reservas desde cualquier teléfono móvil se sincronizan
// al instante con tu computadora y panel 24/7 sin depender de un servidor local.

window.NEXOCITA_SUPABASE_CONFIG = window.NEXOCITA_SUPABASE_CONFIG || (() => {
  try {
    const saved = localStorage.getItem('nexocita_supabase_config');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && (parsed.url || parsed.anonKey)) return parsed;
    }
  } catch (e) {}
  return {
    url: "https://esjbrsshfjxhuiypiftr.supabase.co",      // Proyecto: APEXLLCMIAMI's Project
    anonKey: "sb_publishable_KHSjD804GunkZzU6eldKQg_wlgIFJYO"
  };
})();
