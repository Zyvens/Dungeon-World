import { neon } from "@neondatabase/serverless";
import crypto from "node:crypto";

function tokenHash(token) {
  return crypto.createHash("sha256").update(String(token || ""), "utf8").digest("hex");
}

function json(res, status, payload) {
  res.statusCode = status;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.setHeader("cache-control", "no-store");
  res.end(JSON.stringify(payload));
}

function readBody(req) {
  if (req.body && typeof req.body === "object") return Promise.resolve(req.body);
  if (typeof req.body === "string") {
    try { return Promise.resolve(JSON.parse(req.body)); } catch { return Promise.resolve({}); }
  }
  return new Promise((resolve) => {
    let raw = "";
    req.on("data", (chunk) => { raw += chunk; if (raw.length > 8_000_000) req.destroy(); });
    req.on("end", () => { try { resolve(raw ? JSON.parse(raw) : {}); } catch { resolve({}); } });
  });
}

export default async function handler(req, res) {
  if (!process.env.DATABASE_URL) return json(res, 500, { error: "DATABASE_URL não configurada" });
  const sql = neon(process.env.DATABASE_URL);

  try {
    if (req.method === "GET") {
      const id = String(req.query?.id || "");
      if (!id) return json(res, 400, { error: "id obrigatório" });
      const rows = await sql`SELECT id, title, state, updated_at FROM character_sheets WHERE id = ${id}::uuid LIMIT 1`;
      if (!rows.length) return json(res, 404, { error: "ficha não encontrada" });
      return json(res, 200, rows[0]);
    }

    if (req.method === "POST") {
      const body = await readBody(req);
      const id = crypto.randomUUID();
      const token = crypto.randomBytes(32).toString("base64url");
      const hash = tokenHash(token);
      const title = String(body.title || "Nome do personagem").slice(0, 160);
      const state = body.state && typeof body.state === "object" ? body.state : {};
      await sql`INSERT INTO character_sheets (id, edit_token_hash, title, state) VALUES (${id}::uuid, ${hash}, ${title}, ${JSON.stringify(state)}::jsonb)`;
      return json(res, 201, { id, token, title });
    }

    if (req.method === "PUT") {
      const id = String(req.query?.id || "");
      const token = req.headers["x-edit-token"];
      if (!id || !token) return json(res, 400, { error: "id e chave de edição são obrigatórios" });
      const body = await readBody(req);
      const title = String(body.title || "Nome do personagem").slice(0, 160);
      const state = body.state && typeof body.state === "object" ? body.state : null;
      if (!state) return json(res, 400, { error: "estado da ficha inválido" });
      const hash = tokenHash(token);
      const rows = await sql`UPDATE character_sheets SET title = ${title}, state = ${JSON.stringify(state)}::jsonb, updated_at = now() WHERE id = ${id}::uuid AND edit_token_hash = ${hash} RETURNING id, updated_at`;
      if (!rows.length) return json(res, 403, { error: "chave de edição inválida" });
      return json(res, 200, rows[0]);
    }

    res.setHeader("allow", "GET, POST, PUT");
    return json(res, 405, { error: "método não permitido" });
  } catch (error) {
    console.error(error);
    return json(res, 500, { error: "erro interno ao acessar a ficha" });
  }
}
