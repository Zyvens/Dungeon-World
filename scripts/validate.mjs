import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const exists = (file) => fs.existsSync(path.join(root, file));
const fail = (message) => { throw new Error(message); };
const assert = (condition, message) => { if (!condition) fail(message); };

const required = [
  "index.html", "gameplay.html", "styles.css", "gameplay.css", "config.js", "auth.js",
  "data-api.js", "github-pages-adapter.js", "classes.js", "class-rules.js", "app.js",
  "gameplay.js", "sw.js", "manifest.webmanifest", "icon.svg", ".nojekyll",
  ".github/workflows/pages.yml", ".github/workflows/validate.yml"
];
required.forEach((file) => assert(exists(file), `Arquivo obrigatório ausente: ${file}`));

const runtimeFiles = ["index.html","gameplay.html","config.js","auth.js","data-api.js","github-pages-adapter.js","classes.js","class-rules.js","app.js","gameplay.js","sw.js"];
const runtime = Object.fromEntries(runtimeFiles.map((f) => [f, read(f)]));

const forbidden = [
  ["Kael Frostborn", "referência específica ao Kael"],
  ["assets/kael", "asset específico do Kael"],
  ["DATABASE_URL na Vercel", "mensagem legada da Vercel"],
  ["@neondatabase/serverless", "dependência serverless legada"],
  ["dw:auth-session-token", "armazenamento manual de token de sessão"],
  ["better-auth@1.6.25", "cliente Better Auth antigo"],
  ['navigator.serviceWorker.register("/sw.js")', "service worker absoluto incompatível com project Pages"]
];
for (const [needle, description] of forbidden) {
  for (const [file, text] of Object.entries(runtime)) {
    assert(!text.includes(needle), `${file}: encontrado ${description}`);
  }
}

const configSandbox = { window: {} };
vm.runInNewContext(runtime["config.js"], configSandbox, { filename: "config.js" });
const cfg = configSandbox.window.DW_CONFIG;
assert(cfg?.version === "1.0.0", "config.js: versão de produção precisa ser 1.0.0");
assert(/^https:\/\//.test(cfg.authUrl), "config.js: authUrl precisa usar HTTPS");
assert(/^https:\/\//.test(cfg.dataApiUrl), "config.js: dataApiUrl precisa usar HTTPS");
assert(cfg.neonJsUrl.includes("@neondatabase/neon-js@0.6.3-beta"), "config.js: Neon JS precisa estar fixado em 0.6.3-beta");
assert(cfg.gameplayPollMs >= 500 && cfg.gameplayPollMs <= 1500, "config.js: polling visível fora da faixa de produção");
assert(cfg.moveThrottleMs >= 200, "config.js: throttle de movimentos está agressivo demais");

const classSandbox = { window: {} };
vm.runInNewContext(runtime["classes.js"], classSandbox, { filename: "classes.js" });
vm.runInNewContext(runtime["class-rules.js"], classSandbox, { filename: "class-rules.js" });
const classes = classSandbox.window.DW_CLASSES;
const expected = {
  bardo: ["Bardo","d6",6,9,10], barbaro: ["Bárbaro","d8",8,8,12], clerigo: ["Clérigo","d6",8,10,11],
  druida: ["Druida","d6",6,6,10], engenheiro: ["Engenheiro Arcano","d4",4,7,10], guerreiro: ["Guerreiro","d10",10,12,10],
  ladrao: ["Ladrão","d8",6,9,9], mago: ["Mago","d4",4,7,10], paladino: ["Paladino","d10",10,12,10], ranger: ["Ranger","d8",8,11,10]
};
assert(Object.keys(classes || {}).length === 10, `Esperadas 10 classes; encontradas ${Object.keys(classes || {}).length}`);
for (const [id, [name, damage, hpBase, loadBase, split]] of Object.entries(expected)) {
  const k = classes[id];
  assert(k, `Classe ausente: ${id}`);
  assert(k.name === name, `${id}: nome divergente`);
  assert(k.damage === damage, `${id}: dado de dano divergente`);
  assert(k.hpBase === hpBase, `${id}: base de PV divergente`);
  assert(k.loadBase === loadBase, `${id}: base de carga divergente`);
  assert(Array.isArray(k.startingMoves) && k.startingMoves.length > 0, `${id}: sem movimentos iniciais`);
  assert(Array.isArray(k.heritages) && k.heritages.length > 0, `${id}: sem raça/origem/especialização`);
  assert(Array.isArray(k.alignments) && k.alignments.length > 0, `${id}: sem alinhamento/motivação`);
  assert(Array.isArray(k.advanced) && k.advanced.length > split, `${id}: lista avançada incompleta`);
  assert(k.advancedSplit === split, `${id}: corte 2–5/6–10 divergente`);
}
assert(classes.ranger.firstAdvanceOnly?.includes("Meio-Elfo"), "Ranger: Meio-Elfo deve estar marcado como primeiro avanço");

const app = runtime["app.js"];
assert(app.includes("Number.isFinite(hp)?Math.max(0,hp):hpMaxFor(s)"), "app.js: regressão de PV=0 ou cálculo pelo estado incorreto");
assert(app.includes("sanitizeNotesHtml"), "app.js: sanitização de anotações ausente");
assert(app.includes('wasSpoiler=el.tagName==="SPAN"'), "app.js: preservação segura de spoiler ausente");
assert(app.includes("advancedSplit"), "app.js: regras de nível dos movimentos avançados ausentes");
assert(app.includes('await import("./class-rules.js")'), "app.js: metadados de nível não são carregados");

const gameplay = runtime["gameplay.js"];
for (const needle of ["gameplay_move_token","gameplay_positions","gameplay_meta","gameplay_members_online","moveThrottleMs","gameplayHiddenPollMs"]) {
  assert(gameplay.includes(needle), `gameplay.js: sincronização incompleta (${needle})`);
}
assert(gameplay.includes('/^\\d{6,8}$/.test(pin)'), "gameplay.js: novas salas devem exigir PIN de 6–8 dígitos");
assert(runtime["gameplay.html"].includes("6 a 8 números"), "gameplay.html: UX de PIN está divergente da validação");

const manifest = JSON.parse(read("manifest.webmanifest"));
assert(manifest.scope === "./", "manifest: scope precisa ser relativo para GitHub Pages");
assert(String(manifest.start_url).startsWith("./"), "manifest: start_url precisa ser relativo");

const localRefs = new Set();
for (const htmlFile of ["index.html","gameplay.html"]) {
  const html = runtime[htmlFile];
  for (const match of html.matchAll(/(?:src|href)="([^"?#]+)"/g)) {
    const ref = match[1];
    if (/^(?:https?:|data:|#)/.test(ref)) continue;
    localRefs.add(ref.replace(/^\.\//, ""));
  }
}
for (const ref of localRefs) assert(exists(ref), `Referência local quebrada: ${ref}`);

const sw = runtime["sw.js"];
for (const file of ["index.html","gameplay.html","styles.css","gameplay.css","config.js","auth.js","data-api.js","github-pages-adapter.js","classes.js","class-rules.js","app.js","gameplay.js","manifest.webmanifest","icon.svg"]) {
  assert(sw.includes(`"${file}"`), `sw.js: ${file} não está no cache principal`);
}
assert(sw.includes('const BASE = self.registration.scope'), "sw.js: cache precisa respeitar o escopo do GitHub Pages");

console.log(`OK: produção ${cfg.version}; ${Object.keys(classes).length} classes; ${localRefs.size} referências locais; validações estruturais e de segurança aprovadas.`);
