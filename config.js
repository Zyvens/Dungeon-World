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
  const here = document.currentScript?.src || location.href;
  const base = new URL(".", here);
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
  loadCss("image-actions.css");
  const isGameplay = /(?:^|\/)gameplay\.html$/i.test(location.pathname);
  if (isGameplay) {
    load("gameplay-enhancements.js");
  } else {
    load("sheet-media-refresh.js");
    load("sheet-enhancements.js");
    load("gameplay-tab.js");
  }
})();
