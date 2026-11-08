# Supabase backend

Project: `kompas-learning-hub` (ref `fsujraozgwobtdrtylal`, region ap-southeast-1).

- **Tables**: `lessons`, `documents`, `questions`, `settings`, `learner_progress` — RLS on. Signed-in users read content; only users whose `app_metadata.role = 'admin'` can write. Each learner reads/writes only their own `learner_progress` row.
- **Storage**: private buckets `documents` (PDF/DOC/DOCX/ODT/RTF/TXT, max 25 MB) and `videos` (MP4/WebM/MOV, max 50 MB). Read: signed-in users. Write/delete: admins.
- **Accounts**: `admin@kompas-hub.test` (role admin) and `learner@kompas-hub.test` (role learner). The login form accepts the short username (`admin`, `learner`).

To add an admin: create the user in Supabase Auth, then set `raw_app_meta_data.role = 'admin'` for that user.

## Edge Function `import-document`

`supabase/functions/import-document/index.ts` (deployed with `verify_jwt = false`; the function checks the caller itself and accepts admins only).

- Body: `{ "docId": "uu-40-1999", "url": "https://…", "match": "optional text" }`.
- Downloads a public PDF/DOC/DOCX (max 25 MB, 50 s timeout), or — if the URL is an HTML page — the first linked document whose address contains `match`. File type is checked by its first bytes, not by the extension.
- Saves it to `documents/<docId>/<timestamp>-<name>` and writes `documents.file = { name, size, type, uploadedAt, path, sourceUrl, foundOn? }`, then removes the previous file.
- `dewanpers.or.id` serves an incomplete TLS chain (the Sectigo "Public Server Authentication CA OV R36" intermediate is missing). On a certificate error only, the function retries once trusting that public intermediate (pinned in the code with its SHA-256 fingerprint).
- Used by **Administration → Legal Repository**: the globe button (one document), **Import official files** (every entry in `OFFICIAL_FILES`, `src/data/legal.js`, that has no file yet), and the "fetch from a web address" field in the document editor.

Official copies stored on 8 Nov 2026: 12 of 13 entries (MK 192/PUU-XXIII/2025 is unverified and has no official file). JDIH BPK, DPR and JDIH Komdigi block downloads from cloud servers, so the four statutes come from Wikimedia Commons copies that cite their government source (recorded in `file.provenance`).
