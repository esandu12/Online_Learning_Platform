# LearnSpace Online Learning Platform

LearnSpace is a local online learning platform for browsing courses, enrolling as a student, teaching courses as an instructor, and managing platform access as an administrator. It is built with Next.js, Express, and MySQL.

## Features

- Browse courses and filter by text, category, and level; sort by course name or price.
- View course details, instructor information, lessons, assignments, and quizzes.
- Create student accounts and view a personal profile and course enrollments.
- Apply for instructor access. An administrator must approve the application before the instructor can sign in.
- Request administrator access. The main administrator reviews contact details and, if approved, issues a one-time password setup invitation.
- Invite instructors with a one-time link. Administrator invitations are limited to the main admin and expire after seven days.
- Create and manage courses. Instructors can manage their own courses; administrators can manage all courses.
- Use protected role-based dashboards and account navigation.
- Store passwords as salted scrypt hashes and use seven-day sessions in HttpOnly cookies.

## Technology

- Web: Next.js 16, React 19, and Tailwind CSS 4
- API: Node.js and Express 5
- Database: MySQL
- Runtime: Node.js 20.9 or newer and npm

## Run locally

### 1. Prepare the existing database

Use the existing `online_learning_platform` database. The reference dump at `database/schema.sql` contains `DROP TABLE` statements; do not import it over a database that contains data.

From the repository root, apply the additive authentication migrations in order. The third migration records the earliest active administrator as the main admin if an owner has not already been recorded:

```sh
mysql -u YOUR_MYSQL_USER -p online_learning_platform < database/migrations/001_auth.sql
mysql -u YOUR_MYSQL_USER -p online_learning_platform < database/migrations/002_admin_invitations.sql
mysql -u YOUR_MYSQL_USER -p online_learning_platform < database/migrations/003_admin_access_requests.sql
```

These migrations add authentication and invitation tables. They do not replace or delete the existing course, student, or instructor records. The database must already contain the base platform tables, including `student` and `instructor`.

### 2. Configure the API

Create `backend/.env` from the example and set the MySQL connection values:

```sh
cd backend
cp .env.example .env
```

Set `DB_HOST`, `DB_USER`, `DB_PASSWORD`, and `DB_NAME` in `backend/.env`. The default API port is `5001`; the default allowed web origin is `http://localhost:3000`. Keep `.env` private and never commit it.

### 3. Install dependencies and create the first administrator

In the `backend` directory, install packages:

```sh
npm ci
```

Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `backend/.env`. The password must be at least 12 characters. Create the first administrator:

```sh
npm run admin:create
```

After success, remove the temporary `ADMIN_EMAIL` and `ADMIN_PASSWORD` values from `.env`. The first administrator is created by this local command; public requests for administrator access cannot create the first administrator without an existing administrator to review them.

### 4. Start the API

From `backend`:

```sh
npm run dev
```

The API starts at `http://localhost:5001`. Its health check is `http://localhost:5001/api/health`.

### 5. Start the web app

In a second terminal, from the repository root:

```sh
cd frontend
npm ci
npm run dev
```

Open `http://localhost:3000`. The web app uses `http://localhost:5001/api` by default. To use another API URL, set `NEXT_PUBLIC_API_URL` before starting or building the frontend. For example:

```sh
NEXT_PUBLIC_API_URL=http://localhost:5001/api npm run dev
```

## Account workflows

- **Student:** Register from Create account. A student account is activated immediately and the user is signed in.
- **Instructor:** Register as an instructor. The application appears in the administrator dashboard. The instructor can sign in after an administrator approves it.
- **Administrator:** Request administrator access from Create account. The request appears in the main administrator dashboard. Approval issues a seven-day one-time invitation tied to the submitted email; the applicant sets a password before an active account is created.
- **Invitations:** Administrators can create instructor invitations. Only the main administrator can create administrator invitations. Invitation links expire after seven days and can be used once.
- **Sign-in:** After instructor approval, use the email and password set during application. After administrator approval, use the invitation link to set a password, then sign in. The navigation bar displays the signed-in account and its role dashboard while moving between pages.

## Role permissions

- Students can enroll in courses and view their own enrollments.
- Instructors can view and manage courses assigned to their instructor profile.
- Administrators can review pending instructor requests and manage all courses. Only the main administrator can review administrator access requests, issue admin invitations, and approve those invitations.
- API endpoints check the authenticated session and the required role. The server does not trust a role supplied by the browser.

## Development checks

Run the backend tests:

```sh
cd backend
npm test
```

Run the frontend lint and production build:

```sh
cd frontend
npm run lint
npm run build
```

The backend tests cover validation, password hashing, session settings, role protections, and enrollment access. These checks do not apply database migrations or verify a live MySQL connection; test database-backed workflows with a development database.

## Database and security notes

- Do not run `database/schema.sql` against a database with data. It includes destructive `DROP TABLE IF EXISTS` statements and is for reference or a disposable database only.
- Apply `database/migrations/001_auth.sql` and `database/migrations/002_admin_invitations.sql` manually, once, and in order. The app does not migrate, seed, reset, or back up database records on startup.
- Student registration creates a new student record. It does not claim or connect an existing student row with the same email.
- Course deletion can be rejected when related lessons, assessments, enrollments, payments, or certificates exist.
- Sessions expire after seven days. Session identifiers are random; only their hashes are stored in MySQL. Cookies are HttpOnly and SameSite=Lax; production mode also sets Secure.
- Login and registration endpoints use in-memory per-IP throttling. Before public deployment, use HTTPS and review rate limiting, secrets, backups, monitoring, and database access controls.

## Project layout

```text
backend/       Express API, authentication, MySQL access, and tests
database/      SQL schema reference, migrations, and ERD
frontend/      Next.js web application
```

See `database/ERD.md` for the database relationships. The course catalog is `/`; course detail pages use `/courses/:id`.
