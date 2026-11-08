// import-document: admin-only. Downloads a public document (PDF/DOC/DOCX) from a URL — or finds the
// first matching PDF link on an HTML page — and saves it to the private "documents" bucket, then
// records the file on the documents row. Learners download it via "Unduh Dokumen".
import { createClient } from 'npm:@supabase/supabase-js@2.117.3';

const MAX_BYTES = 25 * 1024 * 1024;
const TIMEOUT_MS = 50_000;
const MIME: Record<string, string> = {
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};
const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

function sniff(b: Uint8Array): string | null {
  if (b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46) return 'pdf'; // %PDF
  if (b[0] === 0xd0 && b[1] === 0xcf && b[2] === 0x11 && b[3] === 0xe0) return 'doc'; // OLE2
  if (b[0] === 0x50 && b[1] === 0x4b && b[2] === 0x03 && b[3] === 0x04) return 'docx'; // ZIP
  return null;
}

function isPrivateHost(host: string): boolean {
  const h = host.toLowerCase();
  if (h === 'localhost' || h.endsWith('.local') || h.endsWith('.internal') || h === '[::1]') return true;
  const m = h.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (!m) return false;
  const [a, b] = [Number(m[1]), Number(m[2])];
  return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168);
}

// Some official sites serve an incomplete certificate chain. dewanpers.or.id (checked 8 Nov 2026 via
// SSL Labs) sends a leaf issued by "Sectigo Public Server Authentication CA OV R36" but omits that
// intermediate, so strict TLS clients fail with "UnknownIssuer". On that error only, we retry once
// trusting the missing public intermediate below (Sectigo-issued, chains to Sectigo Public Server
// Authentication Root R46; SHA-256 65:42:D1:76:...:E7:85:30, notAfter 2036-03-21).
const EXTRA_INTERMEDIATES = [
  `-----BEGIN CERTIFICATE-----
MIIGTDCCBDSgAwIBAgIQLBo8dulD3d3/GRsxiQrtcTANBgkqhkiG9w0BAQwFADBf
MQswCQYDVQQGEwJHQjEYMBYGA1UEChMPU2VjdGlnbyBMaW1pdGVkMTYwNAYDVQQD
Ey1TZWN0aWdvIFB1YmxpYyBTZXJ2ZXIgQXV0aGVudGljYXRpb24gUm9vdCBSNDYw
HhcNMjEwMzIyMDAwMDAwWhcNMzYwMzIxMjM1OTU5WjBgMQswCQYDVQQGEwJHQjEY
MBYGA1UEChMPU2VjdGlnbyBMaW1pdGVkMTcwNQYDVQQDEy5TZWN0aWdvIFB1Ymxp
YyBTZXJ2ZXIgQXV0aGVudGljYXRpb24gQ0EgT1YgUjM2MIIBojANBgkqhkiG9w0B
AQEFAAOCAY8AMIIBigKCAYEApkMtJ3R06jo0fceI0M52B7K+TyMeGcv2BQ5AVc3j
lYt76TvHIu/nNe22W/RJXX9rWUD/2GE6GF5x0V4bsY7K3IeJ8E7+KzG/TGboySfD
u+F52jqQBbY62ofhYjMeiAbLI02+FqwHeM8uIrUtcX8b2RCxF358TB0NHVccAXZc
FYgZndZCeXxjuca7pJJ20LLUnXtgXcjAE1vY4WvbReW0W6mkeZyNGdmpTcFs5Y+s
yy6LtE5Zocji9J9NlNnReox2RWVyEXpA1ChZ4gqN+ZpVSIQ0HBorVFbBKyhdZyEX
gZgNSNtBRwxqwIzJePJhYd4ZUhO1vk+/uP3nwDk0p95q/j7naXNCSvESnrHPypaB
WRK066nKfPRPi9m9kIOhMdYfS8giFRTcdgL24Ycilj7ecAK9Trh0VbjwouJ4WH+x
bt47u68ZFCD/ac55I0DNHkCpaPruj6e9Rmr7K46wZDAYXuEAqB7tGG/jd6JAA+H2
O44CV98NRsU213f1kScIZntNAgMBAAGjggGBMIIBfTAfBgNVHSMEGDAWgBRWc1hk
lfmSGrASKgRieaFAFYghSTAdBgNVHQ4EFgQU42Z0u3BojSxdTg6mSo+bNyKcgpIw
DgYDVR0PAQH/BAQDAgGGMBIGA1UdEwEB/wQIMAYBAf8CAQAwHQYDVR0lBBYwFAYI
KwYBBQUHAwEGCCsGAQUFBwMCMBsGA1UdIAQUMBIwBgYEVR0gADAIBgZngQwBAgIw
VAYDVR0fBE0wSzBJoEegRYZDaHR0cDovL2NybC5zZWN0aWdvLmNvbS9TZWN0aWdv
UHVibGljU2VydmVyQXV0aGVudGljYXRpb25Sb290UjQ2LmNybDCBhAYIKwYBBQUH
AQEEeDB2ME8GCCsGAQUFBzAChkNodHRwOi8vY3J0LnNlY3RpZ28uY29tL1NlY3Rp
Z29QdWJsaWNTZXJ2ZXJBdXRoZW50aWNhdGlvblJvb3RSNDYucDdjMCMGCCsGAQUF
BzABhhdodHRwOi8vb2NzcC5zZWN0aWdvLmNvbTANBgkqhkiG9w0BAQwFAAOCAgEA
BZXWDHWC3cubb/e1I1kzi8lPFiK/ZUoH09ufmVOrc5ObYH/XKkWUexSPqRkwKFKr
7r8OuG+p7VNB8rifX6uopqKAgsvZtZsq7iAFw04To6vNcxeBt1Eush3cQ4b8nbQR
MQLChgEAqwhuXp9P48T4QEBSksYav7+aFjNySsLYlPzNqVM3RNwvBdvp6vgDtGwc
xlKQZVuuNVIaoYyls8swhxDeSHKpRdxRauTLZ+pl+wGvy0pnrLEJGSz9mOEmfbod
e/XopR2NGqaHJ6bIjyxPu6UtyQGI26En7UAEozACrHz06Nx2jTAY9E6NeB6XuobE
wLK025ZRmvglcURG1BrV24tGHHTgxCe8M3oGlpUSMTKQ2dkgljZVYt+gKdFtWELZ
MuRdi+X3XsrR8LFz+aLUiDRfQqhmw3RxjIyVKvvu9UPYY1nsvxYmFnUSeM+2q1z/
iPUry+xDY9MC6+IhleKT094VKdFVp7LXH42+wvU+17lRolQ2mK2N/nBLVBwaIhib
QXw4VYKwB86Bc6eS6iqsc94KEgD/U4VsjmgfhK+Xp4NM+VYzTTa3QeV3p8xOM0cw
q1p8oZFA+OBcz3FYWpDIe5j0NWKlw9hXsTyPY/HeZUV59akskSOSRSmDfe8wJDPX
58uB9/7lud0G3x0pxQAcffP0ayKavNwDTw4UfJ34cEw=
-----END CERTIFICATE-----`,
];
const UA = 'Mozilla/5.0 (compatible; KompasLearningHub/1.0; +https://comm-law-and-ethics.pages.dev)';
const ACCEPT = 'application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/html;q=0.8,*/*;q=0.5';
const isCertError = (e: unknown) => /UnknownIssuer|peer certificate|certificate/i.test(String((e as Error)?.message || e));

