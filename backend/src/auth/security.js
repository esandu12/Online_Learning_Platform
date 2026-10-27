const { randomBytes, randomInt, scrypt, timingSafeEqual, createHash } = require("node:crypto");
const { promisify } = require("node:util");

const scryptAsync = promisify(scrypt);
const PASSWORD_MIN = 12;

function normalizeEmail(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function validateEmail(value) {
  const email = normalizeEmail(value);
  // Existing student and instructor profile tables allow at most 100 characters.
  return email.length <= 100 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePassword(value) {
  return typeof value === "string" && value.length >= PASSWORD_MIN && value.length <= 128;
}

function validateBirthDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value && parsed <= new Date();
}

async function hashPassword(password) {
  const salt = randomBytes(16);
  const derived = await scryptAsync(password, salt, 64, { N: 16384, r: 8, p: 1 });
  return `scrypt$${salt.toString("hex")}$${derived.toString("hex")}`;
}

async function verifyPassword(password, stored) {
  if (typeof password !== "string" || typeof stored !== "string") return false;
  const [algorithm, saltHex, hashHex, extra] = stored.split("$");
  if (algorithm !== "scrypt" || !saltHex || !hashHex || extra || !/^[a-f0-9]{32}$/.test(saltHex) || !/^[a-f0-9]{128}$/.test(hashHex)) return false;
  const expected = Buffer.from(hashHex, "hex");
  const actual = await scryptAsync(password, Buffer.from(saltHex, "hex"), expected.length, { N: 16384, r: 8, p: 1 });
  return timingSafeEqual(expected, actual);
}

function createSessionToken() {
  const token = randomBytes(32).toString("base64url");
  return { token, hash: hashSessionToken(token) };
}

function hashSessionToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

function createProfileId(prefix) {
  return `${prefix}${randomInt(0, 0x10000000).toString(16).padStart(7, "0")}`;
}

function safeUser(row) {
  return {
    id: row.account_id,
    email: row.email,
    role: row.role,
    status: row.status,
    profileId: row.student_id || row.instructor_id || null,
    name: row.display_name || null,
  };
}

module.exports = {
  PASSWORD_MIN,
  normalizeEmail,
  validateEmail,
  validatePassword,
  validateBirthDate,
  hashPassword,
  verifyPassword,
  createSessionToken,
  hashSessionToken,
  createProfileId,
  safeUser,
};
