(() => {
  "use strict";

  const STORAGE_KEY = "dungeon-world:white-label:v2";
  const MEDIA_KEY = "dungeon-world:white-label:media:v1";
  const RESET_FLAG = "dw:blank-reset-pending";

  const BLANK_CORE = {
    identity: { name: "", tagline: "", appearance: "", classId: "", heritageId: "", alignmentId: "" },
    stats: { strength: 0, dexterity: 0, constitution: 0, intelligence: 0, wisdom: 0, charisma: 0 },
    debilities: { strength:false, dexterity:false, constitution:false, intelligence:false, wisdom:false, charisma:false },
    status: { level: 0, xp: 0, hpCurrent: 0, armor: 0 },
    setup: {}, advancedMoves: [], advancedNotes: "", bonds: ["", "", "", ""],
    story: "", images: { portrait: null },
    theme: { campaignName:"Dungeon World", primary:"#0b1420", accent:"#8bc7ee", panel:"#101b29", text:"#e7edf5", fontScale:1, panelOpacity:.9, shade:.52, backgroundImage:null }
  };

  function readState() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch (_) { return {}; }
  }

  function readMedia() {
    try {
      const parsed = JSON.parse(localStorage.getItem(MEDIA_KEY) || "null");
      return parsed && typeof parsed === "object" ? parsed : { equipment:{}, history:[] };
    } catch (_) { return { equipment:{}, history:[] }; }
  }

  function injectStyles() {
    if (document.getElementById("blankResetStyles")) return;
    const style = document.createElement("style");
    style.id = "blankResetStyles";
    style.textContent = `
      .blank-reset-modal{position:fixed;inset:0;z-index:1400;display:grid;place-items:center;padding:18px;background:rgba(2,7,12,.76);backdrop-filter:blur(9px)}
      .blank-reset-modal.hidden{display:none!important}
      .blank-reset-card{width:min(620px,100%);padding:24px;border-radius:18px;border:1px solid color-mix(in srgb,var(--danger) 34%,rgba(255,255,255,.1));background:color-mix(in srgb,var(--panel) 97%,#05090f);box-shadow:0 28px 90px rgba(0,0,0,.6)}
      .blank-reset-card h2{margin:4px 0 8px}.blank-reset-card>p{color:var(--muted);line-height:1.55}.blank-reset-options{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin:18px 0}
      .blank-reset-option{display:flex;align-items:flex-start;gap:10px;padding:13px;border:1px solid rgba(255,255,255,.09);border-radius:12px;background:rgba(0,0,0,.16);cursor:pointer}
      .blank-reset-option:hover{border-color:color-mix(in srgb,var(--accent) 45%,transparent);background:color-mix(in srgb,var(--panel) 84%,var(--accent) 8%)}
      .blank-reset-option input{width:18px;height:18px;flex:0 0 18px;margin:2px 0 0;accent-color:var(--danger)}
      .blank-reset-option strong{display:block;color:var(--text);font-size:.86rem}.blank-reset-option span{display:block;margin-top:3px;color:var(--muted);font-size:.73rem;line-height:1.4}
      .blank-reset-summary{min-height:22px;color:var(--danger);font-size:.78rem;font-weight:700}.blank-reset-card .button-row{margin-top:14px}
      @media(max-width:600px){.blank-reset-options{grid-template-columns:1fr}}
    `;
    document.head.appendChild(style);
  }

  function selected() {
    return [...document.querySelectorAll('#blankResetModal input[data-reset-part]:checked')].map((el) => el.dataset.resetPart);
  }

  function updateSummary() {
    const parts = selected();
    const names = { core:"ficha", equipment:"equipamentos", people:"personagens", notes:"anotações" };
    const el = document.getElementById("blankResetSummary");
    const btn = document.getElementById("blankResetConfirm");
    if (!el || !btn) return;
    btn.disabled = parts.length === 0;
    el.textContent = parts.length ? `Será excluído: ${parts.map((p)=>names[p]).join(", ")}.` : "Selecione pelo menos um item para excluir.";
  }

  function applyReset(parts) {
    const current = readState();
    const next = { version: 3, ...current };
    const media = readMedia();

    if (parts.includes("core")) Object.assign(next, JSON.parse(JSON.stringify(BLANK_CORE)));
    if (parts.includes("equipment")) {
      next.equipment = [];
      media.equipment = {};
    }
    if (parts.includes("people")) next.people = [];
    if (parts.includes("notes")) next.notesHtml = "";
    if (parts.includes("core")) media.history = [];

    // Guarantee all full-reset sections exist even if the previous object was incomplete.
    if (parts.includes("core")) {
      next.equipment = parts.includes("equipment") ? [] : (Array.isArray(current.equipment) ? current.equipment : []);
      next.people = parts.includes("people") ? [] : (Array.isArray(current.people) ? current.people : []);
      next.notesHtml = parts.includes("notes") ? "" : String(current.notesHtml || "");
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    localStorage.setItem(MEDIA_KEY, JSON.stringify({
      equipment: media.equipment && typeof media.equipment === "object" ? media.equipment : {},
      history: Array.isArray(media.history) ? media.history : []
    }));
    try { window.DW_MEDIA?.set?.({ equipment:media.equipment || {}, history:media.history || [] }); } catch (_) {}

    sessionStorage.setItem(RESET_FLAG, JSON.stringify({ parts, state: next, media }));
    const clean = new URL(location.href);
    clean.search = "";
    clean.hash = "";
    location.replace(clean.href);
  }

  function ensureModal() {
    let modal = document.getElementById("blankResetModal");
    if (modal) return modal;
    modal = document.createElement("div");
    modal.id = "blankResetModal";
    modal.className = "blank-reset-modal hidden";
    modal.innerHTML = `
      <div class="blank-reset-card" role="dialog" aria-modal="true" aria-labelledby="blankResetTitle">
        <p class="eyebrow">Excluir dados da ficha</p>
        <h2 id="blankResetTitle">O que você deseja zerar?</h2>
        <p>Escolha exatamente quais grupos serão apagados. Todos vêm selecionados por padrão para criar uma ficha totalmente nova.</p>
        <div class="blank-reset-options">
          <label class="blank-reset-option"><input type="checkbox" data-reset-part="core" checked><span><strong>Ficha</strong><span>Classe, raça/origem, alinhamento, atributos, nível, PV, armadura, dano, carga, movimentos, vínculos, história, retrato e tema.</span></span></label>
          <label class="blank-reset-option"><input type="checkbox" data-reset-part="equipment" checked><span><strong>Equipamentos</strong><span>Remove todos os itens e também as imagens associadas aos equipamentos.</span></span></label>
          <label class="blank-reset-option"><input type="checkbox" data-reset-part="people" checked><span><strong>Personagens</strong><span>Remove todos os NPCs, aliados, rivais, descrições e imagens da seção Personagens.</span></span></label>
          <label class="blank-reset-option"><input type="checkbox" data-reset-part="notes" checked><span><strong>Anotações</strong><span>Apaga integralmente o conteúdo do editor de anotações.</span></span></label>
        </div>
        <div id="blankResetSummary" class="blank-reset-summary"></div>
        <div class="button-row">
          <button id="blankResetConfirm" class="btn danger" type="button">Confirmar exclusão</button>
          <button id="blankResetCancel" class="btn secondary" type="button">Cancelar</button>
        </div>
      </div>`;
    document.body.appendChild(modal);
    const close = () => modal.classList.add("hidden");
    document.getElementById("blankResetCancel").addEventListener("click", close);
    modal.addEventListener("click", (e) => { if (e.target === modal) close(); });
    modal.querySelectorAll("input[data-reset-part]").forEach((el) => el.addEventListener("change", updateSummary));
    document.getElementById("blankResetConfirm").addEventListener("click", () => {
      const parts = selected();
      if (!parts.length) return;
      try { applyReset(parts); }
      catch (err) {
        console.error("Falha ao excluir dados da ficha", err);
        alert("Não foi possível excluir os dados selecionados neste dispositivo.");
      }
    });
    updateSummary();
    return modal;
  }

  function install() {
    injectStyles();
    const modal = ensureModal();
    const btn = document.getElementById("resetSheetBtn");
    if (!btn || btn.dataset.blankResetV3 === "1") return;
    btn.dataset.blankResetV3 = "1";
    btn.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
      modal.querySelectorAll("input[data-reset-part]").forEach((el) => { el.checked = true; });
      updateSummary();
      modal.classList.remove("hidden");
    }, true);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", install, { once:true });
  else install();
})();
