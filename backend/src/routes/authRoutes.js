const express = require("express");
const { randomUUID } = require("node:crypto");
const db = require("../config/db");
const {
  normalizeEmail, validateEmail, validatePassword, validateBirthDate, hashPassword, verifyPassword,
  createSessionToken, createProfileId, safeUser,
} = require("../auth/security");
const {
  authenticate, requireRole, requireSameOrigin, sessionCookie, clearSessionCookie,
  rateLimitAuth,
} = require("../auth/middleware");

const router = express.Router();
const SESSION_DAYS = 7;

function sendValidationError(res, message) {
  return res.status(400).json({ error: message });
}

async function createSession(accountId, res) {
  const { token, hash } = createSessionToken();
  await db.execute(
    "INSERT INTO auth_session (session_id, account_id, expires_at) VALUES (?, ?, DATE_ADD(UTC_TIMESTAMP(), INTERVAL 7 DAY))",
    [hash, accountId]
  );
  res.setHeader("Set-Cookie", sessionCookie(token, SESSION_DAYS * 24 * 60 * 60));
}

router.post("/students/signup", rateLimitAuth(), requireSameOrigin, async (req, res, next) => {
  const { firstName, lastName, birthDate, email: rawEmail, password } = req.body || {};
  const email = normalizeEmail(rawEmail);
  if (typeof firstName !== "string" || firstName.trim().length < 1 || firstName.trim().length > 50 ||
      typeof lastName !== "string" || lastName.trim().length < 1 || lastName.trim().length > 50 ||
      !validateBirthDate(birthDate) || !validateEmail(email) || !validatePassword(password)) {
    return sendValidationError(res, "Enter a valid name, date of birth, email, and password (at least 12 characters).");
  }
  try {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      const [existing] = await connection.execute("SELECT student_id FROM student WHERE LOWER(email)=?", [email]);
      const [accounts] = await connection.execute("SELECT account_id FROM auth_user WHERE email=?", [email]);
      if (existing.length || accounts.length) {
        await connection.rollback();
        return res.status(409).json({ error: "An account or student record already uses this email" });
      }
      const studentId = createProfileId("STU");
      const accountId = randomUUID();
      const passwordHash = await hashPassword(password);
      await connection.execute(
        `INSERT INTO student (student_id, student_bd, first_name, last_name, email)
         VALUES (?, ?, ?, ?, ?)`,
        [studentId, birthDate, firstName.trim(), lastName.trim(), email]
      );
      await connection.execute(
        `INSERT INTO auth_user (account_id, email, password_hash, role, status, student_id)
         VALUES (?, ?, ?, 'student', 'active', ?)`,
        [accountId, email, passwordHash, studentId]
      );
      await connection.commit();
      await createSession(accountId, res);
      return res.status(201).json({ user: { id: accountId, email, role: "student", status: "active", profileId: studentId, name: `${firstName.trim()} ${lastName.trim()}` } });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") return res.status(409).json({ error: "An account or student record already uses this email" });
    return next(error);
  }
});

router.post("/instructors/signup", rateLimitAuth(), requireSameOrigin, async (req, res, next) => {
  const { name, specialization = "", email: rawEmail, password } = req.body || {};
  const email = normalizeEmail(rawEmail);
  if (typeof name !== "string" || name.trim().length < 2 || name.trim().length > 100 ||
      typeof specialization !== "string" || specialization.trim().length > 100 ||
      !validateEmail(email) || !validatePassword(password)) {
    return sendValidationError(res, "Enter a valid name, specialization, email, and password (at least 12 characters).");
  }
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const [accounts] = await connection.execute("SELECT account_id FROM auth_user WHERE email=?", [email]);
    const [profiles] = await connection.execute("SELECT instructor_id FROM instructor WHERE LOWER(email)=?", [email]);
    if (accounts.length || profiles.length) {
      await connection.rollback();
      return res.status(409).json({ error: "An account or instructor record already uses this email" });
    }
    const instructorId = createProfileId("INS");
    const accountId = randomUUID();
    const passwordHash = await hashPassword(password);
    await connection.execute(
      "INSERT INTO instructor (instructor_id, instructor_name, email, specialization) VALUES (?, ?, ?, ?)",
      [instructorId, name.trim(), email, specialization.trim() || null]
    );
    await connection.execute(
      `INSERT INTO auth_user (account_id, email, password_hash, role, status, instructor_id)
       VALUES (?, ?, ?, 'instructor', 'pending', ?)`,
      [accountId, email, passwordHash, instructorId]
    );
    await connection.commit();
    return res.status(202).json({ message: "Your instructor application is waiting for administrator approval." });
  } catch (error) {
    await connection.rollback();
    if (error.code === "ER_DUP_ENTRY") return res.status(409).json({ error: "An account or instructor record already uses this email" });
    return next(error);
  } finally {
    connection.release();
  }
});

router.post("/login", rateLimitAuth({ maximum: 8 }), requireSameOrigin, async (req, res, next) => {
  const email = normalizeEmail(req.body?.email);
  const password = req.body?.password;
  if (!validateEmail(email) || typeof password !== "string" || password.length > 128) {
    return sendValidationError(res, "Enter a valid email and password.");
  }
  try {
    const [rows] = await db.execute("SELECT * FROM auth_user WHERE email=? LIMIT 1", [email]);
    const user = rows[0];
    if (!user || !(await verifyPassword(password, user.password_hash))) {
      return res.status(401).json({ error: "Email or password is incorrect" });
    }
    if (user.status === "pending") return res.status(403).json({ error: "Your instructor account is waiting for administrator approval." });
    if (user.status !== "active") return res.status(403).json({ error: "This account is disabled. Contact an administrator." });
    await createSession(user.account_id, res);
    return res.json({ user: safeUser(user) });
  } catch (error) {
    return next(error);
  }
});

