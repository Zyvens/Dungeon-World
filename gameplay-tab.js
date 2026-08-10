(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  let frameLoaded = false;

  function injectStyles() {
    if ($("gameplayTabStyles")) return;
    const s = document.createElement("style");
    s.id = "gameplayTabStyles";
    s.textContent = `
      .gameplay-module-card{padding:0;overflow:hidden}
      .gameplay-module-head{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:16px 18px;border-bottom:1px solid rgba(255,255,255,.08)}
      .gameplay-module-head h2{margin:0}.gameplay-module-head p{margin:3px 0 0;color:var(--muted);font-size:.8rem}
      .gameplay-module-shell{position:relative;min-height:72vh;background:rgba(2,8,14,.28)}
      .gameplay-module-shell.gameplay-waiting::before{content:"Entre na sua conta para carregar o Gameplay compartilhado.";position:absolute;inset:0;display:grid;place-items:center;padding:28px;text-align:center;color:var(--muted);z-index:1}
      .gameplay-frame{display:block;width:100%;height:78vh;min-height:680px;border:0;background:transparent}
      .gameplay-login-modal{position:fixed;inset:0;z-index:1000;display:grid;place-items:center;padding:18px;background:rgba(2,7,12,.72);backdrop-filter:blur(9px)}
      .gameplay-login-card{position:relative;width:min(520px,100%);padding:24px;border:1px solid color-mix(in srgb,var(--accent) 35%,rgba(255,255,255,.1));border-radius:18px;background:color-mix(in srgb,var(--panel) 96%,#05090f);box-shadow:0 26px 90px rgba(0,0,0,.55)}
      .gameplay-login-card h2{margin:4px 0 10px}.gameplay-login-card>p:not(.eyebrow){color:var(--muted);line-height:1.55}
      .gameplay-login-close{position:absolute;right:12px;top:12px;width:36px;height:36px;border:1px solid rgba(255,255,255,.1);border-radius:10px;background:rgba(0,0,0,.2);color:var(--text);cursor:pointer;font-size:1.2rem}
      @media(max-width:700px){.gameplay-frame{height:82vh;min-height:620px}.gameplay-module-head{align-items:flex-start;flex-direction:column}}
    `;
    document.head.appendChild(s);
  }

  function removeHeaderGameplayButtons() {
    document.querySelectorAll('.top-actions a[href*="gameplay"], .top-actions #gameplayTopBtn, .top-actions [data-gameplay-top]').forEach((el) => el.remove());
    const actions = document.querySelector(".top-actions");
    if (actions) [...actions.querySelectorAll("button,a")].forEach((el) => { if ((el.textContent || "").trim().toLowerCase() === "gameplay") el.remove(); });
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
        <p>O tabuleiro compartilhado precisa identificar sua conta para manter sala, mapa, participantes e bonecos sincronizados. A ficha continua aberta nesta mesma página.</p>
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
      const btn = $("gameplayLoginBtn");
      const original = "Entrar e continuar";
      try {
        btn.disabled = true;
        btn.textContent = "Abrindo login…";
        const auth = window.DW_AUTH;
        if (!auth) throw new Error("Módulo de login ainda está carregando.");
        await auth.ready;
        await auth.ensureSignedIn();
        if (!auth.getSession?.()?.user) throw new Error("Login não concluído.");
        close();
        loadFrame(true);
      } catch (err) {
        btn.textContent = err?.message === "auth_cancelled" ? "Login cancelado — tentar novamente" : "Não foi possível entrar — tentar novamente";
      } finally {
        btn.disabled = false;
        setTimeout(() => { if (!btn.disabled && btn.textContent !== original && $("gameplayLoginModal")?.classList.contains("hidden")) btn.textContent = original; }, 1200);
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

  function loadFrame(force = false) {
    const frame = $("gameplayFrame");
    const shell = $("gameplayModuleShell");
    if (!frame || !shell) return;
    shell.classList.remove("gameplay-waiting");
    if (!frameLoaded || force) {
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
      if (!auth.getSession?.()?.user) await auth.refreshSession?.();
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
    injectStyles();
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
