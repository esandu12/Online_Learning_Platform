
const readline = require("node:readline/promises");
const { stdin, stdout } = require("node:process");
const db = require("../config/db");
const {
  hashPassword,
  validatePassword,
} = require("../auth/security");

const ADMIN_EMAIL = "esanduliyana@gmail.com";

async function main() {
  if (!stdin.isTTY) {
    throw new Error("Run this script in an interactive terminal.");
  }

  const rl = readline.createInterface({
    input: stdin,
    output: stdout,
  });

  try {
    const confirmation = await rl.question(
      `Reset password for ${ADMIN_EMAIL}? Type RESET: `
    );

    if (confirmation.trim() !== "RESET") {
      console.log("Cancelled.");
      return;
    }

    const password = await rl.question(
      "New admin password (minimum 12 characters): "
    );

    if (!validatePassword(password)) {
      throw new Error(
        "Password must contain 12–128 characters."
      );
    }

    const passwordHash = await hashPassword(password);

    const [result] = await db.execute(
      `UPDATE auth_user
       SET password_hash = ?
       WHERE email = ?
         AND role = 'admin'
         AND status = 'active'`,
      [passwordHash, ADMIN_EMAIL]
    );

    if (result.affectedRows !== 1) {
      throw new Error("Active admin account not found.");
    }

    await db.execute(
      `DELETE FROM auth_session
       WHERE account_id = (
         SELECT account_id
         FROM auth_user
         WHERE email = ? AND role = 'admin'
       )`,
      [ADMIN_EMAIL]
    );

    console.log("Admin password reset successfully.");
  } finally {
    rl.close();
  }
}

main()
  .catch((error) => {
    console.error("Password reset failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.end();
  });
