window.DW_CONFIG = Object.freeze({
  version: "1.0.0",
  authUrl: "https://ep-silent-wave-axorgrza.neonauth.c-4.us-east-2.aws.neon.tech/neondb/auth",
  dataApiUrl: "https://ep-silent-wave-axorgrza.apirest.c-4.us-east-2.aws.neon.tech/neondb/rest/v1",
  neonJsUrl: "https://esm.sh/@neondatabase/neon-js@0.6.2-beta?bundle&target=es2022",
  gameplayPollMs: 750,
  gameplayHiddenPollMs: 3000,
  presencePollMs: 5000,
  moveThrottleMs: 280
});

(() => {
  "use strict";

  // Keep config.js executable in the Node validation sandbox used by GitHub Actions.
  if (typeof document === "undefined" || typeof location === "undefined" || typeof localStorage === "undefined") return;

  const here = document.currentScript?.src || location.href;
  const base = new URL(".", here);
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

  // app.js historically assumes that a selected class always exists. Add an internal
  // empty class before classes.js is evaluated so a brand-new sheet can remain unassigned.
  let classRegistry = window.DW_CLASSES;
  try {
    Object.defineProperty(window, "DW_CLASSES", {
      configurable: true,
      enumerable: true,
      get() { return classRegistry; },
      set(value) {
        if (!value || typeof value !== "object") { classRegistry = value; return; }
        const blankClass = {
          name: "Selecione uma classe",
          damage: "0",
          hpBase: 0,
          loadBase: 0,
          heritageLabel: "Raça / Origem",
          alignmentLabel: "Alinhamento / Motivação",
          heritages: [], alignments: [], startingMoves: [], setup: [], advanced: [],
          advancedSplit: 0, equipmentGuide: ""
        };
        classRegistry = { "": blankClass, ...value };
      }
    });
  } catch (_) {}

  const load = (name) => {
    if ([...document.scripts].some((s) => s.src && s.src.endsWith(`/${name}`))) return;
    const script = document.createElement("script");
    script.src = new URL(name, base).href;
    script.defer = true;
    document.head.appendChild(script);
  };
  const loadCss = (name) => {
    if ([...document.querySelectorAll('link[rel="stylesheet"]')].some((l) => l.href && l.href.endsWith(`/${name}`))) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = new URL(name, base).href;
    document.head.appendChild(link);
  };

  if (!localStorage.getItem(STORAGE_KEY)) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(BLANK_STATE));
  }

  function refreshBlankPresentation() {
    const classSelect = document.getElementById("classSelect");
    if (!classSelect || classSelect.value !== "") return;

    const first = classSelect.querySelector('option[value=""]');
    if (first) first.textContent = "— Selecione uma classe —";

    const text = (id, value) => { const el=document.getElementById(id); if(el) el.textContent=value; };
    const value = (id, next) => { const el=document.getElementById(id); if(el) el.value=next; };
    text("heroClass", "—");
    text("heroHeritage", "—");
    text("heroLevel", "Nível 0");
    text("heritageRuleTitle", "—");
    text("heritageRule", "");
    text("alignmentRuleTitle", "—");
    text("alignmentRule", "");
    text("equipmentGuide", "");
    text("moveIntro", "Selecione uma classe para carregar seus movimentos.");
    text("loadRule", "");
    text("loadText", "Carga 0 / 0");
    value("level", 0);
    value("xp", 0);
    value("hpCurrent", 0);
    value("hpMax", 0);
    value("armor", 0);
    value("damage", 0);
    value("loadCurrent", 0);
    document.querySelectorAll("[data-mod]").forEach((el) => { el.textContent = "0"; });
    const meter=document.getElementById("loadMeter"); if(meter) meter.style.width="0%";
    const setup=document.getElementById("setupChoices"); if(setup) setup.innerHTML='<p class="small">Selecione uma classe para carregar as escolhas da classe.</p>';
    const starting=document.getElementById("startingMoves"); if(starting) starting.innerHTML="";
    const advanced=document.getElementById("advancedMoves"); if(advanced) advanced.innerHTML="";
  }

  function installBlankReset() {
    const btn = document.getElementById("resetSheetBtn");
    if (!btn || btn.dataset.blankResetInstalled === "1") return;
    btn.dataset.blankResetInstalled = "1";
    btn.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
      if (!confirm("Criar uma nova ficha totalmente em branco? Isso apaga os dados locais da ficha atual.")) return;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(BLANK_STATE));
      localStorage.removeItem(MEDIA_KEY);
      try { window.DW_MEDIA?.set?.({ equipment:{}, history:[] }); } catch (_) {}
      const clean = new URL(location.href);
      clean.search = "";
      clean.hash = "";
      location.replace(clean.href);
    }, true);
  }

  loadCss("image-actions.css");
  const isGameplay = /(?:^|\/)gameplay\.html$/i.test(location.pathname);
  if (isGameplay) {
    load("gameplay-enhancements.js");
  } else {
    load("sheet-media-refresh.js");
    load("sheet-enhancements.js");
    load("gameplay-tab.js");
    load("gameplay-status.js");
    document.addEventListener("DOMContentLoaded", () => {
      installBlankReset();
      requestAnimationFrame(refreshBlankPresentation);
      const classSelect=document.getElementById("classSelect");
      classSelect?.addEventListener("change", () => setTimeout(refreshBlankPresentation, 0));
    }, { once:true });
  }
})();
