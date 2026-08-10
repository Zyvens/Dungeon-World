(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const MEDIA = () => window.DW_MEDIA?.get?.() || { equipment: {}, history: [] };
  const saveMedia = (m) => window.DW_MEDIA?.set?.(m);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (m) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));

  function style() {
    if ($("dwEnhancementStyles")) return;
    const el = document.createElement("style");
    el.id = "dwEnhancementStyles";
    el.textContent = `
      .advanced-tier-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px;align-items:start}
      .advanced-tier{display:grid;gap:9px;align-content:start;padding:14px;border:1px solid rgba(255,255,255,.08);border-radius:14px;background:rgba(0,0,0,.12)}
      .advanced-tier h3{margin:0;color:var(--accent);font-size:.92rem}.advanced-tier>p{margin:-3px 0 3px;color:var(--muted);font-size:.72rem}
      .advanced-option{display:grid!important;grid-template-columns:22px 1fr;gap:9px!important;align-items:start!important;padding:11px!important}
      .advanced-option input{width:18px!important;height:18px!important;margin:2px 0 0!important;accent-color:var(--accent)}
      .advanced-option strong{display:block;color:var(--text);font-size:.84rem}.advanced-option .advanced-description{display:block;margin-top:4px;color:var(--muted);font-size:.76rem;line-height:1.45;font-weight:500}
      .advanced-option .advanced-meta{display:block;margin-top:5px;color:var(--accent);font-size:.65rem;font-weight:750}.advanced-option.locked{opacity:.55}
      .equipment-row{grid-template-columns:92px 1.05fr 1.8fr 80px 80px 42px!important}.equipment-media{position:relative;width:92px;min-height:92px;border-radius:10px;overflow:hidden;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.04)}
      .equipment-media img{width:100%;height:92px;object-fit:cover;display:block}.equipment-media .media-placeholder{height:92px;display:grid;place-items:center;text-align:center;color:var(--muted);font-size:.68rem;padding:6px}.equipment-media label{position:absolute;inset:auto 5px 5px;display:block;padding:5px;border-radius:7px;background:rgba(0,0,0,.72);text-align:center;color:#fff;font-size:.65rem;cursor:pointer}
      .history-media-tools{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0}.history-gallery{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-bottom:14px}.history-image-card{position:relative;border:1px solid rgba(255,255,255,.09);border-radius:12px;overflow:hidden;background:rgba(0,0,0,.18)}
      .history-image-card img{display:block;width:100%;aspect-ratio:16/10;object-fit:cover}.history-image-card input{border:0;border-top:1px solid rgba(255,255,255,.08);border-radius:0}.history-image-card button{position:absolute;right:7px;top:7px;width:34px;height:34px;border-radius:9px;background:rgba(5,9,15,.84);border:1px solid rgba(255,123,123,.5);color:var(--danger);cursor:pointer}
      @media(max-width:800px){.advanced-tier-grid{grid-template-columns:1fr}.equipment-row{grid-template-columns:76px 1fr 64px 64px 38px!important}.equipment-media{width:76px;min-height:76px;grid-row:span 2}.equipment-media img,.equipment-media .media-placeholder{height:76px}.equipment-row textarea{grid-column:2/-1!important;grid-row:2!important}.history-gallery{grid-template-columns:repeat(2,minmax(0,1fr))}}
      @media(max-width:520px){.history-gallery{grid-template-columns:1fr}}
    `;
    document.head.appendChild(el);
  }

  async function resizeImage(file, max = 1100, quality = .8) {
    if (!file?.type?.startsWith("image/")) throw new Error("Selecione uma imagem.");
    if (file.size > 15 * 1024 * 1024) throw new Error("A imagem precisa ter até 15 MB.");
    const data = await new Promise((resolve, reject) => { const r = new FileReader(); r.onerror = reject; r.onload = () => resolve(r.result); r.readAsDataURL(file); });
    const im = await new Promise((resolve, reject) => { const x = new Image(); x.onload = () => resolve(x); x.onerror = reject; x.src = data; });
    let w=im.width,h=im.height; if(Math.max(w,h)>max){const f=max/Math.max(w,h);w=Math.round(w*f);h=Math.round(h*f);}
    const c=document.createElement("canvas");c.width=w;c.height=h;c.getContext("2d").drawImage(im,0,0,w,h);return c.toDataURL("image/webp",quality);
  }

  function decorateAdvanced() {
    const root = $("advancedMoves");
    if (!root || root.dataset.decorating === "1") return;
    const labels = [...root.children].filter((el) => el.classList?.contains("advanced-option"));
    if (!labels.length) return;
    root.dataset.decorating = "1";
    const classId = $("classSelect")?.value;
    const k = window.DW_CLASSES?.[classId];
    const split = Number.isInteger(k?.advancedSplit) ? k.advancedSplit : labels.length;
    const descriptions = k?.advancedDescriptions || {};
    const hasHigh = labels.length > split;
    const grid = document.createElement("div"); grid.className = hasHigh ? "advanced-tier-grid" : "advanced-tier-grid one-tier";
    const tiers = [
      { title:"Níveis 2–5", hint:"Escolha ao ganhar níveis entre 2 e 5.", items:labels.slice(0,split) },
      { title:"Níveis 6–10", hint:"Escolha ao ganhar níveis entre 6 e 10; também pode escolher opções de 2–5.", items:labels.slice(split) }
    ].filter((x)=>x.items.length);
    tiers.forEach((tier)=>{
      const col=document.createElement("section");col.className="advanced-tier";col.innerHTML=`<h3>${tier.title}</h3><p>${tier.hint}</p>`;
      tier.items.forEach((label)=>{
        const input=label.querySelector("input");const name=input?.value || label.textContent.trim();
        const oldSpan=label.querySelector("span");
        const first=/primeiro avanço/i.test(oldSpan?.textContent||"");
        if(oldSpan) oldSpan.innerHTML=`<strong>${esc(name)}</strong><span class="advanced-description">${esc(descriptions[name] || "Descrição não cadastrada para este movimento.")}</span><span class="advanced-meta">${tier.title}${first?" · apenas no primeiro avanço":""}</span>`;
        col.appendChild(label);
      });
      grid.appendChild(col);
    });
    root.replaceChildren(grid);root.classList.remove("advanced-grid");root.classList.add("advanced-tiers");delete root.dataset.decorating;
  }

  function renderEquipmentMedia() {
    const root=$("equipmentList"); if(!root)return;
    const media=MEDIA();
    [...root.querySelectorAll(".equipment-row")].forEach((row)=>{
      if(row.querySelector(".equipment-media"))return;
      const id=row.dataset.id;if(!id)return;
      const box=document.createElement("div");box.className="equipment-media";
      const src=media.equipment?.[id];
      box.innerHTML=src?`<img src="${src}" alt="Imagem do equipamento"><label>Trocar<input type="file" accept="image/*" hidden></label>`:`<div class="media-placeholder">Sem imagem</div><label>Imagem<input type="file" accept="image/*" hidden></label>`;
      box.querySelector("input").addEventListener("change",async(e)=>{try{const f=e.target.files[0];if(!f)return;const next=MEDIA();next.equipment={...(next.equipment||{}),[id]:await resizeImage(f,700,.82)};saveMedia(next);renderEquipmentMedia();}catch(err){alert(err.message||"Imagem inválida.");}});
      row.prepend(box);
    });
  }

  function setupHistoryMedia() {
    const story=$("story");if(!story||$("historyGallery"))return;
    const tools=document.createElement("div");tools.className="history-media-tools";tools.innerHTML=`<label class="btn secondary file-label">+ Imagem da história<input id="historyImageInput" type="file" accept="image/*" multiple hidden></label>`;
    const gallery=document.createElement("div");gallery.id="historyGallery";gallery.className="history-gallery";
    story.parentElement.insertBefore(tools,story);story.parentElement.insertBefore(gallery,story);
    $("historyImageInput").addEventListener("change",async(e)=>{const files=[...e.target.files];if(!files.length)return;try{const next=MEDIA();next.history=Array.isArray(next.history)?next.history:[];for(const f of files)next.history.push({id:`hist-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,image:await resizeImage(f,1400,.82),caption:""});saveMedia(next);renderHistoryMedia();}catch(err){alert(err.message||"Imagem inválida.");}finally{e.target.value="";}});
    renderHistoryMedia();
  }
  function renderHistoryMedia(){const g=$("historyGallery");if(!g)return;const m=MEDIA();const arr=Array.isArray(m.history)?m.history:[];g.innerHTML=arr.map((x)=>`<div class="history-image-card" data-id="${esc(x.id)}"><img src="${x.image}" alt="Imagem da história"><button type="button" title="Remover imagem">×</button><input value="${esc(x.caption||"")}" placeholder="Legenda / acontecimento"></div>`).join("");g.querySelectorAll(".history-image-card").forEach((card)=>{const id=card.dataset.id;card.querySelector("button").addEventListener("click",()=>{const n=MEDIA();n.history=(n.history||[]).filter(x=>x.id!==id);saveMedia(n);renderHistoryMedia();});card.querySelector("input").addEventListener("input",(e)=>{const n=MEDIA();const x=(n.history||[]).find(x=>x.id===id);if(x)x.caption=e.target.value;saveMedia(n);});});}

  function addGameplayButton(){const actions=document.querySelector(".top-actions");if(!actions||$("gameplayTopBtn"))return;const a=document.createElement("a");a.id="gameplayTopBtn";a.className="btn secondary";a.textContent="Gameplay";const u=new URL(location.href);const q=u.searchParams.get("game");const last=q||localStorage.getItem("dw:last-game-code")||"";a.href=last?`gameplay.html?game=${encodeURIComponent(last)}`:"gameplay.html";actions.insertBefore(a,actions.firstChild);}

  function observe(){const adv=$("advancedMoves"),eq=$("equipmentList");if(adv)new MutationObserver(()=>queueMicrotask(decorateAdvanced)).observe(adv,{childList:true});if(eq)new MutationObserver(()=>queueMicrotask(renderEquipmentMedia)).observe(eq,{childList:true});window.addEventListener("dw-media-changed",()=>{renderEquipmentMedia();renderHistoryMedia();});}

  function init(){style();addGameplayButton();setupHistoryMedia();observe();decorateAdvanced();renderEquipmentMedia();renderHistoryMedia();}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();
