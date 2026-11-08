# Supabase backend

Project: `kompas-learning-hub` (ref `fsujraozgwobtdrtylal`, region ap-southeast-1).

- **Tables**: `lessons`, `documents`, `questions`, `settings`, `learner_progress` — RLS on. Signed-in users read content; only users whose `app_metadata.role = 'admin'` can write. Each learner reads/writes only their own `learner_progress` row.
- **Storage**: private buckets `documents` (PDF/DOC/DOCX/ODT/RTF/TXT, max 25 MB) and `videos` (MP4/WebM/MOV, max 50 MB). Read: signed-in users. Write/delete: admins.
- **Accounts**: `admin@kompas-hub.test` (role admin) and `learner@kompas-hub.test` (role learner). The login form accepts the short username (`admin`, `learner`).

To add an admin: create the user in Supabase Auth, then set `raw_app_meta_data.role = 'admin'` for that user.
