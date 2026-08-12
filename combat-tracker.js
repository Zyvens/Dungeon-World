(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  const esc = (v) => String(v ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const TYPES = [["hero","Herói"],["passivo","Passivo"],["inimigo","Inimigo"]];
  const STATUSES = [["","Normal"],["atordoado","Atordoado"],["preso","Preso"],["envenenado","Envenenado"],["fogo","Fogo"],["voando","Voando"],["medo","Medo"],["furia","Fúria"],["morto","Morto"]];
  let code = "", meta = new Map(), positions = new Map(), board = {}, combat = null;
  let pollTimer = null, saveTimer = null, selectedId = "", draggingRowId = "", busy = false;

  function roomCode(){
    const fromUrl = new URL(location.href).searchParams.get("game");
    const fromUi = $("gameCodeOut")?.textContent;
    const v = String(fromUrl || fromUi || "").trim().toUpperCase();
    return /^[A-Z0-9]{8}$/.test(v) ? v : "";
  }
  async function api(){
    for(let i=0;i<120&&!window.DW_API;i++) await sleep(50);
    if(!window.DW_API) throw new Error("Data API indisponível.");
    return window.DW_API;
  }
  function first(v){ return Array.isArray(v) ? v[0] : v; }
  function defaultCombat(ids=[]){ return { turnNumber:1, currentIndex:0, order:[...ids], roster:{} }; }
  function normalizeCombat(raw, ids){
    const next = raw && typeof raw === "object" ? JSON.parse(JSON.stringify(raw)) : defaultCombat(ids);
    next.roster = next.roster && typeof next.roster === "object" ? next.roster : {};
    const valid = new Set(ids);
    next.order = Array.isArray(next.order) ? next.order.filter(id=>valid.has(id)) : [];
    ids.forEach(id=>{ if(!next.order.includes(id)) next.order.push(id); next.roster[id] ||= {type:"hero",status:""}; });
    Object.keys(next.roster).forEach(id=>{ if(!valid.has(id)) delete next.roster[id]; });
    next.turnNumber = Math.max(1, Number(next.turnNumber)||1);
    next.currentIndex = next.order.length ? Math.max(0, Math.min(next.order.length-1, Number(next.currentIndex)||0)) : 0;
    return next;
  }
  function currentId(){ return combat?.order?.[combat.currentIndex] || ""; }

  async function loadRemote(){
    code = roomCode(); if(!code) return false;
    const a = await api();
    const [b,tm,pos] = await Promise.all([
      a.rpc("gameplay_board",{p_code:code},{interactive:false}),
      a.rpc("gameplay_token_meta",{p_code:code},{interactive:false}),
      a.rpc("gameplay_positions",{p_code:code},{interactive:false})
    ]);
    board = b && typeof b === "object" ? b : {};
    const items = Array.isArray(tm)?tm:[]; meta = new Map(items.map(t=>[t.id,t]));
    positions = new Map((Array.isArray(pos)?pos:[]).map(p=>[p.id,p]));
    combat = normalizeCombat(board.combat, items.map(t=>t.id));
    return true;
  }
  async function saveCombat(){
    if(!code || busy) return; busy=true;
    try{
      const a=await api();
      const latest=await a.rpc("gameplay_board",{p_code:code},{interactive:false});
      const merged={...(latest&&typeof latest==="object"?latest:{}),combat};
      const title=$("gameTitleOut")?.textContent?.trim()||"Gameplay";
      await a.rpc("gameplay_set_board",{p_code:code,p_title:title,p_board:merged},{interactive:false});
      board=merged;
    }catch(err){ console.warn("Falha ao salvar rastreador de turnos",err); }
    finally{busy=false;}
  }
  function scheduleSave(){ clearTimeout(saveTimer); saveTimer=setTimeout(saveCombat,180); }

  function updateGridSquares(){
    const el=$("gameBoard"); if(!el) return;
    const cells=Math.max(4,Math.min(30,Number($("boardGridSize")?.value)||10));
    const px=Math.max(18,el.clientWidth/cells);
    el.style.setProperty("--grid-px",`${px}px`);
  }

  function ensureUI(){
    const card=document.querySelector(".game-board-card"); if(!card||$("combatTurnbar")) return;
    const toolbar=card.querySelector(".game-board-toolbar");
    const turn=document.createElement("div"); turn.id="combatTurnbar"; turn.className="combat-turnbar";
    turn.innerHTML=`<div class="combat-turn-current"><span>Turno atual</span><b id="combatTurnNumber">1</b></div><div class="combat-turn-current"><span>Jogador atual</span><b id="combatCurrentName">—</b></div><button id="combatReset" class="btn secondary" type="button">Zerar turnos</button><button id="combatPrev" class="btn secondary" type="button">← Voltar turno</button><button id="combatNext" class="btn" type="button">Próximo turno →</button>`;
    card.insertBefore(turn,toolbar);
    const roster=document.createElement("section"); roster.id="combatRoster"; roster.className="combat-roster";
    roster.innerHTML=`<div class="combat-roster-head"><div><h3>Ordem de turnos</h3><p>Arraste pelo símbolo ☰ para mudar a ordem. Toque em Mudar ou no pin para selecionar sem mover a página.</p></div></div><div id="combatList" class="combat-list"></div>`;
    card.appendChild(roster);
    $("gameTokenList")?.classList.add("combat-hidden-original-list");
    $("combatReset").addEventListener("click",()=>{ if(!combat)return; combat.turnNumber=1;combat.currentIndex=0;scheduleSave();render(); });
    $("combatPrev").addEventListener("click",()=>stepTurn(-1));
    $("combatNext").addEventListener("click",()=>stepTurn(1));
    $("boardGridSize")?.addEventListener("input",updateGridSquares);
    window.addEventListener("resize",updateGridSquares);
    const boardEl=$("gameBoard");
    boardEl?.addEventListener("click",e=>{
      const token=e.target.closest?.(".game-token"); if(!token)return;
      selectedId=token.dataset.tokenId||""; renderSelection();
    },true);
    if(window.ResizeObserver&&boardEl) new ResizeObserver(updateGridSquares).observe(boardEl);
  }

  function stepTurn(dir){
    if(!combat?.order?.length)return;
    if(dir>0){ combat.currentIndex++; if(combat.currentIndex>=combat.order.length){combat.currentIndex=0;combat.turnNumber++;} }
    else { combat.currentIndex--; if(combat.currentIndex<0){ if(combat.turnNumber>1){combat.turnNumber--;combat.currentIndex=combat.order.length-1;} else combat.currentIndex=0; } }
    scheduleSave(); render();
  }

  function typeOptions(value){return TYPES.map(([v,l])=>`<option value="${v}" ${v===value?"selected":""}>${l}</option>`).join("");}
  function statusOptions(value){return STATUSES.map(([v,l])=>`<option value="${v}" ${v===value?"selected":""}>${l}</option>`).join("");}
  function rowHtml(id,index){
    const t=meta.get(id)||{}, extra=combat.roster[id]||{type:"hero",status:""};
    return `<div class="combat-row" data-combat-id="${esc(id)}"><button class="combat-grab" type="button" title="Arrastar para mudar ordem" aria-label="Arrastar">☰</button><div class="combat-order">${index+1}</div><input class="combat-color" data-field="color" type="color" value="${esc(t.color||"#8bc7ee")}" title="Cor"/><input class="combat-name" data-field="name" value="${esc(t.name||"Personagem")}" maxlength="80" aria-label="Nome"/><button class="btn secondary combat-select" type="button" data-action="select">Mudar</button><select class="combat-type" data-field="type" aria-label="Tipo">${typeOptions(extra.type||"hero")}</select><select class="combat-status" data-field="status" aria-label="Status">${statusOptions(extra.status||"")}</select><label class="combat-image" title="Trocar imagem">${t.image?`<img src="${esc(t.image)}" alt=""/>`:`<span class="combat-image-placeholder">Imagem</span>`}<input data-action="image" type="file" accept="image/*" hidden/></label><button class="icon-btn danger combat-delete" type="button" data-action="delete" aria-label="Excluir">×</button></div>`;
  }
  function render(){
    ensureUI(); if(!combat)return;
    const list=$("combatList"); if(!list)return;
    list.innerHTML=combat.order.map(rowHtml).join("");
    const cur=currentId(), curMeta=meta.get(cur);
    $("combatTurnNumber").textContent=`Rodada ${combat.turnNumber}`;
    $("combatCurrentName").textContent=curMeta?.name||"—";
    list.querySelectorAll(".combat-row").forEach(row=>bindRow(row));
    decorateTokens(); renderSelection(); updateGridSquares();
  }
  function renderSelection(){
    document.querySelectorAll(".combat-row").forEach(r=>r.classList.toggle("selected",r.dataset.combatId===selectedId));
    document.querySelectorAll(".game-token").forEach(t=>t.classList.toggle("combat-selected",t.dataset.tokenId===selectedId));
  }
  function decorateTokens(){
    const cur=currentId();
    document.querySelectorAll(".game-token").forEach(t=>{
      const id=t.dataset.tokenId, extra=combat?.roster?.[id]||{};
      t.classList.remove("combat-token-hero","combat-token-passivo","combat-token-inimigo","combat-current");
      t.classList.add(`combat-token-${extra.type||"hero"}`); t.classList.toggle("combat-current",id===cur);
      t.querySelector(".combat-status-badge")?.remove();
      if(extra.status){const badge=document.createElement("span");badge.className="combat-status-badge";badge.textContent=STATUSES.find(x=>x[0]===extra.status)?.[1]||extra.status;t.appendChild(badge);}
    });
    document.querySelectorAll(".combat-row").forEach(r=>r.classList.toggle("current",r.dataset.combatId===cur));
  }

  function bindRow(row){
    const id=row.dataset.combatId;
    row.querySelector('[data-action="select"]').addEventListener("click",()=>{selectedId=id;renderSelection();});
    row.querySelector('[data-field="type"]').addEventListener("change",e=>{combat.roster[id].type=e.target.value;scheduleSave();decorateTokens();});
    row.querySelector('[data-field="status"]').addEventListener("change",e=>{combat.roster[id].status=e.target.value;scheduleSave();decorateTokens();});
    row.querySelector('[data-field="name"]').addEventListener("change",e=>updateToken(id,{name:e.target.value.trim()||"Personagem"}));
    row.querySelector('[data-field="color"]').addEventListener("change",e=>updateToken(id,{color:e.target.value}));
    row.querySelector('[data-action="delete"]').addEventListener("click",()=>deleteToken(id));
    row.querySelector('[data-action="image"]').addEventListener("change",async e=>{const f=e.target.files?.[0];if(!f)return;try{const image=await resizeImage(f,320,.78);await updateToken(id,{image});}catch(err){alert(err.message||"Falha ao processar imagem.");}});
    row.querySelector(".combat-grab").addEventListener("pointerdown",e=>startRowDrag(e,row));
  }

  async function updateToken(id,patch){
    const old=meta.get(id); if(!old)return;
    const p=positions.get(id)||{x:50,y:50,z:old.z||1};
    const next={...old,...patch,x:p.x,y:p.y,z:p.z||old.z||1};
    try{const a=await api();await a.rpc("gameplay_upsert_token",{p_code:code,p_token:next});meta.set(id,next);render();}
    catch(err){alert(err?.message||"Não foi possível atualizar o boneco.");}
  }
  async function deleteToken(id){
    const name=meta.get(id)?.name||"este boneco"; if(!confirm(`Excluir ${name} do mapa e da ordem de turnos?`))return;
    try{const a=await api();await a.rpc("gameplay_delete_token",{p_code:code,p_token_id:id});meta.delete(id);positions.delete(id);combat.order=combat.order.filter(x=>x!==id);delete combat.roster[id];combat.currentIndex=Math.min(combat.currentIndex,Math.max(0,combat.order.length-1));await saveCombat();render();}
    catch(err){alert(err?.message||"Falha ao excluir boneco.");}
  }

  function startRowDrag(e,row){
    e.preventDefault(); draggingRowId=row.dataset.combatId; row.classList.add("dragging");
    const handle=e.currentTarget; try{handle.setPointerCapture(e.pointerId);}catch(_){}
    const move=ev=>{
      const rows=[...$("combatList").querySelectorAll(".combat-row")].filter(r=>r!==row);
      const target=rows.find(r=>{const b=r.getBoundingClientRect();return ev.clientY<b.top+b.height/2;});
      if(target) $("combatList").insertBefore(row,target); else $("combatList").appendChild(row);
    };
    const end=()=>{
      row.classList.remove("dragging");handle.removeEventListener("pointermove",move);handle.removeEventListener("pointerup",end);handle.removeEventListener("pointercancel",end);
      const oldCurrent=currentId();combat.order=[...$("combatList").querySelectorAll(".combat-row")].map(r=>r.dataset.combatId);combat.currentIndex=Math.max(0,combat.order.indexOf(oldCurrent));draggingRowId="";scheduleSave();render();
    };
    handle.addEventListener("pointermove",move);handle.addEventListener("pointerup",end);handle.addEventListener("pointercancel",end);
  }

  function resizeImage(file,max=320,quality=.78){return new Promise((resolve,reject)=>{if(!file.type.startsWith("image/"))return reject(new Error("Selecione uma imagem."));const r=new FileReader();r.onerror=reject;r.onload=()=>{const im=new Image();im.onerror=reject;im.onload=()=>{let w=im.width,h=im.height,f=Math.min(1,max/Math.max(w,h));w=Math.round(w*f);h=Math.round(h*f);const c=document.createElement("canvas");c.width=w;c.height=h;c.getContext("2d").drawImage(im,0,0,w,h);resolve(c.toDataURL("image/webp",quality));};im.src=r.result;};r.readAsDataURL(file);});}

  async function refresh(){
    if(!roomCode())return;
    try{await loadRemote();render();}
    catch(err){console.warn("Combat tracker refresh",err);}
  }
  function observeTokens(){
    const boardEl=$("gameBoard");if(!boardEl)return;
    new MutationObserver(()=>decorateTokens()).observe(boardEl,{childList:true,subtree:true});
  }
  async function init(){
    ensureUI();observeTokens();
    const out=$("gameCodeOut");if(out)new MutationObserver(()=>{if(roomCode()!==code)refresh();}).observe(out,{childList:true,characterData:true,subtree:true});
    await refresh();pollTimer=setInterval(refresh,1800);
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
  window.addEventListener("beforeunload",()=>{clearInterval(pollTimer);clearTimeout(saveTimer);});
})();