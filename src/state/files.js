// Penyimpanan berkas unggahan (dokumen repositori & video materi) di IndexedDB browser.
// Fallback ke memori bila IndexedDB tidak tersedia (mis. sandbox tertentu).

const DB_NAME = 'kompas-hub-files';
const STORE = 'files';
const memory = new Map();
let dbPromise = null;

function openDb() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve) => {
    try {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
  return dbPromise;
}

async function run(mode, fn) {
  const db = await openDb();
  if (!db) return null;
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const req = fn(tx.objectStore(STORE));
    tx.oncomplete = () => resolve(req?.result ?? null);
    tx.onerror = () => reject(tx.error);
  });
}

export async function putFile(key, file) {
  const rec = { blob: file, name: file.name, type: file.type, size: file.size, at: new Date().toISOString() };
  memory.set(key, rec);
  try {
    await run('readwrite', (s) => s.put(rec, key));
  } catch {
    /* tetap di memori */
  }
  return { name: rec.name, type: rec.type, size: rec.size, uploadedAt: rec.at };
}

export async function getFile(key) {
  if (memory.has(key)) return memory.get(key);
  try {
    const rec = await run('readonly', (s) => s.get(key));
    if (rec) memory.set(key, rec);
    return rec;
  } catch {
    return null;
  }
}

export async function deleteFile(key) {
  memory.delete(key);
  try {
    await run('readwrite', (s) => s.delete(key));
  } catch {
    /* ignore */
  }
}

export async function clearFiles() {
  memory.clear();
  try {
    await run('readwrite', (s) => s.clear());
  } catch {
    /* ignore */
  }
}

export async function downloadFile(key, fallbackName = 'document') {
  const rec = await getFile(key);
  if (!rec) return false;
  const url = URL.createObjectURL(rec.blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = rec.name || fallbackName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  return true;
}

export async function objectUrl(key) {
  const rec = await getFile(key);
  return rec ? URL.createObjectURL(rec.blob) : null;
}

export const docFileKey = (id) => `doc:${id}`;
export const videoFileKey = (id) => `video:${id}`;

export function formatBytes(n) {
  if (!n && n !== 0) return '';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}
