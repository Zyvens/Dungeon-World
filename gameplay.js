(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const cfg = window.DW_CONFIG || {};
  const api = () => window.DW_API;
  let roomCode = "";
  let boardState = { mapImage: null, grid: true, gridSize: 10, fit: "contain" };
  let tokenMeta = new Map();
  let tokenPositions = new Map();
  let versions = { board: -1, token: -1, position: -1 };
  let pollTimer = null;
  let presenceTimer = null;
  let pollBusy = false;
  let draggingId = null;
  let pendingMove = null;
  let moveTimer = null;
  let lastMoveAt = 0;
  let boardSaveTimer = null;
  let pendingTokenImage = null;
  let toastTimer = null;

  function toast(msg, bad = false) {
    const el = $("toast"); if (!el) return;
    el.textContent = msg; el.style.borderColor = bad ? "rgba(255,123,123,.45)" : "rgba(113,212,156,.35)";
    el.classList.add("show"); clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove("show"), 2800);
  }
  function first(v) { return Array.isArray(v) ? v[0] : v; }
  function clamp(v, min, max) { return Math.min(max, Math.max(min, Number(v) || 0)); }
  function uid() { return `token-${Date.now()}-${Math.random().toString(36).slice(2,8)}`; }
  function esc(v) { return String(v || "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }

  async function ensureAuth() {
    if (!window.DW_AUTH) throw new Error("Autenticação ainda não carregou.");
    return window.DW_AUTH.ensureSignedIn();
  }
  function displayName() {
    return window.DW_AUTH?.getSession?.()?.user?.name || window.DW_AUTH?.getSession?.()?.user?.email?.split("@")[0] || "Jogador";
  }

  async function createGame() {
    try {
      await ensureAuth();
      const pin = $("createGamePin").value.trim();
      if (!/^\d{4,8}$/.test(pin)) { toast("O PIN precisa ter de 4 a 8 números.", true); return; }
      const title = $("createGameTitle").value.trim() || "Gameplay";
      $("lobbyStatus").textContent = "Criando sala…";
      const row = first(await api().rpc("gameplay_create", { p_pin: pin, p_title: title, p_board: boardState, p_display_name: displayName() }));
      if (!row?.code) throw new Error("A sala não retornou um código.");
      toast(`Gameplay ${row.code} criado.`);
      await enterGame(row.code);
    } catch (err) { $("lobbyStatus").textContent = err?.message || "Não foi possível criar a sala."; toast("Falha ao criar Gameplay.", true); }
  }

  async function joinGame() {
    try {
      await ensureAuth();
      const code = $("joinGameCode").value.trim().toUpperCase();
      const pin = $("joinGamePin").value.trim();
      if (!/^[A-Z0-9]{8}$/.test(code)) { toast("Informe o código de 8 caracteres.", true); return; }
      if (!/^\d{4,8}$/.test(pin)) { toast("Informe o PIN da partida.", true); return; }
      $("lobbyStatus").textContent = "Entrando…";
      await api().rpc("gameplay_join", { p_code: code, p_pin: pin, p_display_name: displayName() });
      $("joinGamePin").value = "";
      await enterGame(code);
    } catch (err) { $("lobbyStatus").textContent = "Código ou PIN inválido, ou sua sessão expirou."; toast(err?.message || "Não foi possível entrar.", true); }
  }

  async function tryOpenMembership(code) {
    if (!code) return false;
    try {
      await window.DW_AUTH.ready;
      if (!window.DW_AUTH.getSession?.()?.user) return false;
      await enterGame(code, true);
      return true;
    } catch (_) { return false; }
  }

  async function enterGame(code, silent = false) {
    roomCode = code.trim().toUpperCase();
    versions = { board: -1, token: -1, position: -1 };
    tokenMeta.clear(); tokenPositions.clear();
    const meta = first(await api().rpc("gameplay_meta", { p_code: roomCode }, { interactive: !silent }));
    if (!meta) throw new Error("Gameplay não encontrado para esta conta.");
    $("gameLobby").classList.add("hidden"); $("gameSession").classList.remove("hidden");
    $("gameCodeOut").textContent = roomCode; $("gameTitleOut").textContent = meta.title || "Gameplay";
    const u = new URL(location.href); u.searchParams.set("game", roomCode); history.replaceState({}, "", u);
    await refreshFromMeta(meta, true); await refreshPresence();
    stopPolling();
    pollTimer = setInterval(poll, Number(cfg.gameplayPollMs) || 750);
    presenceTimer = setInterval(refreshPresence, Number(cfg.presencePollMs) || 5000);
    setSync("Sincronizado", true);
  }

  function stopPolling() { clearInterval(pollTimer); clearInterval(presenceTimer); pollTimer = presenceTimer = null; }

  async function poll() {
    if (!roomCode || pollBusy) return;
    pollBusy = true;
    try {
      const meta = first(await api().rpc("gameplay_meta", { p_code: roomCode }, { interactive: false }));
      if (meta) await refreshFromMeta(meta, false);
      setSync("Sincronizado", true);
    } catch (err) {
      setSync("Reconectando…", false);
      if (err?.status === 401) stopPolling();
    } finally { pollBusy = false; }
  }

  async function refreshFromMeta(meta, force) {
    $("gameTitleOut").textContent = meta.title || "Gameplay";
    if (force || Number(meta.board_version) !== versions.board) {
      const b = await api().rpc("gameplay_board", { p_code: roomCode }, { interactive: false });
      if (b && typeof b === "object") boardState = { ...boardState, ...b };
      versions.board = Number(meta.board_version); renderBoardSettings(); renderBoard();
    }
    if (force || Number(meta.token_version) !== versions.token) {
      const items = await api().rpc("gameplay_token_meta", { p_code: roomCode }, { interactive: false });
      tokenMeta = new Map((Array.isArray(items) ? items : []).map(t => [t.id, t]));
      versions.token = Number(meta.token_version); renderTokens(); renderTokenList();
    }
    if (force || Number(meta.position_version) !== versions.position) {
      const items = await api().rpc("gameplay_positions", { p_code: roomCode }, { interactive: false });
      (Array.isArray(items) ? items : []).forEach(p => { if (p.id !== draggingId) tokenPositions.set(p.id, p); });
      for (const id of [...tokenPositions.keys()]) if (!tokenMeta.has(id) && id !== draggingId) tokenPositions.delete(id);
      versions.position = Number(meta.position_version); applyPositions();
    }
  }

  async function refreshPresence() {
    if (!roomCode) return;
    try {
      const people = await api().rpc("gameplay_members_online", { p_code: roomCode }, { interactive: false });
      const list = $("onlinePlayers");
      list.innerHTML = (Array.isArray(people) ? people : []).map(p => `<span class="online-person ${p.you ? "you" : ""}">${esc(p.name)}${p.you ? " · você" : ""}</span>`).join("") || '<span class="game-hint">Só você por enquanto.</span>';
    } catch (_) {}
  }

  function setSync(text, online) { const el = $("gameSyncStatus"); el.textContent = text; el.classList.toggle("online", !!online); }

  function renderBoardSettings() {
    $("boardTitle").value = $("gameTitleOut").textContent || "Gameplay";
    $("boardFit").value = boardState.fit || "contain";
    $("boardGrid").value = String(boardState.grid !== false);
    $("boardGridSize").value = clamp(boardState.gridSize || 10, 4, 30);
    $("mapInfo").textContent = boardState.mapImage ? "Mapa compartilhado carregado." : "Nenhuma imagem de mapa.";
  }

  function renderBoard() {
    const board = $("gameBoard");
    board.style.backgroundImage = boardState.mapImage ? `url(${JSON.stringify(boardState.mapImage)})` : "none";
    board.style.setProperty("--map-fit", boardState.fit === "cover" ? "cover" : "contain");
    board.style.setProperty("--grid-cell", `${100 / clamp(boardState.gridSize || 10, 4, 30)}%`);
    board.classList.toggle("grid-on", boardState.grid !== false);
    $("gameBoardEmpty").classList.toggle("hidden", !!boardState.mapImage);
    $("boardTitleOut").textContent = $("gameTitleOut").textContent || "Mapa";
  }

  function renderTokens() {
    const board = $("gameBoard");
    board.querySelectorAll(".game-token").forEach(n => n.remove());
    for (const [id, meta] of tokenMeta) {
      const p = tokenPositions.get(id) || { x: 50, y: 50, z: meta.z || 1 };
      const el = document.createElement("div");
      el.className = "game-token"; el.dataset.tokenId = id;
      el.style.setProperty("--x", p.x); el.style.setProperty("--y", p.y); el.style.setProperty("--size", meta.size || 9); el.style.setProperty("--z", p.z || meta.z || 1); el.style.setProperty("--token-color", meta.color || "#8bc7ee");
      el.innerHTML = `${meta.image ? `<img src="${esc(meta.image)}" alt="" />` : `<span class="token-initial">${esc((meta.name || "?").trim().charAt(0).toUpperCase())}</span>`}<span class="game-token-label">${esc(meta.name || "Personagem")}</span><button class="game-token-delete" type="button" aria-label="Remover">×</button>`;
      el.querySelector(".game-token-delete").addEventListener("pointerdown", e => e.stopPropagation());
      el.querySelector(".game-token-delete").addEventListener("click", e => { e.stopPropagation(); removeToken(id, meta.name); });
      el.addEventListener("pointerdown", startDrag);
      board.appendChild(el);
    }
    applyPositions();
  }

  function applyPositions() {
    for (const [id, p] of tokenPositions) {
      const el = document.querySelector(`.game-token[data-token-id="${CSS.escape(id)}"]`);
      if (!el || id === draggingId) continue;
      el.style.setProperty("--x", p.x); el.style.setProperty("--y", p.y); el.style.setProperty("--z", p.z || 1);
    }
  }

  function renderTokenList() {
    const list = $("gameTokenList");
    list.innerHTML = [...tokenMeta.values()].map(t => `<div class="game-token-row"><span class="game-token-dot" style="--dot:${esc(t.color || "#8bc7ee")}"></span><strong>${esc(t.name || "Personagem")}</strong><button class="icon-btn danger" type="button" data-delete-token="${esc(t.id)}">×</button></div>`).join("");
    list.querySelectorAll("[data-delete-token]").forEach(b => b.addEventListener("click", () => removeToken(b.dataset.deleteToken, tokenMeta.get(b.dataset.deleteToken)?.name)));
  }

  function startDrag(e) {
    if (e.button !== undefined && e.button !== 0) return;
    const el = e.currentTarget; draggingId = el.dataset.tokenId; el.classList.add("dragging");
    try { el.setPointerCapture(e.pointerId); } catch (_) {}
    const move = ev => {
      const rect = $("gameBoard").getBoundingClientRect();
      const x = clamp(((ev.clientX - rect.left) / rect.width) * 100, 0, 100);
      const y = clamp(((ev.clientY - rect.top) / rect.height) * 100, 0, 100);
      tokenPositions.set(draggingId, { id: draggingId, x, y, z: tokenPositions.get(draggingId)?.z || 1 });
      el.style.setProperty("--x", x); el.style.setProperty("--y", y);
      queueMove(draggingId, x, y, false);
    };
    const end = ev => {
      move(ev); const p = tokenPositions.get(draggingId); queueMove(draggingId, p.x, p.y, true);
      el.classList.remove("dragging"); draggingId = null;
      el.removeEventListener("pointermove", move); el.removeEventListener("pointerup", end); el.removeEventListener("pointercancel", end);
    };
    el.addEventListener("pointermove", move); el.addEventListener("pointerup", end); el.addEventListener("pointercancel", end);
    e.preventDefault();
  }

  function queueMove(id, x, y, force) {
    pendingMove = { id, x, y };
    const send = async () => {
      clearTimeout(moveTimer); moveTimer = null;
      const m = pendingMove; pendingMove = null; if (!m || !roomCode) return;
      lastMoveAt = Date.now();
      try { await api().rpc("gameplay_move_token", { p_code: roomCode, p_token_id: m.id, p_x: m.x, p_y: m.y }, { interactive: false }); setSync("Enviado", true); } catch (_) { setSync("Erro ao mover", false); }
    };
    if (force) { send(); return; }
    const wait = Math.max(0, 180 - (Date.now() - lastMoveAt));
    if (!moveTimer) moveTimer = setTimeout(send, wait);
  }

  async function addToken() {
    if (!roomCode) return;
    const name = $("tokenName").value.trim() || "Personagem";
    const token = { id: uid(), name, color: $("tokenColor").value, size: Number($("tokenSize").value) || 9, image: pendingTokenImage, x: 50, y: 50, z: tokenMeta.size + 1 };
    try {
      await api().rpc("gameplay_upsert_token", { p_code: roomCode, p_token: token });
      pendingTokenImage = null; $("tokenImageInput").value = ""; $("tokenName").value = "";
      versions.token = versions.position = -1; await poll(); toast(`${name} adicionado ao mapa.`);
    } catch (err) { toast(err?.message || "Não foi possível adicionar o boneco.", true); }
  }

  async function removeToken(id, name) {
    if (!confirm(`Remover ${name || "este boneco"} do mapa para todos?`)) return;
    try { await api().rpc("gameplay_delete_token", { p_code: roomCode, p_token_id: id }); versions.token = versions.position = -1; await poll(); } catch (err) { toast(err?.message || "Falha ao remover.", true); }
  }

  function scheduleBoardSave() { clearTimeout(boardSaveTimer); boardSaveTimer = setTimeout(saveBoard, 550); }
  async function saveBoard() {
    if (!roomCode) return;
    boardState.fit = $("boardFit").value; boardState.grid = $("boardGrid").value === "true"; boardState.gridSize = clamp($("boardGridSize").value, 4, 30);
    const title = $("boardTitle").value.trim() || "Gameplay";
    renderBoard();
    try { await api().rpc("gameplay_set_board", { p_code: roomCode, p_title: title, p_board: boardState }); $("gameTitleOut").textContent = title; versions.board = -1; setSync("Mapa salvo", true); } catch (err) { toast(err?.message || "Falha ao salvar mapa.", true); }
  }

  async function resizeImage(file, max = 1600, quality = .72) {
    return new Promise((resolve, reject) => {
      const r = new FileReader(); r.onerror = reject; r.onload = () => {
        const img = new Image(); img.onerror = reject; img.onload = () => {
          let w = img.width, h = img.height; const f = Math.min(1, max / Math.max(w, h)); w = Math.round(w * f); h = Math.round(h * f);
          const c = document.createElement("canvas"); c.width = w; c.height = h; c.getContext("2d").drawImage(img, 0, 0, w, h);
          resolve(c.toDataURL("image/webp", quality));
        }; img.src = r.result;
      }; r.readAsDataURL(file);
    });
  }

  async function mapUpload(e) {
    const f = e.target.files?.[0]; if (!f) return;
    try { $("mapInfo").textContent = "Otimizando mapa…"; boardState.mapImage = await resizeImage(f, 1800, .7); renderBoard(); scheduleBoardSave(); $("mapInfo").textContent = "Mapa pronto para sincronizar."; } catch (_) { toast("Não foi possível processar a imagem.", true); }
  }
  async function tokenImageUpload(e) { const f = e.target.files?.[0]; if (!f) return; try { pendingTokenImage = await resizeImage(f, 320, .76); toast("Imagem do boneco pronta."); } catch (_) { toast("Falha na imagem do boneco.", true); } }

  function shareGame() {
    const u = new URL(location.href); u.searchParams.delete("sheet"); u.searchParams.set("game", roomCode); u.hash = "";
    navigator.clipboard?.writeText(u.href).then(() => toast("Link da partida copiado. Envie o PIN separadamente.")).catch(() => prompt("Copie o link da partida:", u.href));
  }
  function leaveGame() {
    stopPolling(); roomCode = ""; tokenMeta.clear(); tokenPositions.clear();
    $("gameSession").classList.add("hidden"); $("gameLobby").classList.remove("hidden");
    const u = new URL(location.href); u.searchParams.delete("game"); history.replaceState({}, "", u);
  }

  function bind() {
    $("createGameBtn").addEventListener("click", createGame); $("joinGameBtn").addEventListener("click", joinGame);
    $("joinGameCode").addEventListener("input", e => e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0,8));
    $("createGamePin").addEventListener("input", e => e.target.value = e.target.value.replace(/\D/g, "").slice(0,8)); $("joinGamePin").addEventListener("input", e => e.target.value = e.target.value.replace(/\D/g, "").slice(0,8));
    $("gameShareBtn").addEventListener("click", shareGame); $("gameShareTop").addEventListener("click", shareGame); $("leaveGameBtn").addEventListener("click", leaveGame);
    ["boardTitle","boardFit","boardGrid","boardGridSize"].forEach(id => $(id).addEventListener("input", scheduleBoardSave));
    $("mapImageInput").addEventListener("change", mapUpload); $("removeMapBtn").addEventListener("click", () => { boardState.mapImage = null; $("mapImageInput").value = ""; renderBoard(); scheduleBoardSave(); });
    $("tokenImageInput").addEventListener("change", tokenImageUpload); $("clearTokenImageBtn").addEventListener("click", () => { pendingTokenImage = null; $("tokenImageInput").value = ""; toast("Token sem imagem selecionado."); }); $("addTokenBtn").addEventListener("click", addToken);
  }

  async function init() {
    bind();
    const code = new URL(location.href).searchParams.get("game")?.trim().toUpperCase() || "";
    if (code) { $("joinGameCode").value = code; $("lobbyStatus").textContent = "Esta URL aponta para uma partida compartilhada. Entre na conta e informe o PIN se for seu primeiro acesso."; }
    try { await window.DW_AUTH.ready; if (code && window.DW_AUTH.getSession?.()?.user) await tryOpenMembership(code); } catch (_) {}
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true }); else init();
  window.addEventListener("beforeunload", stopPolling);
})();
