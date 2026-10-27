const { hashSessionToken } = require("./security");
const db = require("../config/db");
const attempts = new Map();

const COOKIE_NAME = "olp_session";

function readCookie(header, name) {
  if (typeof header !== "string") return null;
  for (const part of header.split(";")) {
    const index = part.indexOf("=");
    if (index < 0 || part.slice(0, index).trim() !== name) continue;
    try { return decodeURIComponent(part.slice(index + 1).trim()); } catch { return null; }
  }
  return null;
}

function sessionCookie(token, maxAgeSeconds) {
  const parts = [`${COOKIE_NAME}=${encodeURIComponent(token)}`, "Path=/", "HttpOnly", "SameSite=Lax", `Max-Age=${maxAgeSeconds}`];
  if (process.env.NODE_ENV === "production") parts.push("Secure");
  return parts.join("; ");
}

function clearSessionCookie() {
  const parts = [`${COOKIE_NAME}=`, "Path=/", "HttpOnly", "SameSite=Lax", "Max-Age=0"];
  if (process.env.NODE_ENV === "production") parts.push("Secure");
  return parts.join("; ");
}

async function authenticate(req, res, next) {
  try {
    const token = readCookie(req.headers.cookie, COOKIE_NAME);
    if (!token || token.length > 100) return res.status(401).json({ error: "Authentication required" });
    const [rows] = await db.execute(
      `SELECT u.account_id, u.email, u.role, u.status, u.student_id, u.instructor_id,
              CASE WHEN u.role='student' THEN CONCAT(s.first_name, ' ', s.last_name)
                   WHEN u.role='instructor' THEN i.instructor_name ELSE 'Administrator' END AS display_name
       FROM auth_session a JOIN auth_user u ON u.account_id=a.account_id
       LEFT JOIN student s ON s.student_id=u.student_id
       LEFT JOIN instructor i ON i.instructor_id=u.instructor_id
       WHERE a.session_id=? AND a.expires_at > UTC_TIMESTAMP() AND u.status='active'`,
      [hashSessionToken(token)]
    );
    if (!rows.length) return res.status(401).json({ error: "Session expired. Please sign in again." });
    req.user = rows[0];
    return next();
  } catch (error) {
    return next(error);
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: "Authentication required" });
    if (!roles.includes(req.user.role)) return res.status(403).json({ error: "You do not have permission to do that" });
    return next();
  };
}

function canViewStudentEnrollments(user, studentId) {
  return Boolean(user && (user.role === "admin" || (user.role === "student" && user.student_id === studentId)));
}

function rateLimitAuth({ maximum = 12, windowMs = 15 * 60 * 1000 } = {}) {
  return (req, res, next) => {
    const now = Date.now();
    const key = req.ip || req.socket.remoteAddress || "unknown";
    if (attempts.size > 5000) {
      for (const [address, entry] of attempts) if (entry.resetAt <= now) attempts.delete(address);
    }
    const current = attempts.get(key);
    if (!current || current.resetAt <= now) {
      attempts.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }
    if (current.count >= maximum) {
      res.setHeader("Retry-After", String(Math.max(1, Math.ceil((current.resetAt - now) / 1000))));
      return res.status(429).json({ error: "Too many authentication attempts. Please try again later." });
    }
    current.count += 1;
    return next();
  };
}

function requireSameOrigin(req, res, next) {
  const origin = req.get("Origin");
  if (origin && origin !== (process.env.FRONTEND_ORIGIN || "http://localhost:3000")) {
    return res.status(403).json({ error: "Request origin is not allowed" });
  }
  return next();
}

module.exports = { COOKIE_NAME, authenticate, requireRole, canViewStudentEnrollments, rateLimitAuth, requireSameOrigin, sessionCookie, clearSessionCookie, readCookie };
