# Sagar Classes – backend (Node.js + Express + MySQL)

## 1. Create the database
```bash
mysql -u root -p < server/schema.sql
```
This creates the `sagar_classes` database, all tables, and loads your current students, staff,
toppers, events and notices (only into empty tables, so it is safe to re-run).

Recommended: a dedicated MySQL user instead of root.
```sql
CREATE USER 'sagar_app'@'localhost' IDENTIFIED BY 'a-strong-password';
GRANT SELECT, INSERT, UPDATE, DELETE ON sagar_classes.* TO 'sagar_app'@'localhost';
```

## 2. Configure and start
```bash
cd server
npm install
cp .env.example .env      # then edit: DB_*, JWT_SECRET, ADMIN_USER, ADMIN_PASSWORD
npm start
```
Open http://localhost:3000 – the server also serves the website, so everything is same-origin.
Admin panel: http://localhost:3000/admin.html (log in with ADMIN_USER / ADMIN_PASSWORD).
The password is stored bcrypt-hashed; after the first start you can delete `ADMIN_PASSWORD` from `.env`.

Generate a JWT secret:
`node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

## What you get
| Area | Details |
|---|---|
| Admin CRUD | Students, Staff, Student/Staff Attendance, Toppers, Functions, Notices – add, edit, delete, search, sort |
| Attendance filters | Month picker + Present/Absent filter (also applied to the downloads) |
| Downloads | Excel (.xlsx) and PDF per table, or **All (Excel / PDF)** for every table at once |
| Public pages | Attendance forms save to MySQL; notice ticker, Functions and Toppers pages load from MySQL (they keep their static HTML if the API is unreachable) |

## Behaviour worth knowing
- Attendance is one row per person per day. Submitting the same name + class/department + date again **updates** the status.
- Public attendance forms only accept dates from the last 7 days up to tomorrow (change in `server/entities.js → checkPublicDateWindow`).
- Photos are stored as links (URL or a path like `images/a.jpg`), not uploaded files.
- PDFs use the built-in Latin font, so Devanagari/emoji are dropped from PDFs. Excel keeps everything.
  To print Hindi/Marathi in PDFs, put a Unicode `.ttf` in `server/fonts/` and set `PDF_FONT_PATH` in `.env`.
- `/server`, `node_modules` and dotfiles (`.env`) are never served over HTTP.
- Behind nginx / a host proxy set `TRUST_PROXY=1`, and serve over HTTPS (the login token is sent as a Bearer header).

## Tests
`npm test` runs the validation / SQL-builder unit tests (no database needed).

## API (all JSON)
Public: `GET /api/public/{notices,events,toppers}`, `POST /api/public/attendance/{student,staff}`
Auth: `POST /api/auth/login` → `{ token }`
Admin (`Authorization: Bearer <token>`): `GET /api/admin/{meta,stats,export-all}`,
`GET|POST /api/admin/:table`, `PUT|DELETE /api/admin/:table/:id`, `GET /api/admin/:table/export?format=xlsx|pdf&q=&month=YYYY-MM&status=`
Tables: `students, staff, student_attendance, staff_attendance, toppers, events, notices`