function concat(chunks: Uint8Array[], total: number) {
  const out = new Uint8Array(total);
  let off = 0;
  for (const c of chunks) {
    out.set(c, off);
    off += c.length;
  }
  return out;
}

function indexOfSeq(hay: Uint8Array, seq: number[], from = 0) {
  outer: for (let i = from; i <= hay.length - seq.length; i++) {
    for (let j = 0; j < seq.length; j++) if (hay[i + j] !== seq[j]) continue outer;
    return i;
  }
  return -1;
}

function dechunk(body: Uint8Array): Uint8Array {
  const parts: Uint8Array[] = [];
  let pos = 0;
  let total = 0;
  for (;;) {
    const eol = indexOfSeq(body, [13, 10], pos);
    if (eol < 0) break;
    const size = parseInt(new TextDecoder().decode(body.subarray(pos, eol)).split(';')[0].trim(), 16);
    if (!size) break;
    const startAt = eol + 2;
    parts.push(body.subarray(startAt, startAt + size));
    total += size;
    pos = startAt + size + 2;
  }
  return concat(parts, total);
}

// Minimal HTTPS GET over a TLS socket that also trusts EXTRA_INTERMEDIATES. Used only when the
// normal fetch fails certificate verification because the server omitted its intermediate.
async function tlsGet(url: URL, signal: AbortSignal, hops = 0): Promise<{ res: Response; bytes: Uint8Array; finalUrl: string }> {
  if (url.protocol !== 'https:' || isPrivateHost(url.hostname)) throw new Error('Only public https URLs are allowed.');
  const conn = await Deno.connectTls({ hostname: url.hostname, port: Number(url.port || 443), caCerts: EXTRA_INTERMEDIATES });
  const onAbort = () => {
    try {
      conn.close();
    } catch {
      /* already closed */
    }
  };
  signal.addEventListener('abort', onAbort, { once: true });
  try {
    const head = `GET ${url.pathname}${url.search} HTTP/1.1\r\nHost: ${url.host}\r\nUser-Agent: ${UA}\r\nAccept: ${ACCEPT}\r\nAccept-Encoding: identity\r\nConnection: close\r\n\r\n`;
    await conn.write(new TextEncoder().encode(head));
    const chunks: Uint8Array[] = [];
    let total = 0;
    const buf = new Uint8Array(64 * 1024);
    for (;;) {
      const n = await conn.read(buf);
      if (n === null) break;
      total += n;
      if (total > MAX_BYTES + 64 * 1024) throw new Error('The file is larger than 25 MB.');
      chunks.push(buf.slice(0, n));
    }
    const raw = concat(chunks, total);
    const sep = indexOfSeq(raw, [13, 10, 13, 10]);
    if (sep < 0) throw new Error('Malformed response from the source.');
    const lines = new TextDecoder().decode(raw.subarray(0, sep)).split('\r\n');
    const status = Number(lines[0].split(' ')[1] || 0);
    const headers = new Headers();
    for (const l of lines.slice(1)) {
      const i = l.indexOf(':');
      if (i > 0) headers.append(l.slice(0, i).trim(), l.slice(i + 1).trim());
    }
    if (status >= 300 && status < 400 && headers.get('location')) {
      if (hops >= 5) throw new Error('Too many redirects.');
      const next = new URL(headers.get('location')!, url);
      return next.host === url.host ? tlsGet(next, signal, hops + 1) : fetchLimited(next.toString(), signal);
    }
    if (status < 200 || status >= 300) throw new Error(`The source responded with HTTP ${status}.`);
    let bytes = raw.subarray(sep + 4);
    if (/chunked/i.test(headers.get('transfer-encoding') || '')) bytes = dechunk(bytes);
    if (bytes.length > MAX_BYTES) throw new Error('The file is larger than 25 MB.');
    return { res: new Response(null, { status, headers }), bytes: new Uint8Array(bytes), finalUrl: url.toString() };
  } finally {
    signal.removeEventListener('abort', onAbort);
    onAbort();
  }
}

