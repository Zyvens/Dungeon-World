(() => {
  "use strict";

  const STORAGE_KEY = "dungeon-world:white-label:v2";
  const MEDIA_KEY = "dungeon-world:white-label:media:v1";

  const BLANK_STATE = {
    version: 3,
    identity: { name: "", tagline: "", appearance: "", classId: "", heritageId: "", alignmentId: "" },
    stats: { strength: 0, dexterity: 0, constitution: 0, intelligence: 0, wisdom: 0, charisma: 0 },
    debilities: { strength:false, dexterity:false, constitution:false, intelligence:false, wisdom:false, charisma:false },
    status: { level: 0, xp: 0, hpCurrent: 0, armor: 0 },
    setup: {}, advancedMoves: [], advancedNotes: "",
    bonds: ["", "", "", ""],
    equipment: [], story: "", people: [], notesHtml: "",
    images: { portrait: null },
    theme: { campaignName:"Dungeon World", primary:"#0b1420", accent:"#8bc7ee", panel:"#101b29", text:"#e7edf5", fontScale:1, panelOpacity:.9, shade:.52, backgroundImage:null }
  };

  function injectStyles() {
    if (document.getElementById("blankResetStyles")) return;
    const style = document.createElement("style");
    style.id = "blankResetStyles";
    style.textContent = `
      .blank-reset-modal{position:fixed;inset:0;z-index:1400;display:grid;place-items:center;padding:18px;background:rgba(2,7,12,.74);backdrop-filter:blur(8px)}
      .blank-reset-modal.hidden{display:none!important}
      .blank-reset-card{width:min(520px,100%);padding:24px;border-radius:18px;border:1px solid color-mix(in srgb,var(--danger) 35%,rgba(255,255,255,.1));background:color-mix(in srgb,var(--panel) 96%,#05090f);box-shadow:0 28px 90px rgba(0,0,0,.58)}
      .blank-reset-card h2{margin:4px 0 10px}.blank-reset-card p{color:var(--muted);line-height:1.55}.blank-reset-card .button-row{margin-top:18px}
    `;
    document.head.appendChild(style);
  }

  function ensureModal() {
    let modal = document.getElementById("blankResetModal");
    if (modal) return modal;
    modal = document.createElement("div");
    modal.id = "blankResetModal";
    modal.className = "blank-reset-modal hidden";
    modal.innerHTML = `
      <div class="blank-reset-card" role="dialog" aria-modal="true" aria-labelledby="blankResetTitle">
        <p class="eyebrow">Nova ficha genérica</p>
        <h2 id="blankResetTitle">Zerar completamente esta ficha?</h2>
        <p>Isso remove classe, raça/origem, alinhamento, atributos, nível, PV, armadura, dano, carga, movimentos, equipamentos, imagens, história, personagens e anotações locais. A nova ficha abrirá sem nenhuma definição pré-selecionada.</p>
        <div class="button-row">
          <button id="blankResetConfirm" class="btn danger" type="button">Sim, criar ficha zerada</button>
          <button id="blankResetCancel" class="btn secondary" type="button">Cancelar</button>
        </div>
      </div>`;
    document.body.appendChild(modal);
    const close = () => modal.classList.add("hidden");
    document.getElementById("blankResetCancel").addEventListener("click", close);
    modal.addEventListener("click", (e) => { if (e.target === modal) close(); });
    document.getElementById("blankResetConfirm").addEventListener("click", () => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(BLANK_STATE));
        localStorage.removeItem(MEDIA_KEY);
        localStorage.removeItem("dw:last-game-code");
        try { window.DW_MEDIA?.set?.({ equipment:{}, history:[] }); } catch (_) {}
        const clean = new URL(location.href);
        clean.search = "";
        clean.hash = "";
        location.replace(clean.href);
      } catch (err) {
        console.error("Falha ao zerar ficha", err);
        alert("Não foi possível zerar a ficha neste dispositivo.");
      }
    });
    return modal;
  }

  function install() {
    injectStyles();
    const modal = ensureModal();
    const btn = document.getElementById("resetSheetBtn");
    if (!btn || btn.dataset.blankResetV2 === "1") return;
    btn.dataset.blankResetV2 = "1";
    btn.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
      modal.classList.remove("hidden");
    }, true);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", install, { once:true });
  else install();
})();
