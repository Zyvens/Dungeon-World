(() => {
  "use strict";

  const TAB_SELECTOR = '.tab-btn[data-tab="gameplay"]';
  const STYLE_ID = "gameplayStatusStyles";

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      ${TAB_SELECTOR}.gameplay-tab-highlight{
        background:color-mix(in srgb,var(--panel) 82%,transparent)!important;
        color:var(--muted)!important;
        border-color:rgba(255,255,255,.08)!important;
        font-weight:inherit!important;
        box-shadow:none!important;
        letter-spacing:normal!important;
        filter:none!important;
        transform:none!important;
      }
      ${TAB_SELECTOR}.gameplay-tab-highlight:hover{
        filter:none!important;
        transform:none!important;
      }
      ${TAB_SELECTOR}.gameplay-tab-highlight.active{
        color:#06101a!important;
        background:var(--accent)!important;
        border-color:var(--accent)!important;
        font-weight:800!important;
        box-shadow:none!important;
      }
      ${TAB_SELECTOR}{display:inline-flex;align-items:center;gap:7px}
      .gameplay-status-dot{width:8px;height:8px;flex:0 0 8px;border-radius:50%;background:#727b86;box-shadow:0 0 0 1px rgba(255,255,255,.08)}
      .gameplay-status-dot.synced{background:#e8bd52;box-shadow:0 0 0 1px rgba(232,189,82,.2),0 0 8px rgba(232,189,82,.28)}
      .gameplay-status-dot.online{background:#69d391;box-shadow:0 0 0 1px rgba(105,211,145,.2),0 0 10px rgba(105,211,145,.55);animation:dwGameplayPulse 1.6s ease-in-out infinite}
      @keyframes dwGameplayPulse{0%,100%{transform:scale(.9);opacity:.72;box-shadow:0 0 0 0 rgba(105,211,145,.35)}50%{transform:scale(1.12);opacity:1;box-shadow:0 0 0 5px rgba(105,211,145,0)}}
      @media(prefers-reduced-motion:reduce){.gameplay-status-dot.online{animation:none}}
    `;
    document.head.appendChild(style);
  }

  function getTab() {
    return document.querySelector(TAB_SELECTOR);
  }

  function ensureDot() {
    const tab = getTab();
    if (!tab) return null;
    let dot = tab.querySelector(".gameplay-status-dot");
    if (!dot) {
      dot = document.createElement("span");
      dot.className = "gameplay-status-dot";
      dot.setAttribute("aria-hidden", "true");
      tab.prepend(dot);
    }
    return dot;
  }

  function hasRoom() {
    const code = localStorage.getItem("dw:last-game-code") || "";
    return /^[A-Z0-9]{8}$/i.test(code.trim());
  }

  async function isAuthenticated() {
    try {
      const auth = window.DW_AUTH;
      if (!auth) return false;
      await auth.ready;
      if (!auth.getSession?.()?.user) await auth.refreshSession?.();
      return Boolean(auth.getSession?.()?.user);
    } catch (_) {
      return false;
    }
  }

  async function refresh() {
    const tab = getTab();
    const dot = ensureDot();
    if (!tab || !dot) return;

    const authenticated = await isAuthenticated();
    const room = hasRoom();
    const status = authenticated ? (room ? "online" : "synced") : "offline";

    dot.classList.toggle("online", status === "online");
    dot.classList.toggle("synced", status === "synced");
    tab.dataset.gameplayStatus = status;

    if (status === "online") {
      tab.title = "Gameplay sincronizado e conectado a uma sala ativa";
      tab.setAttribute("aria-label", "Gameplay — sala ativa");
    } else if (status === "synced") {
      tab.title = "Gameplay sincronizado, mas sem sala ativa";
      tab.setAttribute("aria-label", "Gameplay — sincronizado sem sala ativa");
    } else {
      tab.title = "Gameplay sem sincronização ativa";
      tab.setAttribute("aria-label", "Gameplay — não sincronizado");
    }
  }

  function init() {
    injectStyles();
    const observer = new MutationObserver(() => { ensureDot(); refresh(); });
    observer.observe(document.querySelector(".tabbar") || document.body, { childList:true, subtree:true });
    window.addEventListener("storage", (e) => { if (e.key === "dw:last-game-code") refresh(); });
    window.addEventListener("focus", refresh);
    window.addEventListener("online", refresh);
    window.addEventListener("offline", refresh);
    document.addEventListener("visibilitychange", () => { if (!document.hidden) refresh(); });
    setTimeout(refresh, 0);
    setInterval(refresh, 5000);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once:true });
  else init();
})();
