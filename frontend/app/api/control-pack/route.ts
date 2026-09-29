/* Same-origin proxy for control-pack. See investigate/route.ts for the pattern. */
const BACKEND = process.env.BACKEND_URL || 'http://localhost:8000';
const KEY = process.env.SWARN_API_KEY || '';
const MAX_BODY = 16 * 1024;

export async function POST(req: Request) {
  const raw = await req.text();
  if (raw.length > MAX_BODY) {
    return Response.json({ detail: 'Payload too large' }, { status: 413 });
  }
  let body: unknown = {};
  try { body = raw ? JSON.parse(raw) : {}; } catch { return Response.json({ detail: 'Invalid JSON' }, { status: 400 }); }
  const r = await fetch(`${BACKEND}/control-pack`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(KEY ? { 'X-API-Key': KEY } : {}) },
    body: JSON.stringify(body),
  });
  const data = await r.json().catch(() => ({ detail: 'Upstream error' }));
  return Response.json(data, { status: r.status });
}
