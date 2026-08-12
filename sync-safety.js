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
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  function params() {
    const u = new URL(location.href);
    return {
      id: u.searchParams.get("sheet") || "",
      key: new URLSearchParams(u.hash.replace(/^#/, "")).get("key") || ""
    };
  }

  function setCloudParams(id, key) {
    const old = params();
    const oldMode = localStorage.getItem(MODE_PREFIX + (old.id || "unlinked"));
    const u = new URL(location.href);
    u.searchParams.set("sheet", id);
    u.hash = key ? `key=${encodeURIComponent(key)}` : "";
    history.replaceState({}, "", u);
    if (oldMode && !localStorage.getItem(MODE_PREFIX + id)) localStorage.setItem(MODE_PREFIX + id, oldMode);
  }

  function modeKey(id = params().id) { return MODE_PREFIX + (id || "unlinked"); }
  function getMode() { return localStorage.getItem(modeKey()) === "primary" ? "primary" : "manual"; }
  function setMode(next) { localStorage.setItem(modeKey(), next === "primary" ? "primary" : "manual"); updateStatus(); renderComparison(); }

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
    if (value && typeof value === "object") return Object.keys(value).sort().reduce((out, key) => { out[key] = canonical(value[key]); return out; }, {});
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
    return `${state.identity?.name || "Personagem sem nome"} · nível ${state.status?.level ?? "—"} · ${Array.isArray(state.equipment) ? state.equipment.length : 0} equipamentos · ${Array.isArray(state.people) ? state.people.length : 0} personagens · ${String(state.story || "").trim().length} caracteres de história`;
  }

  function formatDate(value) {
    if (!value) return "horário não informado";
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? "horário não informado" : d.toLocaleString("pt-BR");
  }

  function jsonResponse(payload, status = 200) {
    return new Response(JSON.stringify(payload), { status, headers: { "content-type":"application/json; charset=utf-8", "cache-control":"no-store" } });
  }

  Storage.prototype.setItem = function(key, value) {
    const result = nativeSetItem.call(this, key, value);
    if (this === localStorage && key === STORAGE_KEY) nativeSetItem.call(localStorage, LOCAL_EDIT_KEY, new Date().toISOString());
    return result;
  };

  // Protege a ficha contra pull silencioso e contra autosave remoto em aparelhos manuais.
  window.fetch = async function(input, init = {}) {
    const raw = typeof input === "string" ? input : input?.url || "";
    let url;
    try { url = new URL(raw, location.href); } catch (_) { return adapterFetch(input, init); }
    const isSheet = url.pathname === "/api/sheet" || url.pathname.endsWith("/api/sheet");
    if (!isSheet) return adapterFetch(input, init);

    const method = String(init.method || "GET").toUpperCase();
    const current = params();

    if (method === "GET" && current.id) {
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
    for (let i = 0; i < 125 && !window.DW_API; i += 1) await sleep(40);
    if (!window.DW_API) throw new Error("Data API ainda não está disponível.");
    await window.DW_AUTH?.ready;
    if (!window.DW_AUTH?.getSession?.()?.user) await window.DW_AUTH?.ensureSignedIn?.();
    if (!window.DW_AUTH?.getSession?.()?.user) throw new Error("Faça login para sincronizar.");
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
    const payload = { created_at:new Date().toISOString(), reason, sheet_id:params().id || null, state:readLocalState(), media:readLocalMedia() };
    nativeSetItem.call(localStorage, BACKUP_KEY, JSON.stringify(payload));
    return payload;
  }

  function restoreBackup() {
    let backup = null;
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

  async function createLinkedCloud() {
    const localState = readLocalState();
    if (!localState) throw new Error("Não há ficha local válida para sincronizar.");
    await api();
    backupLocal("before-first-cloud-link");
    const payload = { ...localState, _media: readLocalMedia() };
    const res = await adapterFetch("/api/sheet", {
      method:"POST",
      headers:{ "content-type":"application/json" },
      body:JSON.stringify({ title:localState.identity?.name || "Nome do personagem", state:payload })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data?.id || !data?.token) throw new Error(data?.error || "Não foi possível criar a ficha na nuvem.");
    setCloudParams(data.id, data.token);
    const at = new Date().toISOString();
    nativeSetItem.call(localStorage, LAST_SYNC_PREFIX + data.id, JSON.stringify({ direction:"push", at, hash:hash(localState) }));
    remoteRow = { id:data.id, state:payload, updated_at:at };
    updateStatus();
    return data;
  }

  async function pullNow(button) {
    if (busy) return;
    if (!params().id) return setMessage("Ainda não existe uma ficha na nuvem para trazer. Use “Enviar para a nuvem” para criar o vínculo primeiro.", true);
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
      setMessage("Conteúdo da nuvem aplicado. Recarregando a ficha…");
      setTimeout(() => location.reload(), 350);
    } catch (err) {
      setMessage(err?.message || "Não foi possível trazer a ficha da nuvem.", true);
      busy = false; disableActions(false);
    }
  }

  async function pushNow(button) {
    if (busy) return;
    const current = params();

    // Primeira sincronização: este botão deixa de ser figurativo e cria a ficha remota.
    if (!current.id) {
      if (!armAction("create", button, "Confirmar: criar na nuvem")) {
        setMessage("Esta ficha ainda não possui vínculo. Clique novamente para criar a ficha na nuvem usando o conteúdo deste dispositivo.");
        return;
      }
      busy = true; disableActions(true);
      try {
        const created = await createLinkedCloud();
        setMessage(`Ficha vinculada e enviada com sucesso. ID ${created.id}.`);
        renderComparison();
      } catch (err) {
        setMessage(err?.message || "Não foi possível criar o vínculo com a nuvem.", true);
      } finally {
        busy = false; disableActions(false); updateStatus();
      }
      return;
    }

    if (!current.key) return setMessage("Este link não possui chave de edição; não é possível substituir a nuvem.", true);
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
        p_id:current.id,
        p_edit_token:current.key,
        p_title:localState.identity?.name || "Nome do personagem",
        p_state:payload
      });
      if (ok !== true) throw new Error("A nuvem recusou a chave de edição.");
      const at = new Date().toISOString();
      nativeSetItem.call(localStorage, LAST_SYNC_PREFIX + current.id, JSON.stringify({ direction:"push", at, hash:hash(localState) }));
      remoteRow = { ...(remoteRow || {}), state:payload, updated_at:at };
      setMessage("Conteúdo deste dispositivo enviado para a nuvem com sucesso.");
      renderComparison();
    } catch (err) {
      setMessage(err?.message || "Não foi possível enviar a ficha para a nuvem.", true);
    } finally {
      busy = false; disableActions(false); updateStatus();
    }
  }

  async function smartSync() {
    if (busy) return;
    openModal();
    const current = params();
    const local = readLocalState();
    if (!local) return setMessage("Não há ficha local válida para sincronizar.", true);

    // Sem vínculo: sincronizar agora cria o vínculo e faz o primeiro push.
    if (!current.id) {
      busy = true; disableActions(true); setMessage("Criando vínculo seguro com a nuvem…");
      try {
        const created = await createLinkedCloud();
        setMessage(`Sincronização concluída. A ficha foi criada na nuvem e vinculada a este dispositivo (${created.id}).`);
      } catch (err) {
        setMessage(err?.message || "Não foi possível sincronizar agora.", true);
      } finally {
        busy = false; disableActions(false); renderComparison(); updateStatus();
      }
      return;
    }

    // Com vínculo: compara de verdade. Só conclui automaticamente quando os conteúdos são iguais.
    busy = true; disableActions(true); setMessage("Comparando este dispositivo com a nuvem…");
    try {
      const row = await fetchRemote();
      const remote = stripMedia(row.state);
      if (hash(local) === hash(remote)) {
        const at = new Date().toISOString();
        nativeSetItem.call(localStorage, LAST_SYNC_PREFIX + current.id, JSON.stringify({ direction:"verified", at, hash:hash(local) }));
        setMessage("Sincronização verificada: este dispositivo e a nuvem já possuem o mesmo conteúdo.");
      } else {
        setMessage("Há diferenças entre este dispositivo e a nuvem. Por segurança, nada foi sobrescrito: escolha “Trazer da nuvem” ou “Enviar para a nuvem”.", true);
      }
    } catch (err) {
      setMessage(err?.message || "Não foi possível comparar com a nuvem.", true);
    } finally {
      busy = false; disableActions(false); renderComparison(); updateStatus();
    }
  }

  function setMessage(text, bad = false) {
    const el = $("dwSyncMessage");
    if (!el) return;
    el.textContent = text || "";
    el.classList.toggle("bad", !!bad);
  }

  function disableActions(disabled) {
    ["dwSyncPull","dwSyncPush","dwSyncRefresh","dwSyncNow"].forEach((id) => { const el=$(id); if(el)el.disabled=disabled; });
  }

  function renderComparison() {
    if (!modal) return;
    const current = params();
    const local = readLocalState();
    const remoteState = stripMedia(remoteRow?.state);
    const same = !!local && !!remoteState && hash(local) === hash(remoteState);
    const localTime = localStorage.getItem(LOCAL_EDIT_KEY);
    let lastSync = null;
    try { lastSync = JSON.parse(localStorage.getItem(LAST_SYNC_PREFIX + current.id) || "null"); } catch (_) {}

    $("dwSyncLocalSummary").textContent = summary(local);
    $("dwSyncLocalTime").textContent = `Última alteração local detectada: ${formatDate(localTime)}`;
    $("dwSyncRemoteSummary").textContent = remoteState ? summary(remoteState) : (current.id ? "Ainda não consultado" : "Nenhuma ficha vinculada ainda");
    $("dwSyncRemoteTime").textContent = remoteRow ? `Última alteração informada pela nuvem: ${formatDate(remoteRow.updated_at)}` : (current.id ? "Use “Comparar agora” para consultar sem substituir nada." : "O primeiro envio criará a ficha na nuvem.");
    $("dwSyncCompare").textContent = same ? "As duas versões têm o mesmo conteúdo." : remoteState ? "As versões são diferentes. Escolha explicitamente qual deve prevalecer." : "Nenhuma substituição será feita automaticamente.";
    $("dwSyncCompare").classList.toggle("same", same);
    $("dwSyncLast").textContent = lastSync?.at ? `Última sincronização neste dispositivo: ${formatDate(lastSync.at)}.` : "Ainda não há sincronização registrada neste dispositivo.";

    const primary = getMode() === "primary";
    $("dwSyncPrimary").checked = primary;
    $("dwSyncModeText").textContent = primary ? "Principal: alterações deste dispositivo podem ser enviadas automaticamente. Pull continua sempre manual." : "Manual protegido: nenhuma versão remota substitui a local e nenhum autosave substitui a nuvem.";

    const push = $("dwSyncPush");
    if (push) push.textContent = current.id ? "Enviar para a nuvem" : "Criar na nuvem com estes dados";
    const pull = $("dwSyncPull");
    if (pull) pull.disabled = busy || !current.id;
  }

  async function refreshComparison() {
    if (busy) return;
    if (!params().id) return setMessage("Ainda não existe uma ficha remota para comparar. Use “Sincronizar agora” para criar e vincular esta ficha.", true);
    busy = true; disableActions(true); setMessage("Consultando a nuvem sem aplicar alterações…");
    try { await fetchRemote(); setMessage("Comparação atualizada. Nenhum dado foi substituído."); }
    catch (err) { setMessage(err?.message || "Não foi possível consultar a nuvem.", true); }
    finally { busy = false; disableActions(false); renderComparison(); }
  }

  function updateStatus(forcedText = "") {
    const status = $("cloudStatus");
    if (!status) return;
    const { id } = params();
    if (forcedText) { status.textContent = forcedText; return; }
    if (!id) status.textContent = "Local · não vinculado";
    else if (!navigator.onLine) status.textContent = "Nuvem · offline";
    else status.textContent = getMode() === "primary" ? "Nuvem · principal" : "Nuvem · manual";
  }

  function addStyles() {
    if ($("dwSyncSafetyStyles")) return;
    const s = document.createElement("style");
    s.id = "dwSyncSafetyStyles";
    s.textContent = `
      .dw-sync-modal{position:fixed;inset:0;z-index:10050;display:none;align-items:flex-start;justify-content:center;overflow:auto;padding:max(18px,env(safe-area-inset-top)) 16px max(24px,env(safe-area-inset-bottom));background:rgba(0,0,0,.76);backdrop-filter:blur(8px)}
      .dw-sync-modal.open{display:flex}.dw-sync-box{width:min(680px,100%);margin:auto;padding:22px;border:1px solid rgba(139,199,238,.24);border-radius:20px;background:#0b1825;color:#e7edf5;box-shadow:0 28px 80px rgba(0,0,0,.55)}
      .dw-sync-box h2{margin:0 0 5px}.dw-sync-box>p,.dw-sync-note{color:#9fb0c0;line-height:1.45}.dw-sync-warning{padding:13px;border:1px solid rgba(222,185,112,.32);border-radius:13px;background:rgba(222,185,112,.07);color:#e6c88c;line-height:1.45}
      .dw-sync-card{margin-top:14px;padding:15px;border:1px solid rgba(139,199,238,.18);border-radius:15px;background:rgba(3,10,17,.22)}.dw-sync-card h3{margin:0 0 5px}.dw-sync-card p{margin:5px 0;color:#aebdca;line-height:1.4}
      .dw-sync-card .btn{width:100%;margin-top:10px}.dw-sync-primary{display:flex;gap:12px;align-items:flex-start}.dw-sync-primary input{margin-top:5px;transform:scale(1.25)}
      .dw-sync-message{min-height:1.35em;margin:16px 0 8px;color:#9fdcb9}.dw-sync-message.bad{color:#ff9d9d}.dw-sync-actions{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:12px}.dw-sync-actions .wide{grid-column:1/-1}.dw-sync-same{color:#9fdcb9!important}
      @media(max-width:600px){.dw-sync-box{padding:17px}.dw-sync-actions{grid-template-columns:1fr}.dw-sync-actions .wide{grid-column:auto}}
    `;
    document.head.appendChild(s);
  }

  function buildModal() {
    if (modal) return;
    addStyles();
    modal = document.createElement("div");
    modal.className = "dw-sync-modal";
    modal.innerHTML = `<div class="dw-sync-box" role="dialog" aria-modal="true" aria-labelledby="dwSyncTitle">
      <h2 id="dwSyncTitle">Sincronizar dados</h2>
      <p>Compare e escolha qual versão deve prevalecer. Nenhum pull destrutivo acontece sozinho.</p>
      <div class="dw-sync-warning"><b>Proteção contra sobrescrita:</b> se houver divergência, o app exige uma decisão explícita. O botão “Sincronizar agora” só automatiza operações sem ambiguidade.</div>
      <div class="dw-sync-card"><h3>↓ Trazer conteúdo externo</h3><p id="dwSyncRemoteSummary">Ainda não consultado</p><p id="dwSyncRemoteTime"></p><button id="dwSyncPull" class="btn" type="button">Trazer da nuvem</button></div>
      <div class="dw-sync-card"><h3>↑ Enviar conteúdo deste dispositivo</h3><p id="dwSyncLocalSummary"></p><p id="dwSyncLocalTime"></p><button id="dwSyncPush" class="btn secondary" type="button">Enviar para a nuvem</button></div>
      <div class="dw-sync-card dw-sync-primary"><input id="dwSyncPrimary" type="checkbox"/><div><h3>Definir este dispositivo como principal</h3><p id="dwSyncModeText"></p></div></div>
      <p id="dwSyncCompare" class="dw-sync-note"></p><p id="dwSyncLast" class="dw-sync-note"></p>
      <div id="dwSyncMessage" class="dw-sync-message" aria-live="polite"></div>
      <div class="dw-sync-actions">
        <button id="dwSyncNow" class="btn wide" type="button">Sincronizar agora</button>
        <button id="dwSyncRestore" class="btn secondary wide" type="button">Restaurar último backup</button>
        <button id="dwSyncRefresh" class="btn secondary" type="button">Comparar agora</button>
        <button id="dwSyncClose" class="btn secondary" type="button">Fechar</button>
      </div>
    </div>`;
    document.body.appendChild(modal);
    $("dwSyncPull").addEventListener("click", (e) => pullNow(e.currentTarget));
    $("dwSyncPush").addEventListener("click", (e) => pushNow(e.currentTarget));
    $("dwSyncNow").addEventListener("click", smartSync);
    $("dwSyncRefresh").addEventListener("click", refreshComparison);
    $("dwSyncRestore").addEventListener("click", restoreBackup);
    $("dwSyncClose").addEventListener("click", closeModal);
    $("dwSyncPrimary").addEventListener("change", (e) => setMode(e.target.checked ? "primary" : "manual"));
    modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });
  }

  function openModal() { buildModal(); renderComparison(); modal.classList.add("open"); }
  function closeModal() { modal?.classList.remove("open"); }

  function installButtons() {
    const top = document.querySelector(".top-actions");
    if (top && !$("dwSyncTop")) {
      const b = document.createElement("button");
      b.id = "dwSyncTop"; b.type = "button"; b.className = "btn secondary"; b.textContent = "Sincronizar";
      b.addEventListener("click", smartSync);
      const cloud = $("cloudBtn"); top.insertBefore(b, cloud || top.firstChild);
    }

    const save = $("saveCloudBtn");
    if (save) {
      save.textContent = "Sincronizar agora";
      save.addEventListener("click", (e) => { e.preventDefault(); e.stopImmediatePropagation(); smartSync(); }, true);
    }

    updateStatus();
  }

  async function init() {
    if (document.readyState === "loading") await new Promise((resolve) => document.addEventListener("DOMContentLoaded", resolve, { once:true }));
    buildModal();
    installButtons();
    window.addEventListener("online", updateStatus);
    window.addEventListener("offline", updateStatus);
    window.addEventListener("popstate", () => { remoteRow = null; updateStatus(); renderComparison(); });
  }

  window.DW_SYNC_SAFETY = { open:openModal, syncNow:smartSync, compare:refreshComparison };
  init();
})();