(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const validCode = (v) => /^[A-Z0-9]{8}$/.test(String(v || "").trim().toUpperCase());

  function currentCode() {
    const fromUrl = new URL(location.href).searchParams.get("game");
    const fromUi = $("gameCodeOut")?.textContent;
    const code = String(fromUrl || fromUi || "").trim().toUpperCase();
    return validCode(code) ? code : "";
  }
  function remember(code = currentCode()) {
    if (validCode(code)) localStorage.setItem("dw:last-game-code", code);
  }
  function sheetUrl() {
    const code = currentCode() || localStorage.getItem("dw:last-game-code") || "";
    return code ? `index.html?game=${encodeURIComponent(code)}` : "index.html";
  }
  function updateSheetLinks() {
    const top = document.querySelector(".game-top-actions a[href^='index.html']");
    if (top) { top.href = sheetUrl(); top.textContent = "← Voltar à ficha"; top.title = "Volta para a ficha sem sair da partida"; }
    const sessionActions = $("gameSession")?.querySelector(".game-header-row .game-top-actions");
    if (sessionActions && !$("backToSheetBtn")) {
      const a = document.createElement("a");
      a.id = "backToSheetBtn"; a.className = "btn secondary"; a.textContent = "← Ficha"; a.href = sheetUrl();
      a.title = "Voltar à ficha mantendo sua conta vinculada à sala";
      sessionActions.insertBefore(a, sessionActions.firstChild);
    } else if ($("backToSheetBtn")) $("backToSheetBtn").href = sheetUrl();
  }

  async function disconnect() {
    const code = currentCode();
    if (!code) { location.href = "index.html"; return; }
    if (!confirm(`Desconectar voluntariamente da sala ${code}? Para entrar novamente depois, será necessário informar o PIN.`)) return;
    const btn = $("disconnectGameBtn"); if (btn) btn.disabled = true;
    try {
      await window.DW_API.rpc("gameplay_leave", { p_code: code });
      if (localStorage.getItem("dw:last-game-code") === code) localStorage.removeItem("dw:last-game-code");
      location.href = "index.html";
    } catch (err) {
      console.error("Falha ao desconectar da partida", err);
      alert("Não foi possível desconectar da partida agora. Sua associação à sala foi mantida.");
      if (btn) btn.disabled = false;
    }
  }

  function init() {
    remember(); updateSheetLinks();
    const leave = $("leaveGameBtn");
    if (leave) { leave.textContent = "Voltar ao lobby"; leave.title = "Sai do tabuleiro nesta tela, mas mantém sua conta vinculada à sala"; }
    const actions = $("gameSession")?.querySelector(".game-header-row .game-top-actions");
    if (actions && !$("disconnectGameBtn")) {
      const btn = document.createElement("button");
      btn.id = "disconnectGameBtn"; btn.type = "button"; btn.className = "btn danger"; btn.textContent = "Desconectar";
      btn.title = "Remove sua conta desta sala; para voltar será necessário usar o PIN";
      btn.addEventListener("click", disconnect);
      actions.appendChild(btn);
    }
    const out = $("gameCodeOut");
    if (out) new MutationObserver(() => { remember(); updateSheetLinks(); }).observe(out, { childList: true, characterData: true, subtree: true });
    window.addEventListener("popstate", updateSheetLinks);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true }); else init();
})();
