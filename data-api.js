(() => {
  "use strict";

  const nativeFetch = window.fetch.bind(window);
  window.DW_NATIVE_FETCH = nativeFetch;

  async function authModule() {
    for (let i = 0; i < 100 && !window.DW_AUTH; i += 1) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    if (!window.DW_AUTH) throw new Error("Módulo de autenticação indisponível.");
    await window.DW_AUTH.ready;
    return window.DW_AUTH;
  }

  function apiError(error, fallback = "Falha ao acessar o Neon Data API.") {
    const err = new Error(error?.message || error?.details || error?.hint || error?.code || fallback);
    err.code = error?.code;
    err.details = error?.details;
    err.hint = error?.hint;
    err.status = Number(error?.status || error?.statusCode || 0) || undefined;
    if (!err.status && (err.code === "42501" || err.code === "28000")) err.status = err.code === "28000" ? 401 : 403;
    err.payload = error;
    return err;
  }

  async function getClient(interactive) {
    const auth = await authModule();
    if (interactive) await auth.ensureSignedIn();
    else if (!auth.getSession()?.user) await auth.refreshSession();

    if (!auth.getSession()?.user) {
      const err = new Error("Autenticação necessária.");
      err.status = 401;
      throw err;
    }

    const client = auth.getClient?.() || window.DW_NEON;
    if (!client) throw new Error("Cliente Neon indisponível.");
    return { auth, client };
  }

  async function rpc(name, args = {}, options = {}) {
    const interactive = options.interactive !== false;
    const { auth, client } = await getClient(interactive);

    let result = await client.rpc(name, args);
    if (result?.error && (result.error.status === 401 || result.error.code === "28000")) {
      await auth.refreshSession();
      if (auth.getSession()?.user) result = await client.rpc(name, args);
    }

    if (result?.error) throw apiError(result.error);
    return result?.data ?? null;
  }

  window.DW_API = { rpc, nativeFetch };
})();