router.get("/me", authenticate, (req, res) => res.json({ user: safeUser(req.user) }));

router.post("/logout", requireSameOrigin, async (req, res, next) => {
  res.setHeader("Set-Cookie", clearSessionCookie());
  try {
    const token = require("../auth/middleware").readCookie(req.headers.cookie, "olp_session");
    if (token) {
      const { hashSessionToken } = require("../auth/security");
      await db.execute("DELETE FROM auth_session WHERE session_id=?", [hashSessionToken(token)]);
    }
    return res.json({ message: "Signed out" });
  } catch (error) { return next(error); }
});

router.post("/invitations", authenticate, requireRole("admin"), requireSameOrigin, async (req, res, next) => {
  const email = normalizeEmail(req.body?.email);
  if (!validateEmail(email)) return sendValidationError(res, "Enter a valid instructor email.");
  try {
    const [existing] = await db.execute("SELECT account_id FROM auth_user WHERE email=?", [email]);
    const [profiles] = await db.execute("SELECT instructor_id FROM instructor WHERE LOWER(email)=?", [email]);
    if (existing.length || profiles.length) return res.status(409).json({ error: "An account or instructor record already uses this email" });
    const { randomBytes, createHash } = require("node:crypto");
    const token = randomBytes(32).toString("base64url");
    const tokenHash = createHash("sha256").update(token).digest("hex");
    await db.execute(
      `INSERT INTO instructor_invitation (invitation_id, email, token_hash, expires_at, created_by)
       VALUES (?, ?, ?, DATE_ADD(UTC_TIMESTAMP(), INTERVAL 7 DAY), ?)`,
      [randomUUID(), email, tokenHash, req.user.account_id]
    );
    return res.status(201).json({ invitation: `${process.env.FRONTEND_ORIGIN || "http://localhost:3000"}/invitations/accept?token=${token}`, expiresInDays: 7 });
  } catch (error) { return next(error); }
});

router.post("/invitations/accept", rateLimitAuth(), requireSameOrigin, async (req, res, next) => {
  const token = req.body?.token;
  const { name, specialization = "", password } = req.body || {};
  if (typeof token !== "string" || token.length > 100 || typeof name !== "string" || name.trim().length < 2 || name.trim().length > 100 ||
      typeof specialization !== "string" || specialization.trim().length > 100 || !validatePassword(password)) {
    return sendValidationError(res, "Enter a valid name and password (at least 12 characters).");
  }
  const { createHash } = require("node:crypto");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.execute(
      "SELECT invitation_id, email FROM instructor_invitation WHERE token_hash=? AND accepted_at IS NULL AND expires_at > UTC_TIMESTAMP() FOR UPDATE",
      [tokenHash]
    );
    if (!rows.length) { await connection.rollback(); return res.status(400).json({ error: "This invitation is invalid, expired, or already used" }); }
    const invitation = rows[0];
    const instructorId = createProfileId("INS");
    const accountId = randomUUID();
    const passwordHash = await hashPassword(password);
    await connection.execute(
      "INSERT INTO instructor (instructor_id, instructor_name, email, specialization) VALUES (?, ?, ?, ?)",
      [instructorId, name.trim(), invitation.email, specialization.trim() || null]
    );
    await connection.execute(
      `INSERT INTO auth_user (account_id, email, password_hash, role, status, instructor_id)
       VALUES (?, ?, ?, 'instructor', 'active', ?)`,
      [accountId, invitation.email, passwordHash, instructorId]
    );
    await connection.execute("UPDATE instructor_invitation SET accepted_at=UTC_TIMESTAMP() WHERE invitation_id=?", [invitation.invitation_id]);
    await connection.commit();
    await createSession(accountId, res);
    return res.status(201).json({ user: { id: accountId, email: invitation.email, role: "instructor", status: "active", profileId: instructorId, name: name.trim() } });
  } catch (error) {
    await connection.rollback();
    if (error.code === "ER_DUP_ENTRY") return res.status(409).json({ error: "An instructor account already uses this email" });
    return next(error);
  } finally { connection.release(); }
});

router.get("/admin/instructors", authenticate, requireRole("admin"), async (req, res, next) => {
  try {
    const [rows] = await db.execute(
      `SELECT u.account_id, u.email, u.status, u.created_at, i.instructor_id, i.instructor_name, i.specialization
       FROM auth_user u JOIN instructor i ON i.instructor_id=u.instructor_id
       WHERE u.role='instructor' ORDER BY u.created_at DESC`
    );
    return res.json(rows);
  } catch (error) { return next(error); }
});

router.post("/admin/instructors/:accountId/approve", authenticate, requireRole("admin"), requireSameOrigin, async (req, res, next) => {
  try {
    const [result] = await db.execute(
      "UPDATE auth_user SET status='active' WHERE account_id=? AND role='instructor' AND status='pending'",
      [req.params.accountId]
    );
    if (!result.affectedRows) return res.status(404).json({ error: "Pending instructor application not found" });
    return res.json({ message: "Instructor approved" });
  } catch (error) { return next(error); }
});

router.get("/instructor/courses", authenticate, requireRole("instructor"), async (req, res, next) => {
  try {
    const [rows] = await db.execute(
      `SELECT c.course_id, c.course_name, c.level, c.duration, c.price, cat.category_name
       FROM course c LEFT JOIN category cat ON cat.category_id=c.category_id
       WHERE c.instructor_id=? ORDER BY c.course_name`,
      [req.user.instructor_id]
    );
    return res.json(rows);
  } catch (error) { return next(error); }
});

module.exports = router;
