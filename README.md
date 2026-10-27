# Online Learning Platform

A local learning platform with student and instructor registration, administrator sign-in, course browsing, enrollment, and protected course management. The application uses Next.js, Express, and MySQL.

## Features

- Course catalog with keyword search, category and level filters, and price sorting.
- Course details with instructor, lessons, assignments, and quizzes.
- Student self-registration and sign-in with private enrollment dashboards.
- Instructor applications that require admin approval, plus one-time admin invitations.
- Administrator sign-in and protected instructor/course management.
- Student enrollment with duplicate and invalid-reference feedback.
- Course create, read, update, and delete screens backed by MySQL; only admins can change courses.
- Passwords stored as salted scrypt hashes and seven-day opaque sessions in HttpOnly cookies.
- Client and server validation, loading and empty states, and readable API errors.
- Responsive layouts for small and wide screens.

## Requirements

- Node.js 20 or newer and npm.
- MySQL 8.x with the existing `online_learning_platform` schema and data.

## Run locally

1. Keep the existing MySQL database and its data in place. Do not import the supplied dump over an existing database.
2. In `backend`, copy `.env.example` to `.env` and set the connection values for the existing database. Never commit `.env`.
3. Apply the additive authentication migration once from the repository root. It creates only new authentication tables and preserves existing rows:

   ```sh
   mysql -u YOUR_MYSQL_USER -p online_learning_platform < database/migrations/001_auth.sql
   ```

4. Create the first administrator. Temporarily set `ADMIN_EMAIL` and `ADMIN_PASSWORD` (at least 12 characters) in ignored `backend/.env`, then run:

   ```sh
   cd backend
   npm install
   npm run admin:create
   ```

   Remove those two bootstrap values from `.env` after the account is created. Admin signup is not available on the public site. To add another admin later, use a controlled database operation or a separately authenticated admin-management process.

5. Install and start the API:

   ```sh
   npm run dev
   ```

6. In a second terminal, optionally set `NEXT_PUBLIC_API_URL` if the API is not at its default local address. Install and start the web app:

   ```sh
   cd frontend
   npm install
   npm run dev
   ```

7. Open <http://localhost:3000>. The API health endpoint is <http://127.0.0.1:5001/api/health>.

## Tests and checks

```sh
cd backend && npm test
cd ../frontend && npm run lint && npm run build
```

Backend tests cover validation, password hashing, session-cookie settings, role checks, and student enrollment ownership without changing MySQL data. A successful build or unit test does not by itself verify the live database migration or connection.

## Database safety

`database/schema.sql` documents the project schema and contains destructive `DROP TABLE IF EXISTS` statements from the original dump. Treat it as a reference for an empty disposable database only; do not run it against the existing local database. The app does not seed, migrate, or reset database contents during startup. Apply `database/migrations/001_auth.sql` manually once; it is additive and leaves existing tables and records untouched. Course deletion is protected by foreign keys and returns a conflict when related records exist.

See [the ERD](database/ERD.md) for tables, keys, and relationships. The two `page.js` files serve different routes: `frontend/src/app/page.js` is the catalog at `/`, while `frontend/src/app/courses/[id]/page.js` is the dynamic course details route at `/courses/:id`.

## Access control

- Students can see only their own enrollments and can enroll only themselves. The student directory endpoint is admin-only.
- Only admins can create, update, or delete courses, review instructor applications, and create invitations.
- Instructors can see only courses assigned to their instructor profile. Public instructor signup remains pending until an admin approves it.
- Public signup supports students and instructors, but not admins. The first admin is bootstrapped from the local CLI after applying the migration.
- Session identifiers are random, stored only as SHA-256 hashes in MySQL, and sent in HttpOnly, SameSite=Lax cookies. Production mode also sets Secure. Keep the frontend and API on the same site for local cookie behavior.
- Login and signup endpoints have per-IP in-memory throttling. For public deployment, use a shared rate limiter and HTTPS, and review operational controls before production use.

## Prototype limitations

- This remains a local classroom prototype without payment processing or production hosting controls.
- Student self-registration creates a new student record; it does not claim or attach an existing student record by email.
- Course deletion can be blocked by linked lessons, assessments, enrollments, payments, or certificates.
- The repository does not contain a database backup or student dataset. Keep those local and outside Git.

## Project structure

```text
backend/       Express API, MySQL pool, route validation, and tests
database/      Existing SQL schema reference and ERD
frontend/      Next.js app router interface
```
