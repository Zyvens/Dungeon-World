(() => {
  "use strict";
  const cfg = window.DW_CONFIG || {};
  const nativeFetch = window.fetch.bind(window);
  window.DW_NATIVE_FETCH = nativeFetch;

  async function rpc(name, args = {}, options = {}) {
    const interactive = options.interactive !== false;
    if (!window.DW_AUTH) throw new Error("Módulo de autenticação indisponível.");
    const jwt = await window.DW_AUTH.getJwt({ interactive });
    if (!jwt) throw new Error("Autenticação necessária.");
    const res = await nativeFetch(`${cfg.dataApiUrl}/rpc/${encodeURIComponent(name)}`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${jwt}`,
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(args),
      cache: "no-store"
    });
    const text = await res.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch (_) { data = text; }
    if (!res.ok) {
      const msg = data?.message || data?.hint || data?.details || (typeof data === "string" ? data : `HTTP ${res.status}`);
      const err = new Error(msg);
      err.status = res.status;
      err.payload = data;
      throw err;
    }
    return data;
  }

  window.DW_API = { rpc, nativeFetch };
})();
