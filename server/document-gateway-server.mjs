import { createServer } from "node:http";
import { URL } from "node:url";

const PORT = Number(process.env.ACADEX_GATEWAY_PORT ?? 8787);

function json(res, status, body) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": process.env.ACADEX_GATEWAY_CORS_ORIGIN ?? "http://localhost:5173",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Acadex-User-Id",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
  });
  res.end(JSON.stringify(body));
}

function parseDocumentIndex() {
  const raw = process.env.ACADEX_GATEWAY_DOCUMENTS_JSON;
  if (!raw) {
    return {};
  }
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") {
      return {};
    }
    return parsed;
  } catch {
    return {};
  }
}

function requireUser(req) {
  const userId = req.headers["x-acadex-user-id"];
  if (!userId || typeof userId !== "string") {
    return null;
  }
  return userId;
}

function sanitizeMetadata(id, doc) {
  return {
    id,
    name: doc.name,
    mimeType: doc.mimeType,
    sizeBytes: doc.sizeBytes,
    canPreview: doc.canPreview !== false,
    canDownload: doc.canDownload !== false,
  };
}

async function sendContent(res, doc) {
  const upstream = await fetch(doc.sourceUrl);
  if (!upstream.ok) {
    json(res, 502, {
      code: "upstream_error",
      message: `Failed to fetch source (${upstream.status})`,
    });
    return;
  }

  const contentType = upstream.headers.get("content-type") || doc.mimeType || "application/octet-stream";
  const buffer = Buffer.from(await upstream.arrayBuffer());

  res.writeHead(200, {
    "Content-Type": contentType,
    "Content-Length": String(buffer.byteLength),
    "Cache-Control": "private, max-age=0, must-revalidate",
    "Access-Control-Allow-Origin": process.env.ACADEX_GATEWAY_CORS_ORIGIN ?? "http://localhost:5173",
    "Access-Control-Allow-Credentials": "true",
  });
  res.end(buffer);
}

const server = createServer(async (req, res) => {
  if (!req.url || !req.method) {
    json(res, 400, { code: "bad_request", message: "Invalid request" });
    return;
  }

  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": process.env.ACADEX_GATEWAY_CORS_ORIGIN ?? "http://localhost:5173",
      "Access-Control-Allow-Credentials": "true",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Acadex-User-Id",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
    });
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);

  if (url.pathname === "/healthz") {
    json(res, 200, { ok: true });
    return;
  }

  const userId = requireUser(req);
  if (!userId) {
    json(res, 401, {
      code: "unauthorized",
      message: "Missing user context. Provide X-Acadex-User-Id for development.",
    });
    return;
  }

  const metadataMatch = url.pathname.match(/^\/api\/v1\/documents\/([^/]+)$/);
  const contentMatch = url.pathname.match(/^\/api\/v1\/documents\/([^/]+)\/content$/);

  if (!metadataMatch && !contentMatch) {
    json(res, 404, { code: "not_found", message: "Route not found" });
    return;
  }

  const id = decodeURIComponent((metadataMatch || contentMatch)[1]);
  const documents = parseDocumentIndex();
  const doc = documents[id];

  if (!doc) {
    json(res, 404, { code: "not_found", message: "Document not found" });
    return;
  }

  if (!doc.sourceUrl || !doc.name || !doc.mimeType) {
    json(res, 500, {
      code: "invalid_document_config",
      message: "Document entry is missing required fields.",
    });
    return;
  }

  if (metadataMatch) {
    json(res, 200, sanitizeMetadata(id, doc));
    return;
  }

  try {
    await sendContent(res, doc);
  } catch {
    json(res, 500, { code: "content_error", message: "Failed to stream document content" });
  }
});

server.listen(PORT, () => {
  console.log(`[acadex-gateway] listening on http://localhost:${PORT}`);
});
