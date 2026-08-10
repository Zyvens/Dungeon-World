(() => {
  "use strict";

  const CLASSES = window.DW_CLASSES || {};
  const APP_VERSION = window.DW_CONFIG?.version || "1.0.0";
  const STORAGE_KEY = "dungeon-world:white-label:v2";
  const $ = (id) => document.getElementById(id);
  const clone = (v) => typeof structuredClone === "function" ? structuredClone(v) : JSON.parse(JSON.stringify(v));
  const uid = (prefix = "id") => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
  const PLACEHOLDER = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 750"><defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop stop-color="#16283b"/><stop offset="1" stop-color="#07111b"/></linearGradient></defs><rect width="600" height="750" fill="url(#g)"/><circle cx="300" cy="260" r="105" fill="#8bc7ee" opacity=".22"/><path d="M105 690c22-176 103-273 195-273s173 97 195 273" fill="#8bc7ee" opacity=".18"/><text x="300" y="365" text-anchor="middle" fill="#b8ddf4" font-family="sans-serif" font-size="34" font-weight="700">SEU PERSONAGEM</text></svg>`)}`;

  const DEFAULT_STATE = {
    version: 3,
    identity: { name: "Nome do personagem", tagline: "", appearance: "", classId: "guerreiro", heritageId: "humano", alignmentId: "bom" },
    stats: { strength: 16, dexterity: 12, constitution: 13, intelligence: 8, wisdom: 12, charisma: 10 },
    debilities: { strength:false, dexterity:false, constitution:false, intelligence:false, wisdom:false, charisma:false },
    status: { level: 1, xp: 0, hpCurrent: 23, armor: 0 },
    setup: {}, advancedMoves: [], advancedNotes: "",
    bonds: ["", "", "", ""],
    equipment: [], story: "", people: [], notesHtml: "",
    images: { portrait: null },
    theme: { campaignName:"Dungeon World", primary:"#0b1420", accent:"#8bc7ee", panel:"#101b29", text:"#e7edf5", fontScale:1, panelOpacity:.9, shade:.52, backgroundImage:null }
  };

  let state = clone(DEFAULT_STATE);
  let sheetId = null;
  let editToken = null;
  let saveTimer = null;
  let cloudTimer = null;
  let toastTimer = null;
  let loading = true;

  const statMeta = [
    ["strength","Força","FOR","Fraco"], ["dexterity","Destreza","DES","Trêmulo"], ["constitution","Constituição","CON","Doente"],
    ["intelligence","Inteligência","INT","Atordoado"], ["wisdom","Sabedoria","SAB","Confuso"], ["charisma","Carisma","CAR","Marcado"]
  ];

  function klassFor(s){ return CLASSES[s?.identity?.classId] || CLASSES.guerreiro || Object.values(CLASSES)[0]; }
  function klass(){ return klassFor(state); }
  function modifier(score){ const n=Number(score); if(!Number.isFinite(n))return 0;if(n<=3)return-3;if(n<=5)return-2;if(n<=8)return-1;if(n<=12)return 0;if(n<=15)return 1;if(n<=17)return 2;return 3; }
  function fmtMod(n){ return n>=0?`+${n}`:`−${Math.abs(n)}`; }
  function hpMaxFor(s){ return (klassFor(s)?.hpBase || 0) + (Number(s?.stats?.constitution)||0); }
  function hpMax(){ return hpMaxFor(state); }
  function loadMaxFor(s){ return (klassFor(s)?.loadBase || 0) + modifier(s?.stats?.strength); }
  function loadMax(){ return loadMaxFor(state); }
  function equipmentLoad(){ return state.equipment.reduce((sum,item)=>sum+Math.max(0,Number(item.weight)||0)*Math.max(0,Number(item.quantity)||0),0); }
  function esc(s){ return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m])); }
  function clamp(n,min,max,fallback){ const v=Number(n);return Number.isFinite(v)?Math.min(max,Math.max(min,v)):fallback; }
  function validColor(value,fallback){ return /^#[0-9a-f]{6}$/i.test(String(value||""))?String(value):fallback; }

  function sanitizeNotesHtml(raw){
    const template=document.createElement("template");
    template.innerHTML=String(raw||"");
    const allowed=new Set(["B","STRONG","I","EM","U","P","DIV","BR","BLOCKQUOTE","SPAN","FONT"]);
    const dangerous=new Set(["SCRIPT","STYLE","IFRAME","OBJECT","EMBED","LINK","META","SVG","MATH","FORM","INPUT","BUTTON"]);
    const walker=document.createTreeWalker(template.content,NodeFilter.SHOW_ELEMENT);
    const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
    nodes.forEach((el)=>{
      if(!allowed.has(el.tagName)){
        if(dangerous.has(el.tagName)){el.remove();return;}
        el.replaceWith(...el.childNodes);return;
      }
      [...el.attributes].forEach((attr)=>el.removeAttribute(attr.name));
      if(el.tagName==="SPAN" && /(^|\s)spoiler(\s|$)/.test(el.className||""))el.className="spoiler";
    });
    // Re-apply the only formatting attributes that execCommand can legitimately emit.
    const probe=document.createElement("template");probe.innerHTML=String(raw||"");
    const sourceFonts=[...probe.content.querySelectorAll("font")];
    const targetFonts=[...template.content.querySelectorAll("font")];
    targetFonts.forEach((el,i)=>{
      const src=sourceFonts[i];if(!src)return;
      const color=src.getAttribute("color");const size=src.getAttribute("size");
      if(color && /^(#[0-9a-f]{3,8}|rgb\([^)]{1,40}\)|[a-z]{1,20})$/i.test(color))el.setAttribute("color",color);
      if(size && /^[1-7]$/.test(size))el.setAttribute("size",size);
    });
    return template.innerHTML;
  }

  function toast(msg,bad=false){ const t=$("toast");if(!t)return;t.textContent=msg;t.style.borderColor=bad?"rgba(255,123,123,.45)":"rgba(113,212,156,.35)";t.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove("show"),2600); }

  function normalize(incoming){
    const s=clone(DEFAULT_STATE);if(!incoming||typeof incoming!=="object")return s;
    s.version=3;s.identity={...s.identity,...(incoming.identity||{})};s.stats={...s.stats,...(incoming.stats||{})};s.debilities={...s.debilities,...(incoming.debilities||{})};s.status={...s.status,...(incoming.status||{})};
    s.setup=incoming.setup&&typeof incoming.setup==="object"?incoming.setup:{};s.advancedMoves=Array.isArray(incoming.advancedMoves)?incoming.advancedMoves.filter(x=>typeof x==="string"):[];s.advancedNotes=String(incoming.advancedNotes||"");
    s.bonds=Array.isArray(incoming.bonds)?incoming.bonds.map(x=>String(x??"")):["","","",""];
    s.equipment=Array.isArray(incoming.equipment)?incoming.equipment.map((item)=>({id:String(item?.id||uid("item")),name:String(item?.name||""),description:String(item?.description||""),weight:Math.max(0,Number(item?.weight)||0),quantity:Math.max(0,Math.floor(Number(item?.quantity)||0))})):[];
    s.story=String(incoming.story||"");
    s.people=Array.isArray(incoming.people)?incoming.people.map((p)=>({id:String(p?.id||uid("person")),name:String(p?.name||""),role:String(p?.role||""),description:String(p?.description||""),image:typeof p?.image==="string"?p.image:null})):[];
    s.notesHtml=sanitizeNotesHtml(incoming.notesHtml||"");s.images={...s.images,...(incoming.images||{})};s.theme={...s.theme,...(incoming.theme||{})};
    if(!CLASSES[s.identity.classId])s.identity.classId="guerreiro";const k=klassFor(s);
    if(!k.heritages?.some(x=>x.id===s.identity.heritageId))s.identity.heritageId=k.heritages?.[0]?.id||"";
    if(!k.alignments?.some(x=>x.id===s.identity.alignmentId))s.identity.alignmentId=k.alignments?.[0]?.id||"";
    s.status.level=Math.min(10,Math.max(1,Number(s.status.level)||1));s.status.xp=Math.max(0,Math.floor(Number(s.status.xp)||0));s.status.armor=Math.max(0,Number(s.status.armor)||0);
    const hp=Number(s.status.hpCurrent);s.status.hpCurrent=Number.isFinite(hp)?Math.max(0,hp):hpMaxFor(s);
    s.theme.primary=validColor(s.theme.primary,DEFAULT_STATE.theme.primary);s.theme.accent=validColor(s.theme.accent,DEFAULT_STATE.theme.accent);s.theme.panel=validColor(s.theme.panel,DEFAULT_STATE.theme.panel);s.theme.text=validColor(s.theme.text,DEFAULT_STATE.theme.text);
    s.theme.fontScale=clamp(s.theme.fontScale,.85,1.25,1);s.theme.panelOpacity=clamp(s.theme.panelOpacity,.55,1,.9);s.theme.shade=clamp(s.theme.shade,0,.85,.52);s.theme.campaignName=String(s.theme.campaignName||"Dungeon World").slice(0,120);
    return s;
  }

  function localSave(){ try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}catch(e){toast("O armazenamento local está cheio. Exporte um backup.",true);} }
  function schedulePersist(){ if(loading)return;clearTimeout(saveTimer);saveTimer=setTimeout(localSave,160);if(sheetId&&editToken){clearTimeout(cloudTimer);cloudTimer=setTimeout(()=>saveCloud(false),1100);} }

  function applyTheme(){ const t=state.theme,root=document.documentElement;root.style.setProperty("--primary",t.primary);root.style.setProperty("--accent",t.accent);root.style.setProperty("--panel",t.panel);root.style.setProperty("--text",t.text);root.style.setProperty("--font-scale",t.fontScale);root.style.setProperty("--panel-opacity",t.panelOpacity);root.style.setProperty("--shade",t.shade);$("backgroundLayer").style.backgroundImage=t.backgroundImage?`url(${JSON.stringify(t.backgroundImage)})`:"radial-gradient(circle at 75% 15%, color-mix(in srgb, var(--accent) 20%, transparent), transparent 36%),linear-gradient(145deg,var(--primary),#05090f)";$("campaignBrand").textContent=t.campaignName||"Dungeon World";$("heroCampaign").textContent=t.campaignName||"Dungeon World";$("campaignName").value=t.campaignName;$("primaryColor").value=t.primary;$("accentColor").value=t.accent;$("panelColor").value=t.panel;$("textColor").value=t.text;$("fontScale").value=t.fontScale;$("panelOpacity").value=t.panelOpacity;$("backgroundShade").value=t.shade; }

  function renderClassSelectors(){ const sel=$("classSelect");sel.innerHTML=Object.entries(CLASSES).map(([id,k])=>`<option value="${id}">${esc(k.name)}</option>`).join("");sel.value=state.identity.classId;const k=klass();$("heritageLabel").textContent=k.heritageLabel||"Raça";$("alignmentLabel").textContent=k.alignmentLabel||"Alinhamento";const hs=$("heritageSelect");hs.innerHTML=(k.heritages||[]).map(h=>`<option value="${h.id}">${esc(h.name)}</option>`).join("");hs.value=state.identity.heritageId;$("heritageLabelWrap").classList.toggle("hidden",!(k.heritages||[]).length);const as=$("alignmentSelect");as.innerHTML=(k.alignments||[]).map(a=>`<option value="${a.id}">${esc(a.name)}</option>`).join("");as.value=state.identity.alignmentId; }
  function renderIdentityRules(){ const k=klass(),h=(k.heritages||[]).find(x=>x.id===state.identity.heritageId),a=(k.alignments||[]).find(x=>x.id===state.identity.alignmentId);$("heritageRuleTitle").textContent=h?.name||k.heritageLabel||"Origem";$("heritageRule").textContent=h?.description||"";$("alignmentRuleTitle").textContent=`${k.alignmentLabel||"Alinhamento"}: ${a?.name||"—"}`;$("alignmentRule").textContent=a?.description||"";$("heroClass").textContent=k.name;$("heroHeritage").textContent=h?.name||"—";$("heroLevel").textContent=`Nível ${state.status.level}`; }

  function renderStats(){ const grid=$("statsGrid");grid.innerHTML=statMeta.map(([key,label,abbr,deb])=>`<div class="stat-card"><label>${label}</label><div class="stat-main"><input type="number" data-stat="${key}" value="${Number(state.stats[key])||0}"/><span class="modifier" data-mod="${key}">${fmtMod(modifier(state.stats[key]))}</span></div><label class="debility"><input type="checkbox" data-debility="${key}" ${state.debilities[key]?"checked":""}/> ${deb} −1</label><small>${abbr}</small></div>`).join("");grid.querySelectorAll("[data-stat]").forEach(el=>el.addEventListener("input",()=>{state.stats[el.dataset.stat]=Number(el.value)||0;grid.querySelector(`[data-mod="${el.dataset.stat}"]`).textContent=fmtMod(modifier(state.stats[el.dataset.stat]));syncCalculated();schedulePersist();}));grid.querySelectorAll("[data-debility]").forEach(el=>el.addEventListener("change",()=>{state.debilities[el.dataset.debility]=el.checked;schedulePersist();})); }
  function ensureSetupDefaults(){ const k=klass();state.setup[state.identity.classId]||={};const bag=state.setup[state.identity.classId];(k.setup||[]).forEach(item=>{if(bag[item.key]===undefined)bag[item.key]=item.type==="multi"?[]:(item.options?.[0]||"");}); }
  function renderSetup(){ ensureSetupDefaults();const k=klass(),bag=state.setup[state.identity.classId],wrap=$("setupChoices");if(!(k.setup||[]).length){wrap.innerHTML='<p class="small">Esta classe não exige escolhas adicionais estruturadas nesta seção. Use Movimentos, Vínculos e Equipamento para completar a ficha.</p>';return;}wrap.innerHTML="";k.setup.forEach(item=>{const box=document.createElement("div");box.className="choice-box";box.innerHTML=`<strong>${esc(item.label)}</strong>`;if(item.type==="select"){const s=document.createElement("select");s.innerHTML=item.options.map(o=>`<option>${esc(o)}</option>`).join("");s.value=bag[item.key]||item.options[0];s.addEventListener("change",()=>{bag[item.key]=s.value;schedulePersist();});box.appendChild(s);}else if(item.type==="multi"){const m=document.createElement("div");m.className="multi-options";m.innerHTML=item.options.map(o=>`<label><input type="checkbox" value="${esc(o)}" ${(bag[item.key]||[]).includes(o)?"checked":""}/> <span>${esc(o)}</span></label>`).join("");m.addEventListener("change",e=>{const checked=[...m.querySelectorAll("input:checked")];if(item.max&&checked.length>item.max){e.target.checked=false;toast(`Escolha no máximo ${item.max} opções.`,true);return;}bag[item.key]=[...m.querySelectorAll("input:checked")].map(x=>x.value);schedulePersist();});box.appendChild(m);}else{const input=document.createElement("input");input.placeholder=item.placeholder||"";input.value=bag[item.key]||"";input.addEventListener("input",()=>{bag[item.key]=input.value;schedulePersist();});box.appendChild(input);}wrap.appendChild(box);}); }
  function renderMoves(){ const k=klass();$("startingMoves").innerHTML=(k.startingMoves||[]).map(m=>`<div class="move-card"><h3>${esc(m.name)}</h3><p>${esc(m.description)}</p></div>`).join("");const adv=$("advancedMoves");adv.innerHTML=(k.advanced||[]).map(name=>`<label class="advanced-option"><input type="checkbox" value="${esc(name)}" ${state.advancedMoves.includes(name)?"checked":""}/><span>${esc(name)}</span></label>`).join("");adv.querySelectorAll("input").forEach(i=>i.addEventListener("change",()=>{state.advancedMoves=[...adv.querySelectorAll("input:checked")].map(x=>x.value);schedulePersist();}));$("advancedNotes").value=state.advancedNotes;$("equipmentGuide").textContent=k.equipmentGuide||""; }
  function renderBonds(){ const w=$("bondsList");w.innerHTML=state.bonds.map((b,i)=>`<div class="bond-row"><input data-bond="${i}" value="${esc(b)}" placeholder="Vínculo com um companheiro"/><button type="button" class="icon-btn danger" data-remove-bond="${i}">×</button></div>`).join("");w.querySelectorAll("[data-bond]").forEach(el=>el.addEventListener("input",()=>{state.bonds[Number(el.dataset.bond)]=el.value;schedulePersist();}));w.querySelectorAll("[data-remove-bond]").forEach(el=>el.addEventListener("click",()=>{state.bonds.splice(Number(el.dataset.removeBond),1);renderBonds();schedulePersist();})); }
  function renderEquipment(){ const w=$("equipmentList");w.innerHTML="";state.equipment.forEach(item=>{const node=$("equipmentTemplate").content.firstElementChild.cloneNode(true);node.dataset.id=item.id;node.querySelector('[data-k="name"]').value=item.name||"";node.querySelector('[data-k="description"]').value=item.description||"";node.querySelector('[data-k="weight"]').value=Number(item.weight)||0;node.querySelector('[data-k="quantity"]').value=Number(item.quantity)||0;node.querySelectorAll("[data-k]").forEach(el=>el.addEventListener("input",()=>{const key=el.dataset.k;item[key]=(key==="weight"||key==="quantity")?Math.max(0,Number(el.value)||0):el.value;if(key==="quantity")item[key]=Math.floor(item[key]);syncCalculated();schedulePersist();}));node.querySelector('[data-action="remove"]').addEventListener("click",()=>{state.equipment=state.equipment.filter(x=>x.id!==item.id);renderEquipment();schedulePersist();});w.appendChild(node);});syncCalculated(); }
  function renderPeople(){ const w=$("peopleList");w.innerHTML="";state.people.forEach(person=>{const node=$("personTemplate").content.firstElementChild.cloneNode(true);node.dataset.id=person.id;const img=node.querySelector("img");img.src=person.image||PLACEHOLDER;["name","role","description"].forEach(key=>{const el=node.querySelector(`[data-k="${key}"]`);el.value=person[key]||"";el.addEventListener("input",()=>{person[key]=el.value;schedulePersist();});});node.querySelector('[data-k="imageInput"]').addEventListener("change",async e=>{const f=e.target.files[0];if(!f)return;try{person.image=await resizeImage(f,700,.82);img.src=person.image;schedulePersist();}catch(err){toast(err.message||"Imagem inválida.",true);}});node.querySelector('[data-action="remove"]').addEventListener("click",()=>{state.people=state.people.filter(x=>x.id!==person.id);renderPeople();schedulePersist();});w.appendChild(node);}); }

  function syncCalculated(){ const max=hpMax(),load=equipmentLoad(),cap=loadMax();$("hpMax").value=max;$("damage").value=klass()?.damage||"—";$("loadCurrent").value=load;$("loadRule").textContent=`máx. ${klass()?.loadBase||0}+FOR = ${cap}`;$("loadText").textContent=load>cap?`Carga ${load} / ${cap} · ACIMA DO LIMITE`:`Carga ${load} / ${cap}`;const pct=cap>0?Math.min(100,(load/cap)*100):0;$("loadMeter").style.width=`${pct}%`;$("loadMeter").classList.toggle("over",load>cap); }
  function renderAll(){ state=normalize(state);applyTheme();renderClassSelectors();renderIdentityRules();renderStats();renderSetup();renderMoves();renderBonds();renderEquipment();renderPeople();$("characterName").value=state.identity.name;$("tagline").value=state.identity.tagline;$("appearance").value=state.identity.appearance;$("level").value=state.status.level;$("xp").value=state.status.xp;$("hpCurrent").value=state.status.hpCurrent;$("armor").value=state.status.armor;$("story").value=state.story;$("advancedNotes").value=state.advancedNotes;$("notesEditor").innerHTML=state.notesHtml||"";$("portraitImg").src=state.images.portrait||PLACEHOLDER;syncCalculated();document.title=`${state.identity.name||"Personagem"} — Dungeon World`;updateCloudUI(); }
  function onClassChange(id){ state.identity.classId=id;const k=klass();state.identity.heritageId=k.heritages?.[0]?.id||"";state.identity.alignmentId=k.alignments?.[0]?.id||"";state.advancedMoves=[];ensureSetupDefaults();state.status.hpCurrent=hpMax();renderClassSelectors();renderIdentityRules();renderSetup();renderMoves();syncCalculated();schedulePersist(); }

  function bindStatic(){
    document.querySelectorAll(".tab-btn").forEach(b=>b.addEventListener("click",()=>{document.querySelectorAll(".tab-btn").forEach(x=>x.classList.remove("active"));document.querySelectorAll(".tab-panel").forEach(x=>x.classList.remove("active"));b.classList.add("active");$("tab-"+b.dataset.tab).classList.add("active");scrollTo({top:0,behavior:"smooth"});}));
    $("classSelect").addEventListener("change",e=>onClassChange(e.target.value));$("heritageSelect").addEventListener("change",e=>{state.identity.heritageId=e.target.value;renderIdentityRules();schedulePersist();});$("alignmentSelect").addEventListener("change",e=>{state.identity.alignmentId=e.target.value;renderIdentityRules();schedulePersist();});
    $("characterName").addEventListener("input",e=>{state.identity.name=e.target.value;document.title=`${e.target.value||"Personagem"} — Dungeon World`;schedulePersist();});$("tagline").addEventListener("input",e=>{state.identity.tagline=e.target.value;schedulePersist();});$("appearance").addEventListener("input",e=>{state.identity.appearance=e.target.value;schedulePersist();});
    $("level").addEventListener("input",e=>{state.status.level=Math.min(10,Math.max(1,Number(e.target.value)||1));renderIdentityRules();schedulePersist();});$("xp").addEventListener("input",e=>{state.status.xp=Math.max(0,Number(e.target.value)||0);schedulePersist();});$("hpCurrent").addEventListener("input",e=>{const v=Number(e.target.value);state.status.hpCurrent=Number.isFinite(v)?Math.max(0,v):0;schedulePersist();});$("armor").addEventListener("input",e=>{state.status.armor=Math.max(0,Number(e.target.value)||0);schedulePersist();});
    $("advancedNotes").addEventListener("input",e=>{state.advancedNotes=e.target.value;schedulePersist();});$("story").addEventListener("input",e=>{state.story=e.target.value;schedulePersist();});$("addBondBtn").addEventListener("click",()=>{state.bonds.push("");renderBonds();schedulePersist();});$("addEquipmentBtn").addEventListener("click",()=>{state.equipment.push({id:uid("item"),name:"Novo equipamento",description:"",weight:0,quantity:1});renderEquipment();schedulePersist();});$("addPersonBtn").addEventListener("click",()=>{state.people.push({id:uid("person"),name:"Novo personagem",role:"",description:"",image:null});renderPeople();schedulePersist();});
    $("notesEditor").addEventListener("input",e=>{state.notesHtml=sanitizeNotesHtml(e.currentTarget.innerHTML);schedulePersist();});$("notesEditor").addEventListener("click",e=>{if(e.target.classList.contains("spoiler"))e.target.classList.toggle("revealed");});document.querySelectorAll("[data-cmd]").forEach(b=>b.addEventListener("click",()=>{document.execCommand(b.dataset.cmd,false,b.dataset.value||null);$("notesEditor").focus();state.notesHtml=sanitizeNotesHtml($("notesEditor").innerHTML);schedulePersist();}));$("fontSizeSelect").addEventListener("change",e=>{document.execCommand("fontSize",false,e.target.value);state.notesHtml=sanitizeNotesHtml($("notesEditor").innerHTML);schedulePersist();});$("fontColor").addEventListener("input",e=>{document.execCommand("foreColor",false,e.target.value);state.notesHtml=sanitizeNotesHtml($("notesEditor").innerHTML);schedulePersist();});$("spoilerBtn").addEventListener("click",()=>{const sel=window.getSelection();const text=sel?.toString()||"Conteúdo oculto";document.execCommand("insertHTML",false,`<span class="spoiler">${esc(text)}</span>`);state.notesHtml=sanitizeNotesHtml($("notesEditor").innerHTML);schedulePersist();});
    [["campaignName","campaignName"],["primaryColor","primary"],["accentColor","accent"],["panelColor","panel"],["textColor","text"],["fontScale","fontScale"],["panelOpacity","panelOpacity"],["backgroundShade","shade"]].forEach(([id,key])=>$(id).addEventListener("input",e=>{state.theme[key]=(e.target.type==="range")?Number(e.target.value):e.target.value;applyTheme();schedulePersist();}));$("resetThemeBtn").addEventListener("click",()=>{state.theme=clone(DEFAULT_STATE.theme);applyTheme();schedulePersist();});$("removeBackgroundBtn").addEventListener("click",()=>{state.theme.backgroundImage=null;applyTheme();schedulePersist();});
    $("backgroundInput").addEventListener("change",async e=>{const f=e.target.files[0];if(!f)return;try{state.theme.backgroundImage=await resizeImage(f,1800,.78);applyTheme();schedulePersist();}catch(err){toast(err.message||"Imagem inválida.",true);}});$("portraitInput").addEventListener("change",async e=>{const f=e.target.files[0];if(!f)return;try{state.images.portrait=await resizeImage(f,900,.84);$("portraitImg").src=state.images.portrait;schedulePersist();}catch(err){toast(err.message||"Imagem inválida.",true);}});
    $("exportBtn").addEventListener("click",exportBackup);$("importFile").addEventListener("change",importBackup);$("cloudBtn").addEventListener("click",createCloudSheet);$("saveCloudBtn").addEventListener("click",()=>sheetId&&editToken?saveCloud(true):createCloudSheet());$("copyLinkBtn").addEventListener("click",copyLink);$("resetSheetBtn").addEventListener("click",()=>{if(!confirm("Criar uma nova ficha genérica e substituir os dados locais atuais?"))return;state=clone(DEFAULT_STATE);sheetId=null;editToken=null;history.replaceState({},"",location.pathname);localSave();renderAll();toast("Nova ficha genérica criada.");});
    window.addEventListener("online",()=>{updateCloudUI();if(sheetId&&editToken)saveCloud(false);});window.addEventListener("offline",updateCloudUI);document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="hidden")localSave();});
  }

  function resizeImage(file,max=1600,quality=.82){return new Promise((resolve,reject)=>{if(!file?.type?.startsWith("image/"))return reject(new Error("Selecione um arquivo de imagem."));if(file.size>15*1024*1024)return reject(new Error("A imagem precisa ter até 15 MB."));const r=new FileReader();r.onerror=()=>reject(new Error("Falha ao ler a imagem."));r.onload=()=>{const im=new Image();im.onerror=()=>reject(new Error("Formato de imagem inválido."));im.onload=()=>{let w=im.width,h=im.height;if(!w||!h)return reject(new Error("Imagem vazia."));if(Math.max(w,h)>max){const f=max/Math.max(w,h);w=Math.round(w*f);h=Math.round(h*f);}const c=document.createElement("canvas");c.width=w;c.height=h;c.getContext("2d").drawImage(im,0,0,w,h);resolve(c.toDataURL("image/webp",quality));};im.src=r.result;};r.readAsDataURL(file);});}
  function exportBackup(){const safe=normalize(state);const blob=new Blob([JSON.stringify(safe,null,2)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`dungeon-world-${(safe.identity.name||"personagem").toLowerCase().replace(/[^a-z0-9]+/gi,"-")}-${new Date().toISOString().slice(0,10)}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500);toast("Backup exportado.");}
  async function importBackup(e){const file=e.target.files[0];if(!file)return;try{if(file.size>5*1024*1024)throw new Error("Backup muito grande.");state=normalize(JSON.parse(await file.text()));localSave();renderAll();toast("Backup importado e validado.");}catch(err){toast(err.message||"Arquivo de backup inválido.",true);}finally{e.target.value="";}}

  function cloudParams(){const u=new URL(location.href);return{id:u.searchParams.get("sheet"),key:new URLSearchParams(u.hash.replace(/^#/,"")).get("key")};}
  function updateCloudUI(){const status=$("cloudStatus"),btn=$("cloudBtn"),copy=$("copyLinkBtn"),ident=$("sheetIdentity");if(!navigator.onLine&&sheetId){status.textContent="Nuvem · offline";}else if(sheetId&&editToken){status.textContent="Nuvem · edição";}else if(sheetId){status.textContent="Nuvem · leitura";}else status.textContent="Local";if(sheetId&&editToken){btn.textContent="Criar cópia";copy.classList.remove("hidden");ident.textContent=`Ficha na nuvem: ${sheetId}`;}else if(sheetId){btn.textContent="Duplicar ficha na nuvem";copy.classList.remove("hidden");ident.textContent=`Ficha somente leitura: ${sheetId}. Alterações ficam locais até você criar uma cópia.`;}else{btn.textContent="Criar ficha na nuvem";copy.classList.add("hidden");ident.textContent=`Versão ${APP_VERSION} · ainda não há uma ficha vinculada ao Neon.`;}}
  function setCloudUrl(id,key){const u=new URL(location.href);u.searchParams.set("sheet",id);u.hash=key?`key=${encodeURIComponent(key)}`:"";history.replaceState({},"",u);sheetId=id;editToken=key||null;updateCloudUI();}
  async function createCloudSheet(){try{state=normalize(state);const res=await fetch("/api/sheet",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({title:state.identity.name,state})});if(!res.ok)throw new Error((await res.json().catch(()=>null))?.error||"Falha no Neon");const d=await res.json();setCloudUrl(d.id,d.token);localSave();toast("Ficha criada no Neon. Guarde o link completo de edição.");await copyLink();}catch(e){toast(e.message==="auth_cancelled"?"Login cancelado.":"Não foi possível criar a ficha na nuvem. Entre na conta e verifique sua conexão.",true);}}
  async function saveCloud(manual=true){if(!sheetId||!editToken){if(manual)toast("Esta URL não possui chave de edição.",true);return;}if(!navigator.onLine){$("cloudStatus").textContent="Nuvem · offline";if(manual)toast("Sem conexão. A ficha continua salva neste dispositivo.",true);return;}try{state=normalize(state);const res=await fetch(`/api/sheet?id=${encodeURIComponent(sheetId)}`,{method:"PUT",headers:{"content-type":"application/json","x-edit-token":editToken},body:JSON.stringify({title:state.identity.name,state})});if(!res.ok)throw new Error((await res.json().catch(()=>null))?.error||"Falha no Neon");if(manual)toast("Ficha salva na nuvem.");$("cloudStatus").textContent="Nuvem · salvo";}catch(e){$("cloudStatus").textContent="Nuvem · erro";if(manual)toast("Falha ao salvar no Neon. Seus dados locais foram preservados.",true);}}
  async function loadCloud(id){try{const res=await fetch(`/api/sheet?id=${encodeURIComponent(id)}`,{cache:"no-store"});if(!res.ok)throw new Error("not-found");const d=await res.json();state=normalize(d.state);localSave();return true;}catch(e){toast("Ficha da nuvem não encontrada ou login ausente; carregando dados locais.",true);return false;}}
  async function copyLink(){try{await navigator.clipboard.writeText(location.href);toast("Link copiado.");}catch(e){toast("Copie o endereço completo do navegador.",true);}}

  async function init(){bindStatic();const p=cloudParams();sheetId=p.id;editToken=p.key;const raw=localStorage.getItem(STORAGE_KEY);if(raw){try{state=normalize(JSON.parse(raw));}catch(e){state=clone(DEFAULT_STATE);}}if(sheetId)await loadCloud(sheetId);loading=false;renderAll();localSave();}
  init();
})();
