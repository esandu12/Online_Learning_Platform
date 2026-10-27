# Online Learning Platform

A local academic prototype for browsing courses, viewing course content, enrolling an existing student, reviewing enrollments, and managing courses with full CRUD operations. The application uses Next.js, Express, and MySQL.

## Features

- Course catalog with keyword search, category and level filters, and price sorting.
- Course details with instructor, lessons, assignments, and quizzes.
- Student enrollment with duplicate and invalid-reference feedback.
- Enrollment lookup by student.
- Course create, read, update, and delete screens backed by MySQL.
- Client and server validation, loading and empty states, and readable API errors.
- Responsive layouts for small and wide screens.

## Requirements

- Node.js 20 or newer and npm.
- MySQL 8.x with the existing `online_learning_platform` schema and data.

## Run locally

1. Keep the existing MySQL database and its data in place. Do not import the supplied dump over an existing database.
2. In `backend`, copy `.env.example` to `.env` and set the connection values for the existing database. Never commit `.env`.
3. Install and start the API:

   ```sh
   cd backend
   npm install
   npm run dev
   ```

4. In a second terminal, optionally copy `frontend/.env.example` to `frontend/.env.local` and set `NEXT_PUBLIC_API_URL` if the API is not at its default local address.
5. Install and start the web app:

   ```sh
   cd frontend
   npm install
   npm run dev
   ```

6. Open <http://localhost:3000>. The API health endpoint is <http://127.0.0.1:5001/api/health>.

## Tests and checks

```sh
cd backend && npm test
cd ../frontend && npm run lint && npm run build
```

Backend tests cover course and enrollment input validation without connecting to or changing MySQL data. A successful build or unit test does not by itself verify a live database connection.

## Database safety

`database/schema.sql` documents the project schema and contains destructive `DROP TABLE IF EXISTS` statements from the original dump. Treat it as a reference for an empty disposable database only; do not run it against the existing local database. The app does not seed, migrate, reset, or delete database contents during startup. Course deletion is protected by foreign keys and returns a conflict when related records exist.

See [the ERD](database/ERD.md) for tables, keys, and relationships. The two `page.js` files serve different routes: `frontend/src/app/page.js` is the catalog at `/`, while `frontend/src/app/courses/[id]/page.js` is the dynamic course details route at `/courses/:id`.

## Prototype limitations

- This is a local classroom prototype. It does not include authentication, authorization, payment processing, or production deployment controls.
- Enrollment uses a selected existing student. Student names and IDs are available to the local UI and must not be exposed publicly.
- Course deletion can be blocked by linked lessons, assessments, enrollments, payments, or certificates.
- The repository does not contain a database backup or student dataset. Keep those local and outside Git.

## Project structure

```text
backend/       Express API, MySQL pool, route validation, and tests
database/      Existing SQL schema reference and ERD
frontend/      Next.js app router interface
```
