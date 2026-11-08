# KOMPAS Journalism Learning Hub — MVP (Hukum & Etika Komunikasi)

Prototipe akademik 1 minggu. **Bukan sistem resmi Kompas.** Semua progres, skor, dan esai adalah data demo yang tersimpan di `localStorage` browser.

Language: dashboard, induction material, quiz, essays, and assessment are in **English**. The Legal Repository stays in **Bahasa Indonesia** as the master version (English version pending).

Stack: React 18 · Vite 5 · Tailwind CSS 3 · lucide-react. Build menghasilkan satu file `dist/index.html` (self-contained).

## Login (demo)
- `admin / admin`: administrator, semua modul + **Administration**
- `learner / learner`: tampilan peserta saja

Di build Supabase, login memakai Supabase Auth. Password `admin` sangat lemah: ganti sebelum dipakai di luar demo.

## Modul
1. **Dashboard** — penyelesaian %, modul selesai, skor kuis, jam belajar, progres per modul, aktivitas 7 hari, capaian kompetensi.
2. **Induksi** — 4 video (placeholder berlabel + navigasi bab), kuis 15 soal dengan skor otomatis (lulus ≥ 80%), 3 esai yang dapat diedit dengan status review manual.
3. **Repositori Hukum** — UU 40/1999, UU ITE (11/2008, 19/2016, 1/2024), KEJ, PPMS, Peraturan Dewan Pers 3/2024, Putusan MK; pencarian, filter, dan label status verifikasi.
4. **Asesmen & Capaian** — hasil kuis, status review esai, progres individu, status lulus/belum lulus. Admin dapat menyetujui/menolak esai.
5. **Administration** (admin) — kelola materi induksi (judul, durasi, bab & poin kunci, video URL/unggah, referensi), repositori hukum (tambah/edit/hapus, lihat & unggah PDF/DOC/DOCX), bank kuis (soal, opsi, jawaban, pembahasan, sumber) dan nilai lulus.

Setiap referensi punya tombol kapsul **Sumber Asli** (tautan resmi) dan **Unduh Dokumen** (berkas yang diunggah admin).

## Backend: Supabase
Build utama (`npm run build`) terhubung ke Supabase (lihat `supabase/README.md`): login lewat Supabase Auth, konten di Postgres dengan RLS (hanya admin yang bisa menulis), dokumen & video di Supabase Storage, dan progres tiap peserta tersimpan per akun.

Konfigurasi ada di `.env` (`VITE_SUPABASE_URL`, `VITE_SUPABASE_KEY` = publishable key, aman untuk publik karena data dilindungi RLS).

Build offline (`npm run build:offline`, dipakai untuk pratinjau artifact Claude) tidak memakai jaringan: data disimpan di `localStorage`/IndexedDB browser.

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

Routing memakai hash (`#dashboard`, `#induction`, `#quiz`, `#essays`, `#repository`, `#assessment`, `#admin`, `#admin-repository`, `#admin-quiz`), jadi tidak perlu aturan redirect.

## Catatan konten hukum
Status verifikasi tiap dokumen ada di `src/data/legal.js` (dicek 7 November 2026). Ringkasan untuk pembelajaran, bukan nasihat hukum.
