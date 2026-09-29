/* Same-origin proxy: browser -> Next.js server -> FastAPI.
   The SWARN_API_KEY lives only in server env (frontend/.env.local, gitignored)
   and is NEVER sent to the browser. Body size capped to match backend limits. */
const BACKEND = process.env.BACKEND_URL || 'http://localhost:8000';
const KEY = process.env.SWARN_API_KEY || '';
const MAX_BODY = 16 * 1024;

async function forward(path: string, req: Request) {
  const raw = await req.text();
  if (raw.length > MAX_BODY) {
    return Response.json({ detail: 'Payload too large' }, { status: 413 });
  }
  let body: unknown = {};
  try { body = raw ? JSON.parse(raw) : {}; } catch { return Response.json({ detail: 'Invalid JSON' }, { status: 400 }); }
  const r = await fetch(`${BACKEND}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(KEY ? { 'X-API-Key': KEY } : {}) },
    body: JSON.stringify(body),
  });
  const data = await r.json().catch(() => ({ detail: 'Upstream error' }));
  return Response.json(data, { status: r.status });
}

export async function POST(req: Request) {
  return forward('/investigate', req);
}
