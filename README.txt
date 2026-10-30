LEARNSPACE ONLINE LEARNING PLATFORM
===================================

LearnSpace is a local online learning platform for browsing courses, enrolling as a student, teaching courses as an instructor, and managing platform access as an administrator. It is built with Next.js, Express, and MySQL.

FEATURES
--------
- Browse courses and filter by text, category, and level; sort by course name or price.
- View course details, instructor information, lessons, assignments, and quizzes.
- Create student accounts and view a personal profile and course enrollments.
- Apply for instructor access. An administrator must approve the application before the instructor can sign in.
- Request administrator access. An existing administrator must approve the request before the new account can sign in.
- Invite instructors or administrators with a one-time invitation link that expires after seven days.
- Create and manage courses. Instructors can manage their own courses; administrators can manage all courses.
- Use protected role-based dashboards and account navigation.
- Store passwords as salted scrypt hashes and use seven-day sessions in HttpOnly cookies.

TECHNOLOGY
----------
- Web: Next.js 16, React 19, and Tailwind CSS 4
- API: Node.js and Express 5
- Database: MySQL
- Runtime: Node.js 20.9 or newer and npm

RUN LOCALLY
-----------

1. PREPARE THE EXISTING DATABASE

Use the existing online_learning_platform database. The reference dump at database/schema.sql contains DROP TABLE statements; do not import it over a database that contains data.

From the repository root, apply the two additive authentication migrations once, in order:

  mysql -u YOUR_MYSQL_USER -p online_learning_platform < database/migrations/001_auth.sql
  mysql -u YOUR_MYSQL_USER -p online_learning_platform < database/migrations/002_admin_invitations.sql

These migrations add authentication and invitation tables. They do not replace or delete the existing course, student, or instructor records. The database must already contain the base platform tables, including student and instructor.

2. CONFIGURE THE API

Create backend/.env from the example and set the MySQL connection values:

  cd backend
  cp .env.example .env

Set DB_HOST, DB_USER, DB_PASSWORD, and DB_NAME in backend/.env. The default API port is 5001; the default allowed web origin is http://localhost:3000. Keep .env private and never commit it.

3. INSTALL DEPENDENCIES AND CREATE THE FIRST ADMINISTRATOR

In the backend directory, install packages:

  npm ci

Set ADMIN_EMAIL and ADMIN_PASSWORD in backend/.env. The password must be at least 12 characters. Create the first administrator:

  npm run admin:create

After success, remove the temporary ADMIN_EMAIL and ADMIN_PASSWORD values from .env. The first administrator is created by this local command; public requests for administrator access cannot create the first administrator without an existing administrator to review them.

4. START THE API

From backend:

  npm run dev

The API starts at http://localhost:5001. Its health check is http://localhost:5001/api/health.

5. START THE WEB APP

In a second terminal, from the repository root:

  cd frontend
  npm ci
  npm run dev

Open http://localhost:3000. The web app uses http://localhost:5001/api by default. To use another API URL, set NEXT_PUBLIC_API_URL before starting or building the frontend. For example:

  NEXT_PUBLIC_API_URL=http://localhost:5001/api npm run dev

ACCOUNT WORKFLOWS
-----------------
- Student: Register from Create account. A student account is activated immediately and the user is signed in.
- Instructor: Register as an instructor. The application appears in the administrator dashboard. The instructor can sign in after an administrator approves it.
- Administrator: Request administrator access from Create account. The request appears in the administrator dashboard and remains pending until an existing administrator approves it.
- Invitations: An administrator can also create one-time instructor or administrator invitations from the invitation tools. Invitation links expire after seven days.
- Sign-in: After approval, use the same email and password used when requesting access. The navigation bar displays the signed-in account and its role dashboard while moving between pages.

ROLE PERMISSIONS
----------------
- Students can enroll in courses and view their own enrollments.
- Instructors can view and manage courses assigned to their instructor profile.
- Administrators can review pending instructor and administrator requests and manage all courses.
- API endpoints check the authenticated session and the required role. The server does not trust a role supplied by the browser.

DEVELOPMENT CHECKS
------------------
Run backend tests:

  cd backend
  npm test

Run frontend lint and a production build:

  cd frontend
  npm run lint
  npm run build

The backend tests cover validation, password hashing, session settings, role protections, and enrollment access. These checks do not apply database migrations or verify a live MySQL connection; test database-backed workflows with a development database.

DATABASE AND SECURITY NOTES
---------------------------
- Do not run database/schema.sql against a database with data. It includes destructive DROP TABLE IF EXISTS statements and is for reference or a disposable database only.
- Apply database/migrations/001_auth.sql and database/migrations/002_admin_invitations.sql manually, once, and in order. The app does not migrate, seed, reset, or back up database records on startup.
- Student registration creates a new student record. It does not claim or connect an existing student row with the same email.
- Course deletion can be rejected when related lessons, assessments, enrollments, payments, or certificates exist.
- Sessions expire after seven days. Session identifiers are random; only their hashes are stored in MySQL. Cookies are HttpOnly and SameSite=Lax; production mode also sets Secure.
- Login and registration endpoints use in-memory per-IP throttling. Before public deployment, use HTTPS and review rate limiting, secrets, backups, monitoring, and database access controls.

PROJECT LAYOUT
--------------
  backend/       Express API, authentication, MySQL access, and tests
  database/      SQL schema reference, migrations, and ERD
  frontend/      Next.js web application

See database/ERD.md for the database relationships. The course catalog is /; course detail pages use /courses/:id.
