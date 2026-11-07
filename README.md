# KOMPAS Journalism Learning Hub — MVP (Hukum & Etika Komunikasi)

Prototipe akademik 1 minggu. **Bukan sistem resmi Kompas.** Semua progres, skor, dan esai adalah data demo yang tersimpan di `localStorage` browser.

Language: dashboard, induction material, quiz, essays, and assessment are in **English**. The Legal Repository stays in **Bahasa Indonesia** as the master version (English version pending).

Stack: React 18 · Vite 5 · Tailwind CSS 3 · lucide-react. Build menghasilkan satu file `dist/index.html` (self-contained).

## Modul
1. **Dashboard** — penyelesaian %, modul selesai, skor kuis, jam belajar, progres per modul, aktivitas 7 hari, capaian kompetensi.
2. **Induksi** — 4 video (placeholder berlabel + navigasi bab), kuis 15 soal dengan skor otomatis (lulus ≥ 80%), 3 esai yang dapat diedit dengan status review manual.
3. **Repositori Hukum** — UU 40/1999, UU ITE (11/2008, 19/2016, 1/2024), KEJ, PPMS, Peraturan Dewan Pers 3/2024, Putusan MK; pencarian, filter, dan label status verifikasi.
4. **Asesmen & Capaian** — hasil kuis, status review esai, progres individu, status lulus/belum lulus.

## Menjalankan lokal
```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # output: dist/index.html
```

## Deploy ke Cloudflare Pages
Hubungkan repo ini di Cloudflare Pages (Workers & Pages → Create → Pages → Connect to Git), lalu:

| Pengaturan | Nilai |
|---|---|
| Framework preset | Vite (atau None) |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Node version (env `NODE_VERSION`) | `20` |

Routing memakai hash (`#dashboard`, `#induction`, `#quiz`, `#essays`, `#repository`, `#assessment`), jadi tidak perlu aturan redirect.

## Catatan konten hukum
Status verifikasi tiap dokumen ada di `src/data/legal.js` (dicek 7 November 2026). Ringkasan untuk pembelajaran, bukan nasihat hukum.
