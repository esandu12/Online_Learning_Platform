require("dotenv").config();
const { randomUUID } = require("node:crypto");
const db = require("../config/db");
const { normalizeEmail, validateEmail, validatePassword, hashPassword } = require("../auth/security");

async function main() {
  const email = normalizeEmail(process.env.ADMIN_EMAIL);
  const password = process.env.ADMIN_PASSWORD;
  if (!validateEmail(email) || !validatePassword(password)) {
    throw new Error("Set ADMIN_EMAIL to a valid address and ADMIN_PASSWORD to at least 12 characters in backend/.env before running this command.");
  }
  const [existing] = await db.execute("SELECT account_id FROM auth_user WHERE email=?", [email]);
  if (existing.length) throw new Error("An account already uses that email; no account was changed.");
  const passwordHash = await hashPassword(password);
  const accountId = randomUUID();
  await db.execute(
    `INSERT INTO auth_user (account_id, email, password_hash, role, status)
     VALUES (?, ?, ?, 'admin', 'active')`,
    [accountId, email, passwordHash]
  );
  await db.execute("INSERT IGNORE INTO auth_admin_owner (owner_id, account_id) VALUES (1, ?)", [accountId]);
  process.stdout.write(`Administrator account created for ${email}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
}).finally(() => db.end());
