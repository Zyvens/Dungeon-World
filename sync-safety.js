(() => {
  "use strict";

  const STORAGE_KEY = "dungeon-world:white-label:v2";
  const MEDIA_KEY = "dungeon-world:white-label:media:v1";
  const BACKUP_KEY = "dungeon-world:sync:last-backup";
  const LOCAL_EDIT_KEY = "dungeon-world:sync:local-edited-at";
  const MODE_PREFIX = "dungeon-world:sync:mode:";
  const LAST_SYNC_PREFIX = "dungeon-world:sync:last-sync:";
  const adapterFetch = window.fetch.bind(window);
  const nativeSetItem = Storage.prototype.setItem;
  let modal = null;
  let remoteRow = null;
  let busy = false;
  let arm = { action: "", until: 0 };

  const $ = (id) => document.getElementById(id);
  const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c]));
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  function params() {
    const u = new URL(location.href);
    return {
      id: u.searchParams.get("sheet") || "",
      key: new URLSearchParams(u.hash.replace(/^#/, "")).get("key") || ""
    };
  }

  function modeKey(id = params().id) { return MODE_PREFIX + (id || "unlinked"); }
  function getMode() { return localStorage.getItem(modeKey()) === "primary" ? "primary" : "manual"; }
  function setMode(next) { localStorage.setItem(modeKey(), next === "primary" ? "primary" : "manual"); updateStatus(); }

  function readLocalState() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null"); }
    catch (_) { return null; }
  }
  function readLocalMedia() {
    try { return window.DW_MEDIA?.get?.() || JSON.parse(localStorage.getItem(MEDIA_KEY) || "null") || { equipment:{}, history:[] }; }
    catch (_) { return { equipment:{}, history:[] }; }
  }

  function canonical(value) {
    if (Array.isArray(value)) return value.map(canonical);
    if (value && typeof value === "object") {
      return Object.keys(value).sort().reduce((out, key) => { out[key] = canonical(value[key]); return out; }, {});
    }
    return value;
  }
  function hash(value) {
    const text = JSON.stringify(canonical(value));
    let h = 2166136261;
    for (let i = 0; i < text.length; i += 1) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619); }
    return `${text.length}:${(h >>> 0).toString(16)}`;
  }

  function stripMedia(state) {
    if (!state || typeof state !== "object") return state;
    const copy = { ...state };
    delete copy._media;
    return copy;
  }

  function summary(state) {
    if (!state || typeof state !== "object") return "Sem dados legíveis";
    const name = state.identity?.name || "Personagem sem nome";
    const level = state.status?.level ?? "—";
    const equipment = Array.isArray(state.equipment) ? state.equipment.length : 0;
    const people = Array.isArray(state.people) ? state.people.length : 0;
    const story = String(state.story || "").trim().length;
    return `${name} · nível ${level} · ${equipment} equipamentos · ${people} personagens · ${story} caracteres de história`;
  }

  function formatDate(value) {
    if (!value) return "horário não informado";
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? "horário não informado" : d.toLocaleString("pt-BR");
  }

  function jsonResponse(payload, status = 200) {
    return new Response(JSON.stringify(payload), { status, headers: { "content-type":"application/json; charset=utf-8", "cache-control":"no-store" } });
  }

  // Registra alterações locais sem interferir na persistência original do app.
  Storage.prototype.setItem = function(key, value) {
    const result = nativeSetItem.call(this, key, value);
    if (this === localStorage && key === STORAGE_KEY) {
      nativeSetItem.call(localStorage, LOCAL_EDIT_KEY, new Date().toISOString());
    }
    return result;
  };

  // Barreira de segurança: a ficha nunca faz pull automático.
  // Em modo manual, PUTs automáticos também são absorvidos localmente.
  window.fetch = async function(input, init = {}) {
    const raw = typeof input === "string" ? input : input?.url || "";
    let url;
    try { url = new URL(raw, location.href); } catch (_) { return adapterFetch(input, init); }
    const isSheet = url.pathname === "/api/sheet" || url.pathname.endsWith("/api/sheet");
    if (!isSheet) return adapterFetch(input, init);

    const method = String(init.method || "GET").toUpperCase();
    const current = params();

    if (method === "GET" && current.id) {
      // app.js chama GET ao abrir uma URL vinculada. Retornamos o estado local
      // para impedir que uma versão remota seja aplicada sem decisão do usuário.
      const local = readLocalState();
      return jsonResponse({ id: current.id, state: local || {} }, 200);
    }

    if (method === "PUT" && current.id && getMode() !== "primary") {
      queueMicrotask(() => updateStatus("Nuvem · manual"));
      return jsonResponse({ ok: true, protected: true }, 200);
    }

    return adapterFetch(input, init);
  };

  async function api() {
    for (let i = 0; i < 100 && !window.DW_API; i += 1) await sleep(40);
    if (!window.DW_API) throw new Error("Data API ainda não está disponível.");
    await window.DW_AUTH?.ready;
    if (!window.DW_AUTH?.getSession?.()?.user) await window.DW_AUTH?.ensureSignedIn?.();
    return window.DW_API;
  }

  async function fetchRemote() {
    const { id } = params();
    if (!id) throw new Error("Esta ficha ainda não está vinculada à nuvem.");
    const client = await api();
    const row = await client.rpc("sheet_get", { p_id: id });
    remoteRow = Array.isArray(row) ? row[0] : row;
    if (!remoteRow?.state) throw new Error("A nuvem não retornou uma ficha válida.");
    return remoteRow;
  }

  function backupLocal(reason) {
    const payload = {
      created_at: new Date().toISOString(),
      reason,
      sheet_id: params().id || null,
      state: readLocalState(),
      media: readLocalMedia()
    };
    nativeSetItem.call(localStorage, BACKUP_KEY, JSON.stringify(payload));
    return payload;
  }

  function restoreBackup() {
    let backup;
    try { backup = JSON.parse(localStorage.getItem(BACKUP_KEY) || "null"); } catch (_) {}
    if (!backup?.state) return alert("Não há backup automático disponível neste dispositivo.");
    if (!confirm(`Restaurar o backup local criado em ${formatDate(backup.created_at)}? O estado atual deste dispositivo será substituído.`)) return;
    nativeSetItem.call(localStorage, STORAGE_KEY, JSON.stringify(backup.state));
    if (backup.media) window.DW_MEDIA?.set?.(backup.media);
    location.reload();
  }

  function armAction(action, button, text) {
    const now = Date.now();
    if (arm.action === action && arm.until > now) { arm = { action:"", until:0 }; return true; }
    arm = { action, until: now + 8000 };
    button.dataset.originalText ||= button.textContent;
    button.textContent = text;
    setTimeout(() => {
      if (arm.action === action && Date.now() >= arm.until) arm = { action:"", until:0 };
      if (button.isConnected) button.textContent = button.dataset.originalText || button.textContent;
    }, 8200);
    return false;
  }

  async function pullNow(button) {
    if (busy) return;
    if (!armAction("pull", button, "Confirmar: substituir ESTE dispositivo")) {
      setMessage("O pull substituirá somente este dispositivo. Um backup local automático será criado antes da troca.", true);
      return;
    }
    busy = true; disableActions(true);
    try {
      const row = await fetchRemote();
      backupLocal("before-cloud-pull");
      const remoteState = stripMedia(row.state);
      nativeSetItem.call(localStorage, STORAGE_KEY, JSON.stringify(remoteState));
      if (row.state?._media) window.DW_MEDIA?.set?.(row.state._media);
      nativeSetItem.call(localStorage, LAST_SYNC_PREFIX + params().id, JSON.stringify({ direction:"pull", at:new Date().toISOString(), hash:hash(remoteState) }));
      setMessage("Conteúdo da nuvem aplicado. Recarregando a ficha…", false);
      setTimeout(() => location.reload(), 350);
    } catch (err) {
      setMessage(err?.message || "Não foi possível trazer a ficha da nuvem.", true);
      busy = false; disableActions(false);
    }
  }

  async function pushNow(button) {
    if (busy) return;
    const { id, key } = params();
    if (!id) return setMessage("Esta ficha ainda não está vinculada à nuvem.", true);
    if (!key) return setMessage("Este link não possui chave de edição; não é possível substituir a nuvem.", true);
    if (!armAction("push", button, "Confirmar: substituir A NUVEM")) {
      setMessage("O envio fará deste dispositivo a versão da nuvem. Nada será puxado antes. Clique novamente para confirmar.", true);
      return;
    }
    busy = true; disableActions(true);
    try {
      backupLocal("before-cloud-push");
      const localState = readLocalState();
      if (!localState) throw new Error("Não há ficha local válida para enviar.");
      const payload = { ...localState, _media: readLocalMedia() };
      const client = await api();
      const ok = await client.rpc("sheet_update", {
        p_id: id,
        p_edit_token: key,
        p_title: localState.identity?.name || "Nome do personagem",
        p_state: payload
      });
      if (ok !== true) throw new Error("A nuvem recusou a chave de edição.");
      const at = new Date().toISOString();
      nativeSetItem.call(localStorage, LAST_SYNC_PREFIX + id, JSON.stringify({ direction:"push", at, hash:hash(localState) }));
      remoteRow = { ...(remoteRow || {}), state: payload, updated_at: at };
      setMessage("Conteúdo deste dispositivo enviado para a nuvem com sucesso.", false);
      renderComparison();
    } catch (err) {
      setMessage(err?.message || "Não foi possível enviar a ficha para a nuvem.", true);
    } finally {
      busy = false; disableActions(false); updateStatus();
    }
  }

  function setMessage(text, bad = false) {
    const el = $("dwSyncMessage");
    if (!el) return;
    el.textContent = text || "";
    el.classList.toggle("bad", !!bad);
  }

  function disableActions(disabled) {
    ["dwSyncPull","dwSyncPush","dwSyncRefresh"].forEach((id) => { const el=$(id); if(el)el.disabled=disabled; });
  }

  function renderComparison() {
    if (!modal) return;
    const local = readLocalState();
    const remoteState = stripMedia(remoteRow?.state);
    const localHash = local ? hash(local) : "";
    const remoteHash = remoteState ? hash(remoteState) : "";
    const same = !!localHash && localHash === remoteHash;
    const localTime = localStorage.getItem(LOCAL_EDIT_KEY);
    const lastSyncRaw = localStorage.getItem(LAST_SYNC_PREFIX + params().id);
    let lastSync = null; try { lastSync = JSON.parse(lastSyncRaw || "null"); } catch (_) {}

    $("dwSyncLocalSummary").textContent = summary(local);
    $("dwSyncLocalTime").textContent = `Última alteração local detectada: ${formatDate(localTime)}`;
    $("dwSyncRemoteSummary").textContent = remoteState ? summary(remoteState) : "Ainda não consultado";
    $("dwSyncRemoteTime").textContent = remoteRow ? `Última alteração informada pela nuvem: ${formatDate(remoteRow.updated_at)}` : "Consulte a nuvem para comparar antes de decidir.";
    $("dwSyncCompare").textContent = same ? "As duas versões têm o mesmo conteúdo." : remoteState ? "As versões são diferentes. Escolha explicitamente qual deve prevalecer." : "Nenhuma substituição será feita automaticamente.";
    $("dwSyncCompare").classList.toggle("same", same);
    $("dwSyncLast").textContent = lastSync?.at ? `Última sincronização manual neste dispositivo: ${formatDate(lastSync.at)} (${lastSync.direction === "pull" ? "nuvem → dispositivo" : "dispositivo → nuvem"}).` : "Ainda não há sincronização manual registrada neste dispositivo.";

    const primary = getMode() === "primary";
    $("dwSyncPrimary").checked = primary;
    $("dwSyncModeText").textContent = primary
      ? "Principal: alterações deste dispositivo são enviadas automaticamente. Pull continua sempre manual."
      : "Manual protegido: nenhuma versão remota substitui a local e nenhum autosave substitui a nuvem.";
  }

  async function refreshComparison() {
    if (busy) return;
    busy = true; disableActions(true); setMessage("Consultando a nuvem sem aplicar alterações…");
    try { await fetchRemote(); setMessage("Comparação atualizada. Nenhum dado foi substituído."); }
    catch (err) { setMessage(err?.message || "Não foi possível consultar a nuvem.", true); }
    finally { busy = false; disableActions(false); renderComparison(); }
  }

  function updateStatus(forcedText = "") {
    const status = $("cloudStatus");
    if (!status) return;
    const { id } = params();
    if (!id) return;
    if (forcedText) { status.textContent = forcedText; return; }
    if (!navigator.onLine) status.textContent = "Nuvem · offline";
    else status.textContent = getMode() === "primary" ? "Nuvem · principal" : "Nuvem · manual";
  }

  function addStyles() {
    if ($("dwSyncSafetyStyles")) return;
    const s = document.createElement("style"); s.id="dwSyncSafetyStyles";
    s.textContent = `
      .dw-sync-modal{position:fixed;inset:0;z-index:10050;display:none;align-items:flex-start;justify-content:center;overflow:auto;padding:max(18px,env(safe-area-inset-top)) 16px max(24px,env(safe-area-inset-bottom));background:rgba(0,0,0,.76);backdrop-filter:blur(8px)}
      .dw-sync-modal.open{display:flex}.dw-sync-box{width:min(680px,100%);margin:auto;padding:22px;border:1px solid rgba(139,199,238,.24);border-radius:20px;background:#0b1825;color:#e7edf5;box-shadow:0 28px 80px rgba(0,0,0,.55)}
      .dw-sync-box h2{margin:0 0 5px}.dw-sync-box>p{color:#aebdca}.dw-sync-warning{padding:13px;border:1px solid rgba(222,185,112,.32);border-radius:13px;background:rgba(222,185,112,.07);color:#e6c88c!important;line-height:1.45}.dw-sync-warning b{color:#f1d69d}
      .dw-sync-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:14px 0}.dw-sync-card{padding:14px;border:1px solid rgba(255,255,255,.1);border-radius:14px;background:rgba(0,0,0,.14)}.dw-sync-card h3{margin:0 0 6px;font-size:.95rem}.dw-sync-card p{margin:4px 0;color:#b3c2ce;font-size:.8rem;line-height:1.45}.dw-sync-card .btn{width:100%;margin-top:10px;min-height:44px}.dw-sync-compare{padding:10px 12px;border-radius:10px;background:rgba(255,179,92,.08);color:#e5c488}.dw-sync-compare.same{background:rgba(113,212,156,.08);color:#9ae2b9}
      .dw-sync-primary{display:flex;gap:10px;align-items:flex-start;padding:13px;border:1px solid rgba(255,255,255,.1);border-radius:13px;background:rgba(0,0,0,.14)}.dw-sync-primary input{width:20px;height:20px;flex:0 0 auto;margin-top:2px;accent-color:var(--accent)}.dw-sync-primary strong{display:block}.dw-sync-primary small{display:block;margin-top:4px;color:#aebdca;line-height:1.4}.dw-sync-actions{display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap;margin-top:15px}.dw-sync-message{min-height:1.3em;color:#a9dfbf}.dw-sync-message.bad{color:#ffaaaa}.dw-sync-meta{font-size:.74rem;color:#8fa4b0!important}
      @media(max-width:600px){.dw-sync-grid{grid-template-columns:1fr}.dw-sync-box{padding:17px}.dw-sync-actions .btn{flex:1 1 auto}}
    `;
    document.head.appendChild(s);
  }

  function buildModal() {
    if (modal) return;
    addStyles();
    modal = document.createElement("div"); modal.className="dw-sync-modal"; modal.id="dwSyncModal";
    modal.innerHTML = `<div class="dw-sync-box" role="dialog" aria-modal="true" aria-labelledby="dwSyncTitle">
      <h2 id="dwSyncTitle">Sincronizar dados</h2>
      <p>Compare as duas versões e escolha qual conteúdo deve prevalecer.</p>
      <p class="dw-sync-warning"><b>Nenhuma substituição acontece automaticamente.</b> O app nunca faz pull sozinho. No modo manual, também não envia autosaves para substituir a nuvem.</p>
      <div id="dwSyncCompare" class="dw-sync-compare">Nenhuma substituição será feita automaticamente.</div>
      <div class="dw-sync-grid">
        <section class="dw-sync-card"><h3>↓ Trazer conteúdo da nuvem</h3><p id="dwSyncRemoteSummary">Ainda não consultado</p><p id="dwSyncRemoteTime" class="dw-sync-meta">Consulte a nuvem para comparar antes de decidir.</p><button id="dwSyncPull" class="btn" type="button">Trazer da nuvem</button></section>
        <section class="dw-sync-card"><h3>↑ Enviar conteúdo deste dispositivo</h3><p id="dwSyncLocalSummary"></p><p id="dwSyncLocalTime" class="dw-sync-meta"></p><button id="dwSyncPush" class="btn secondary" type="button">Enviar para a nuvem</button></section>
      </div>
      <label class="dw-sync-primary"><input id="dwSyncPrimary" type="checkbox"><span><strong>Definir este dispositivo como principal</strong><small id="dwSyncModeText">Manual protegido</small></span></label>
      <p class="dw-sync-meta">Dispositivo principal = este aparelho é a fonte de verdade para autosaves. Ele pode enviar alterações automaticamente, mas <b>nunca recebe pull automático</b>.</p>
      <p id="dwSyncLast" class="dw-sync-meta"></p><p id="dwSyncMessage" class="dw-sync-message" aria-live="polite"></p>
      <div class="dw-sync-actions"><button id="dwSyncRestore" class="btn secondary" type="button">Restaurar último backup</button><button id="dwSyncRefresh" class="btn secondary" type="button">Comparar agora</button><button id="dwSyncClose" class="btn secondary" type="button">Fechar</button></div>
    </div>`;
    document.body.appendChild(modal);
    modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });
    $("dwSyncClose").addEventListener("click", closeModal);
    $("dwSyncRefresh").addEventListener("click", refreshComparison);
    $("dwSyncPull").addEventListener("click", (e) => pullNow(e.currentTarget));
    $("dwSyncPush").addEventListener("click", (e) => pushNow(e.currentTarget));
    $("dwSyncRestore").addEventListener("click", restoreBackup);
    $("dwSyncPrimary").addEventListener("change", (e) => {
      if (e.target.checked) {
        const ok = confirm("Tornar este dispositivo PRINCIPAL? A partir das próximas alterações, ele poderá enviar autosaves para a nuvem. Pull continuará sempre manual. O conteúdo atual não será enviado neste instante.");
        if (!ok) { e.target.checked = false; return; }
        setMode("primary");
      } else setMode("manual");
      renderComparison();
    });
  }

  function openModal() {
    buildModal();
    arm = { action:"", until:0 };
    remoteRow = null;
    renderComparison();
    modal.classList.add("open");
    document.body.style.overflow = "hidden";
    if (params().id) refreshComparison();
    else setMessage("Crie primeiro uma ficha na nuvem para habilitar a sincronização.", true);
  }
  function closeModal() { if(modal)modal.classList.remove("open");document.body.style.overflow=""; }

  function inject() {
    addStyles();
    const actions = document.querySelector(".top-actions");
    if (actions && !$("dwSyncTopBtn")) {
      const b=document.createElement("button");b.id="dwSyncTopBtn";b.className="btn secondary";b.type="button";b.textContent="Sincronizar";b.addEventListener("click",openModal);
      const account = actions.querySelector(".dw-auth-account"); actions.insertBefore(b, account || actions.firstChild);
    }
    // O botão antigo de 'Salvar agora' passa a abrir o fluxo protegido.
    document.addEventListener("click", (e) => {
      if (e.target?.id !== "saveCloudBtn") return;
      e.preventDefault(); e.stopImmediatePropagation(); openModal();
    }, true);
    updateStatus();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", inject, { once:true });
  else inject();
  window.addEventListener("online", updateStatus);
  window.addEventListener("offline", updateStatus);
})();
