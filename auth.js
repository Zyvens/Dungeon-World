const DW_AUTH = (() => {
  "use strict";

  const cfg = window.DW_CONFIG || {};
  const SDK_URL = cfg.neonJsUrl || "https://esm.sh/@neondatabase/neon-js@0.7.0-beta?bundle&target=es2022";
  let client = null;
  let session = null;
  let waiters = [];
  let modal = null;
  let statusEl = null;
  let accountBtn = null;
  let mode = "signin";

  function addStyles() {
    if (document.getElementById("dwAuthStyles")) return;
    const s = document.createElement("style");
    s.id = "dwAuthStyles";
    s.textContent = `
      .dw-auth-modal{position:fixed;inset:0;z-index:10000;display:grid;place-items:center;background:rgba(2,7,12,.78);backdrop-filter:blur(8px);padding:18px}
      .dw-auth-modal.hidden{display:none}
      .dw-auth-card{width:min(440px,100%);border:1px solid rgba(255,255,255,.13);border-radius:18px;background:#0d1723;color:#e7edf5;box-shadow:0 28px 80px rgba(0,0,0,.5);padding:22px}
      .dw-auth-card h2{margin:0 0 6px}.dw-auth-card p{color:#aebdca;line-height:1.45}
      .dw-auth-tabs{display:flex;gap:8px;margin:15px 0}.dw-auth-tabs button{flex:1}
      .dw-auth-form{display:grid;gap:11px}.dw-auth-form label{display:grid;gap:5px;font-size:.85rem;color:#b8c5d1}
      .dw-auth-form input{width:100%;box-sizing:border-box;border:1px solid rgba(255,255,255,.14);border-radius:10px;background:#08111b;color:#fff;padding:11px 12px}
      .dw-auth-actions{display:flex;gap:8px;justify-content:flex-end;margin-top:8px}.dw-auth-error{min-height:1.2em;color:#ff9d9d;font-size:.84rem}
      .dw-auth-user{padding:10px 12px;border-radius:10px;background:rgba(255,255,255,.05);margin:12px 0}.dw-auth-floating{position:fixed;right:14px;bottom:14px;z-index:9000}.dw-auth-account{white-space:nowrap}`;
    document.head.appendChild(s);
  }

  function button(label, cls = "btn secondary") {
    const b = document.createElement("button");
    b.type = "button";
    b.className = cls;
    b.textContent = label;
    return b;
  }

  function escapeHtml(value) {
    return String(value || "").replace(/[&<>"']/g, (c) => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c]));
  }

  function normalizeSession(result) {
    const payload = result?.data ?? result ?? null;
    if (payload?.user) return payload;
    if (payload?.session?.user) return payload.session;
    return null;
  }

  function errorMessage(result, fallback = "Não foi possível autenticar.") {
    const err = result?.error || result;
    return err?.message || err?.code || fallback;
  }

  function buildUI() {
    if (modal) return;
    addStyles();
    modal = document.createElement("div");
    modal.className = "dw-auth-modal hidden";
    modal.innerHTML = `<div class="dw-auth-card" role="dialog" aria-modal="true" aria-labelledby="dwAuthTitle">
      <h2 id="dwAuthTitle">Conta Dungeon World</h2>
      <p id="dwAuthLead">Entre para sincronizar sua ficha e participar do Gameplay compartilhado.</p>
      <div id="dwAuthCurrent" class="dw-auth-user hidden"></div>
      <div id="dwAuthTabs" class="dw-auth-tabs"><button id="dwAuthSignInTab" class="btn" type="button">Entrar</button><button id="dwAuthSignUpTab" class="btn secondary" type="button">Criar conta</button></div>
      <form id="dwAuthForm" class="dw-auth-form">
        <label id="dwAuthNameWrap" class="hidden">Nome<input id="dwAuthName" autocomplete="name" maxlength="80" /></label>
        <label>E-mail<input id="dwAuthEmail" type="email" autocomplete="email" required /></label>
        <label>Senha<input id="dwAuthPassword" type="password" autocomplete="current-password" minlength="8" required /></label>
        <div id="dwAuthError" class="dw-auth-error" aria-live="polite"></div>
        <div class="dw-auth-actions"><button id="dwAuthCancel" class="btn secondary" type="button">Fechar</button><button id="dwAuthSubmit" class="btn" type="submit">Entrar</button></div>
      </form>
      <div id="dwAuthSignedActions" class="dw-auth-actions hidden"><button id="dwAuthCloseSigned" class="btn secondary" type="button">Fechar</button><button id="dwAuthLogout" class="btn danger" type="button">Sair da conta</button></div>
    </div>`;
    document.body.appendChild(modal);
    statusEl = modal.querySelector("#dwAuthError");

    const top = document.querySelector(".top-actions, .game-top-actions");
    accountBtn = button("Conta", "btn secondary dw-auth-account");
    accountBtn.addEventListener("click", openModal);
    if (top) top.appendChild(accountBtn);
    else {
      accountBtn.classList.add("dw-auth-floating");
      document.body.appendChild(accountBtn);
    }

    if (!/gameplay\.html$/i.test(location.pathname)) {
      const gameLink = document.createElement("a");
      gameLink.href = "gameplay.html";
      gameLink.className = "btn secondary";
      gameLink.textContent = "Gameplay";
      if (top) top.insertBefore(gameLink, accountBtn);
    }

    modal.querySelector("#dwAuthSignInTab").addEventListener("click", () => setMode("signin"));
    modal.querySelector("#dwAuthSignUpTab").addEventListener("click", () => setMode("signup"));
    modal.querySelector("#dwAuthCancel").addEventListener("click", closeModal);
    modal.querySelector("#dwAuthCloseSigned").addEventListener("click", closeModal);
    modal.querySelector("#dwAuthLogout").addEventListener("click", logout);
    modal.querySelector("#dwAuthForm").addEventListener("submit", submitAuth);
    modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !modal.classList.contains("hidden")) closeModal(); });
    renderAccount();
  }

  function setMode(next) {
    mode = next;
    if (!modal) return;
    modal.querySelector("#dwAuthNameWrap").classList.toggle("hidden", mode !== "signup");
    modal.querySelector("#dwAuthSubmit").textContent = mode === "signup" ? "Criar conta" : "Entrar";
    modal.querySelector("#dwAuthSignInTab").className = mode === "signin" ? "btn" : "btn secondary";
    modal.querySelector("#dwAuthSignUpTab").className = mode === "signup" ? "btn" : "btn secondary";
    modal.querySelector("#dwAuthPassword").autocomplete = mode === "signup" ? "new-password" : "current-password";
    if (statusEl) statusEl.textContent = "";
  }

  function renderAccount() {
    if (!modal) return;
    const current = modal.querySelector("#dwAuthCurrent");
    const tabs = modal.querySelector("#dwAuthTabs");
    const form = modal.querySelector("#dwAuthForm");
    const signedActions = modal.querySelector("#dwAuthSignedActions");
    if (session?.user) {
      current.classList.remove("hidden");
      current.innerHTML = `<strong>${escapeHtml(session.user.name || "Jogador")}</strong><br><small>${escapeHtml(session.user.email || "")}</small>`;
      tabs.classList.add("hidden");
      form.classList.add("hidden");
      signedActions.classList.remove("hidden");
      if (accountBtn) accountBtn.textContent = session.user.name ? `Conta · ${session.user.name.split(" ")[0]}` : "Conta · conectada";
    } else {
      current.classList.add("hidden");
      tabs.classList.remove("hidden");
      form.classList.remove("hidden");
      signedActions.classList.add("hidden");
      if (accountBtn) accountBtn.textContent = "Entrar";
    }
  }

  function openModal() {
    buildUI();
    renderAccount();
    modal.classList.remove("hidden");
  }

  function closeModal() {
    if (modal) modal.classList.add("hidden");
    if (!session?.user && waiters.length) {
      const pending = waiters.splice(0);
      pending.forEach((w) => w.reject(new Error("auth_cancelled")));
    }
  }

  async function refreshSession(attempts = 1) {
    if (!client) return null;
    session = null;
    for (let i = 0; i < Math.max(1, attempts); i += 1) {
      try {
        session = normalizeSession(await client.auth.getSession());
      } catch (_) {
        session = null;
      }
      if (session?.user) break;
      if (i + 1 < attempts) await new Promise((resolve) => setTimeout(resolve, 160 * (i + 1)));
    }
    renderAccount();
    return session;
  }

  async function submitAuth(event) {
    event.preventDefault();
    if (!client) return;
    statusEl.textContent = "Conectando…";
    const email = modal.querySelector("#dwAuthEmail").value.trim();
    const password = modal.querySelector("#dwAuthPassword").value;
    const name = modal.querySelector("#dwAuthName").value.trim() || email.split("@")[0];
    try {
      const result = mode === "signup"
        ? await client.auth.signUp.email({ email, password, name })
        : await client.auth.signIn.email({ email, password });
      if (result?.error) throw new Error(errorMessage(result));
      session = normalizeSession(result) || session;
      if (!session?.user) await refreshSession(4);
      if (!session?.user) throw new Error("A sessão não pôde ser confirmada.");
      renderAccount();
      modal.classList.add("hidden");
      const pending = waiters.splice(0);
      pending.forEach((w) => w.resolve(session));
    } catch (err) {
      statusEl.textContent = errorMessage(err);
    }
  }

  async function logout() {
    try { if (client) await client.auth.signOut(); } catch (_) {}
    session = null;
    renderAccount();
    closeModal();
  }

  async function ensureSignedIn() {
    await ready;
    if (!session?.user) await refreshSession(2);
    if (session?.user) return session;
    openModal();
    return new Promise((resolve, reject) => waiters.push({ resolve, reject }));
  }

  async function init() {
    try {
      if (!cfg.authUrl || !cfg.dataApiUrl) throw new Error("Endpoints Neon não configurados.");
      const { createClient, BetterAuthVanillaAdapter } = await import(SDK_URL);
      const auth = { url: cfg.authUrl };
      if (typeof BetterAuthVanillaAdapter === "function") {
        auth.adapter = BetterAuthVanillaAdapter({ fetchOptions: { credentials: "include" } });
      }
      client = createClient({ auth, dataApi: { url: cfg.dataApiUrl } });
      window.DW_NEON = client;
      if (document.readyState === "loading") await new Promise((resolve) => document.addEventListener("DOMContentLoaded", resolve, { once: true }));
      buildUI();
      await refreshSession(2);
      return true;
    } catch (err) {
      console.error("Neon SDK init failed", err);
      if (document.readyState === "loading") await new Promise((resolve) => document.addEventListener("DOMContentLoaded", resolve, { once: true }));
      addStyles();
      buildUI();
      if (statusEl) statusEl.textContent = "Falha ao carregar o Neon. Verifique sua conexão e recarregue a página.";
      return false;
    }
  }

  const ready = init();
  return { ready, ensureSignedIn, refreshSession, getSession: () => session, getClient: () => client, openModal, logout };
})();

window.DW_AUTH = DW_AUTH;
