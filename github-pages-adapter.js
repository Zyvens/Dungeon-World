(() => {
  "use strict";
  const nativeFetch = window.DW_NATIVE_FETCH || window.fetch.bind(window);

  function jsonResponse(payload, status = 200) {
    return new Response(JSON.stringify(payload), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
  }
  function first(v) { return Array.isArray(v) ? v[0] : v; }

  window.fetch = async function(input, init = {}) {
    const raw = typeof input === "string" ? input : input?.url || "";
    let url;
    try { url = new URL(raw, location.href); } catch (_) { return nativeFetch(input, init); }
    if (!url.pathname.endsWith("/api/sheet") && url.pathname !== "/api/sheet") return nativeFetch(input, init);

    try {
      const method = String(init.method || "GET").toUpperCase();
      const body = init.body ? JSON.parse(init.body) : {};
      if (!window.DW_API) throw new Error("Data API indisponível");

      if (method === "POST") {
        const row = first(await window.DW_API.rpc("sheet_create", { p_title: body.title || "Nome do personagem", p_state: body.state || {} }));
        return jsonResponse({ id: row.id, token: row.token }, 201);
      }
      if (method === "GET") {
        const id = url.searchParams.get("id");
        const row = first(await window.DW_API.rpc("sheet_get", { p_id: id }));
        if (!row) return jsonResponse({ error: "not_found" }, 404);
        return jsonResponse(row, 200);
      }
      if (method === "PUT") {
        const id = url.searchParams.get("id");
        const headers = new Headers(init.headers || {});
        const token = headers.get("x-edit-token") || "";
        const ok = await window.DW_API.rpc("sheet_update", { p_id: id, p_edit_token: token, p_title: body.title || "Nome do personagem", p_state: body.state || {} });
        if (ok !== true) return jsonResponse({ error: "invalid_edit_token" }, 403);
        return jsonResponse({ ok: true }, 200);
      }
      return jsonResponse({ error: "method_not_allowed" }, 405);
    } catch (err) {
      console.error("GitHub Pages sheet adapter", err);
      return jsonResponse({ error: err?.message || "data_api_error" }, err?.status || 500);
    }
  };
})();
