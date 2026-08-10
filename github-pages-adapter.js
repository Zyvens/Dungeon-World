(() => {
  "use strict";

  const nativeFetch = window.DW_NATIVE_FETCH || window.fetch.bind(window);

  function jsonResponse(payload, status = 200) {
    return new Response(JSON.stringify(payload), {
      status,
      headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }
    });
  }

  function first(value) { return Array.isArray(value) ? value[0] : value; }
  function isSheetApi(url) { return url.pathname === "/api/sheet" || url.pathname.endsWith("/api/sheet"); }

  window.fetch = async function(input, init = {}) {
    const raw = typeof input === "string" ? input : input?.url || "";
    let url;
    try { url = new URL(raw, location.href); }
    catch (_) { return nativeFetch(input, init); }
    if (!isSheetApi(url)) return nativeFetch(input, init);

    try {
      if (!window.DW_API) throw new Error("Data API indisponível.");
      const method = String(init.method || "GET").toUpperCase();
      let body = {};
      if (init.body) {
        try { body = typeof init.body === "string" ? JSON.parse(init.body) : init.body; }
        catch (_) { return jsonResponse({ error: "invalid_json" }, 400); }
      }

      if (method === "POST") {
        const row = first(await window.DW_API.rpc("sheet_create", {
          p_title: body.title || "Nome do personagem",
          p_state: body.state || {}
        }));
        if (!row?.id || !row?.token) return jsonResponse({ error: "invalid_sheet_response" }, 502);
        return jsonResponse({ id: row.id, token: row.token }, 201);
      }

      if (method === "GET") {
        const id = url.searchParams.get("id");
        if (!id) return jsonResponse({ error: "missing_id" }, 400);
        const row = first(await window.DW_API.rpc("sheet_get", { p_id: id }));
        if (!row) return jsonResponse({ error: "not_found" }, 404);
        return jsonResponse(row, 200);
      }

      if (method === "PUT") {
        const id = url.searchParams.get("id");
        if (!id) return jsonResponse({ error: "missing_id" }, 400);
        const headers = new Headers(init.headers || {});
        const token = headers.get("x-edit-token") || "";
        if (!token) return jsonResponse({ error: "missing_edit_token" }, 403);
        const ok = await window.DW_API.rpc("sheet_update", {
          p_id: id,
          p_edit_token: token,
          p_title: body.title || "Nome do personagem",
          p_state: body.state || {}
        });
        if (ok !== true) return jsonResponse({ error: "invalid_edit_token" }, 403);
        return jsonResponse({ ok: true }, 200);
      }

      return jsonResponse({ error: "method_not_allowed" }, 405);
    } catch (err) {
      console.error("GitHub Pages sheet adapter", err);
      const status = Number(err?.status) || 500;
      return jsonResponse({ error: err?.message || "data_api_error" }, status >= 400 && status <= 599 ? status : 500);
    }
  };
})();
