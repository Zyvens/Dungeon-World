(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  let frameLoaded = false;

  function removeHeaderGameplayButtons() {
    document.querySelectorAll('.top-actions a[href*="gameplay"], .top-actions #gameplayTopBtn, .top-actions [data-gameplay-top]').forEach((el) => el.remove());
  }

  function ensureModal() {
    if ($("gameplayLoginModal")) return;
    const modal = document.createElement("div");
    modal.id = "gameplayLoginModal";
    modal.className = "gameplay-login-modal hidden";
    modal.innerHTML = `
      <div class="gameplay-login-card" role="dialog" aria-modal="true" aria-labelledby="gameplayLoginTitle">
        <button class="gameplay-login-close" type="button" aria-label="Fechar">×</button>
        <p class="eyebrow">Sincronização necessária</p>
        <h2 id="gameplayLoginTitle">Entre na sua conta para abrir o Gameplay</h2>
        <p>O tabuleiro compartilhado usa sua conta para manter a mesma sala, mapa e bonecos sincronizados entre os participantes.</p>
        <div class="button-row">
          <button id="gameplayLoginBtn" class="btn" type="button">Entrar e continuar</button>
          <button id="gameplayLoginCancel" class="btn secondary" type="button">Agora não</button>
        </div>
      </div>`;
    document.body.appendChild(modal);
    const close = () => modal.classList.add("hidden");
    modal.querySelector(".gameplay-login-close").addEventListener("click", close);
    $("gameplayLoginCancel").addEventListener("click", close);
    modal.addEventListener("click", (e) => { if (e.target === modal) close(); });
    $("gameplayLoginBtn").addEventListener("click", async () => {
      try {
        const auth = window.DW_AUTH;
        if (!auth) throw new Error("Módulo de login ainda está carregando.");
        await auth.ready;
        await auth.ensureSignedIn();
        if (!auth.getSession?.()?.user) throw new Error("Login não concluído.");
        close();
        loadFrame();
      } catch (err) {
        const btn = $("gameplayLoginBtn");
        btn.textContent = err?.message === "auth_cancelled" ? "Login cancelado — tentar novamente" : "Não foi possível entrar — tentar novamente";
      }
    });
  }

  function frameUrl() {
    const last = localStorage.getItem("dw:last-game-code") || "";
    const u = new URL("gameplay.html", location.href);
    u.searchParams.set("embedded", "1");
    if (last) u.searchParams.set("game", last);
    return u.toString();
  }

  function loadFrame() {
    const frame = $("gameplayFrame");
    const shell = $("gameplayModuleShell");
    if (!frame || !shell) return;
    shell.classList.remove("gameplay-waiting");
    if (!frameLoaded) {
      frame.src = frameUrl();
      frameLoaded = true;
    }
  }

  async function openGameplay() {
    removeHeaderGameplayButtons();
    ensureModal();
    try {
      const auth = window.DW_AUTH;
      if (!auth) throw new Error("auth_pending");
      await auth.ready;
      if (!auth.getSession?.()?.user) {
        await auth.refreshSession?.();
      }
      if (!auth.getSession?.()?.user) {
        $("gameplayLoginModal").classList.remove("hidden");
        return;
      }
      loadFrame();
    } catch (_) {
      $("gameplayLoginModal").classList.remove("hidden");
    }
  }

  function init() {
    removeHeaderGameplayButtons();
    ensureModal();
    const tab = document.querySelector('.tab-btn[data-tab="gameplay"]');
    if (!tab) return;
    tab.addEventListener("click", () => setTimeout(openGameplay, 0));
    new MutationObserver(removeHeaderGameplayButtons).observe(document.querySelector(".top-actions") || document.body, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
