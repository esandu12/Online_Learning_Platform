require("dotenv").config();
const db = require("../config/db");
const { normalizeEmail, validateEmail, validatePassword, hashPassword } = require("../auth/security");

async function main() {
  const email = normalizeEmail(process.env.ADMIN_EMAIL);
  const password = process.env.ADMIN_PASSWORD;
  if (!validateEmail(email) || !validatePassword(password)) {
    throw new Error("Set ADMIN_EMAIL and ADMIN_PASSWORD (at least 12 characters) in backend/.env, then retry.");
  }

  const passwordHash = await hashPassword(password);
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.execute(
      "SELECT account_id FROM auth_user WHERE email=? AND role='admin' AND status='active' FOR UPDATE",
      [email]
    );
    if (!rows.length) {
      throw new Error("No active administrator account exists for ADMIN_EMAIL.");
    }
    const accountId = rows[0].account_id;
    await connection.execute("UPDATE auth_user SET password_hash=? WHERE account_id=?", [passwordHash, accountId]);
    await connection.execute("DELETE FROM auth_session WHERE account_id=?", [accountId]);
    await connection.commit();
    process.stdout.write("Administrator password updated and existing sessions revoked.\n");
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

main().catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
}).finally(() => db.end());