async function fetchLimited(url: string, signal: AbortSignal): Promise<{ res: Response; bytes: Uint8Array; finalUrl: string }> {
  const u = new URL(url);
  if (!['http:', 'https:'].includes(u.protocol) || isPrivateHost(u.hostname)) throw new Error('Only public http(s) URLs are allowed.');
  let res: Response;
  try {
    res = await fetch(u, { redirect: 'follow', signal, headers: { 'User-Agent': UA, Accept: ACCEPT } });
  } catch (e) {
    if (!isCertError(e) || u.protocol !== 'https:') throw e;
    try {
      return await tlsGet(u, signal);
    } catch (e2) {
      throw new Error(`${(e2 as Error).message} (retried with the issuer's intermediate certificate)`);
    }
  }
  if (!res.ok) throw new Error(`The source responded with HTTP ${res.status}.`);
  const declared = Number(res.headers.get('content-length') || 0);
  if (declared > MAX_BYTES) throw new Error('The file is larger than 25 MB.');
  const reader = res.body!.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.length;
    if (total > MAX_BYTES) {
      await reader.cancel();
      throw new Error('The file is larger than 25 MB.');
    }
    chunks.push(value);
  }
  return { res, bytes: concat(chunks, total), finalUrl: res.url || url };
}

function findDocLinks(html: string, base: string, match?: string): string[] {
  const out: string[] = [];
  const re = /href\s*=\s*["']([^"'#]+)["']/gi;
  let m: RegExpExecArray | null;
  const filter = match ? new RegExp(match.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '.*'), 'i') : null;
  while ((m = re.exec(html))) {
    let href: string;
    try {
      href = new URL(m[1].replace(/&amp;/g, '&'), base).toString();
    } catch {
      continue;
    }
    if (!/\.(pdf|docx?)(\?|$)/i.test(href) && !/\/(download|unduh)\//i.test(href)) continue;
    let decoded = href;
    try {
      decoded = decodeURIComponent(href);
    } catch {
      /* keep raw */
    }
    if (filter && !filter.test(decoded)) continue;
    if (!out.includes(href)) out.push(href);
  }
  return out.sort((a, b) => Number(/\.pdf/i.test(b)) - Number(/\.pdf/i.test(a)));
}

function fileName(res: Response, url: string, kind: string): string {
  const cd = res.headers.get('content-disposition') || '';
  const star = cd.match(/filename\*\s*=\s*[^']*''([^;]+)/i);
  const plain = cd.match(/filename\s*=\s*"?([^";]+)"?/i);
  let name = star ? decodeURIComponent(star[1]) : plain ? plain[1] : '';
  if (!name) {
    const seg = new URL(url).pathname.split('/').filter(Boolean).pop() || 'document';
    try {
      name = decodeURIComponent(seg);
    } catch {
      name = seg;
    }
  }
  name = name.trim().replace(/[\\/:*?"<>|]+/g, '_').slice(-140);
  if (!new RegExp(`\\.${kind}$`, 'i').test(name)) name = `${name.replace(/\.[a-z0-9]{2,5}$/i, '')}.${kind}`;
  return name;
}

const safePath = (n: string) => n.normalize('NFKD').replace(/[^\w.-]+/g, '_').slice(-120);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
    auth: { persistSession: false },
  });
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData?.user) return json({ error: 'Sign in required.' }, 401);
  if (userData.user.app_metadata?.role !== 'admin') return json({ error: 'Only administrators can import documents.' }, 403);

  let body: { docId?: string; url?: string; match?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid JSON body.' }, 400);
  }
  const { docId, url, match } = body;
  if (!docId || typeof docId !== 'string' || !url || typeof url !== 'string') return json({ error: 'docId and url are required.' }, 400);

  const { data: doc, error: docErr } = await supabase.from('documents').select('id, file').eq('id', docId).maybeSingle();
  if (docErr) return json({ error: docErr.message }, 500);
  if (!doc) return json({ error: `Document "${docId}" not found.` }, 404);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    let { res, bytes, finalUrl } = await fetchLimited(url, controller.signal);
    let kind = sniff(bytes);
    let foundOn: string | null = null;

    if (!kind) {
      const ct = res.headers.get('content-type') || '';
      if (!/html|xml|text/i.test(ct)) throw new Error(`Unsupported content type (${ct || 'unknown'}). Use a PDF, DOC, or DOCX link, or a page that links to one.`);
      const html = new TextDecoder().decode(bytes);
      const links = findDocLinks(html, finalUrl, match);
      if (!links.length) throw new Error(`No PDF/DOC link found on that page${match ? ` matching "${match}"` : ''}.`);
      foundOn = finalUrl;
      let lastErr = '';
      for (const link of links.slice(0, 4)) {
        try {
          const next = await fetchLimited(link, controller.signal);
          const k = sniff(next.bytes);
          if (k) {
            ({ res, bytes, finalUrl } = next);
            kind = k;
            break;
          }
          lastErr = 'Linked file is not a PDF, DOC, or DOCX.';
        } catch (e) {
          lastErr = (e as Error).message;
        }
      }
      if (!kind) throw new Error(lastErr || 'Could not download a document from that page.');
    }

    const name = fileName(res, finalUrl, kind);
    const path = `${docId}/${Date.now()}-${safePath(name)}`;
    const { error: upErr } = await supabase.storage.from('documents').upload(path, bytes, { contentType: MIME[kind], upsert: false });
    if (upErr) throw new Error(`Storage upload failed: ${upErr.message}`);

    const file = {
      name,
      size: bytes.length,
      type: MIME[kind],
      uploadedAt: new Date().toISOString(),
      path,
      sourceUrl: finalUrl,
      ...(foundOn ? { foundOn } : {}),
    };
    const { error: updErr } = await supabase.from('documents').update({ file }).eq('id', docId);
    if (updErr) {
      await supabase.storage.from('documents').remove([path]);
      throw new Error(`Could not save the file record: ${updErr.message}`);
    }
    const oldPath = (doc.file as { path?: string } | null)?.path;
    if (oldPath && oldPath !== path) await supabase.storage.from('documents').remove([oldPath]);
    return json({ file });
  } catch (e) {
    const msg = (e as Error).name === 'AbortError' ? 'The source took too long to respond.' : (e as Error).message;
    return json({ error: msg }, 422);
  } finally {
    clearTimeout(timer);
  }
});
