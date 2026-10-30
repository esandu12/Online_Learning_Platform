const test = require("node:test");
const assert = require("node:assert/strict");
const { createHash } = require("node:crypto");
const db = require("../src/config/db");
const { hashPassword } = require("../src/auth/security");

function makeResponse() {
  return {
    statusCode: 200, headers: {},
    setHeader(name, value) { this.headers[name.toLowerCase()] = value; },
    status(code) { this.statusCode = code; return this; },
    json(value) { this.body = value; this.ended = true; return this; },
  };
}

test("admin request reaches the main admin, who can reject or approve by one-time invite", async () => {
  const router = require("../src/routes/authRoutes");
  const originalExecute = db.execute;
  const originalGetConnection = db.getConnection;
  const owner = { account_id: "owner-account", email: "owner@example.com", role: "admin", status: "active", password_hash: await hashPassword("MainPassword!234") };
  const otherAdmin = { account_id: "other-admin", email: "other@example.com", role: "admin", status: "active", password_hash: await hashPassword("OtherPassword!234") };
  const accounts = new Map([[owner.email, owner], [otherAdmin.email, otherAdmin]]);
  const sessions = new Map();
  const requests = new Map();
  const invitations = new Map();
  let ipCount = 0;

  db.execute = async (sql, params = []) => {
    if (sql.includes("FROM auth_session a JOIN auth_user u")) {
      const accountId = sessions.get(params[0]);
      const account = [...accounts.values()].find((item) => item.account_id === accountId);
      return [account ? [{ ...account, student_id: null, instructor_id: null, display_name: "Administrator" }] : [], []];
    }
    if (sql.includes("FROM auth_admin_owner")) return [params[0] === owner.account_id ? [{ account_id: owner.account_id }] : [], []];
    if (sql.includes("FROM auth_user u LEFT JOIN student")) {
      const account = accounts.get(params[0]);
      return [[...(account ? [{ ...account, display_name: "Administrator" }] : [])], []];
    }
    if (sql.includes("FROM auth_user WHERE email=?")) return [[...(accounts.has(params[0]) ? [accounts.get(params[0])] : [])], []];
    if (sql.includes("FROM auth_user u JOIN instructor")) return [[], []];
    if (sql.includes("FROM admin_access_request WHERE status='pending'")) {
      const rows = [...requests.values()].filter((item) => item.status === "pending").map((item) => ({ ...item, account_id: item.request_id, role: "admin" }));
      return [rows, []];
    }
    if (sql.includes("INSERT INTO auth_session")) { sessions.set(params[0], params[1]); return [{ affectedRows: 1 }, []]; }
    if (sql.includes("UPDATE admin_access_request SET status='rejected'")) {
      const item = requests.get(params[1]);
      if (!item || item.status !== "pending") return [{ affectedRows: 0 }, []];
      item.status = "rejected"; item.decided_by = params[0]; return [{ affectedRows: 1 }, []];
    }
    throw new Error(`Unexpected db.execute in test: ${sql}`);
  };

  db.getConnection = async () => ({
    async beginTransaction() {}, async commit() {}, async rollback() {}, release() {},
    async execute(sql, params = []) {
      if (sql.includes("SELECT account_id FROM auth_user WHERE email=?")) return [[...(accounts.has(params[0]) ? [{ account_id: accounts.get(params[0]).account_id }] : [])], []];
      if (sql.includes("SELECT student_id FROM student WHERE LOWER(email)=?")) return [[], []];
      if (sql.includes("SELECT instructor_id FROM instructor WHERE LOWER(email)=?")) return [[], []];
      if (sql.includes("SELECT request_id FROM admin_access_request WHERE pending_email=?")) return [[...requests.values()].some((item) => item.email === params[0] && item.status === "pending") ? [{ request_id: "duplicate" }] : [], []];
      if (sql.includes("INSERT INTO admin_access_request")) {
        requests.set(params[0], { request_id: params[0], name: params[1], email: params[2], phone: params[3], reason: params[4], status: "pending", created_at: new Date().toISOString() });
        return [{ affectedRows: 1 }, []];
      }
      if (sql.includes("SELECT request_id, email, status FROM admin_access_request")) return [[...(requests.has(params[0]) ? [requests.get(params[0])] : [])], []];
      if (sql.includes("INSERT INTO admin_invitation")) {
        invitations.set(params[0], { invitation_id: params[0], email: params[1], token_hash: params[2], accepted_at: null });
        return [{ affectedRows: 1 }, []];
      }
      if (sql.includes("UPDATE admin_access_request SET status='approved'")) {
        const item = requests.get(params[2]); item.status = "approved"; item.invitation_id = params[0]; item.decided_by = params[1]; return [{ affectedRows: 1 }, []];
      }
      if (sql.includes("SELECT invitation_id, email FROM admin_invitation")) {
        const rows = [...invitations.values()].filter((item) => item.token_hash === params[0] && !item.accepted_at).map(({ invitation_id, email }) => ({ invitation_id, email }));
        return [rows, []];
      }
      if (sql.includes("INSERT INTO auth_user")) {
        const account = { account_id: params[0], email: params[1], password_hash: params[2], role: "admin", status: "active" };
        accounts.set(account.email, account); return [{ affectedRows: 1 }, []];
      }
      if (sql.includes("UPDATE admin_invitation SET accepted_at")) { invitations.get(params[0]).accepted_at = true; return [{ affectedRows: 1 }, []]; }
      if (sql.includes("INSERT INTO auth_session")) { sessions.set(params[0], params[1]); return [{ affectedRows: 1 }, []]; }
      throw new Error(`Unexpected connection.execute in test: ${sql}`);
    },
  });

  async function invoke(method, path, { body = {}, cookie = "", params = {} } = {}) {
    const layer = router.stack.find((item) => item.route?.path === path && item.route.methods[method.toLowerCase()]);
    assert.ok(layer, `route exists: ${method} ${path}`);
    const req = { body, params, headers: { cookie, origin: "http://localhost:3000" }, ip: `test-${++ipCount}`, socket: { remoteAddress: `test-${ipCount}` }, get(name) { return this.headers[name.toLowerCase()]; } };
    const res = makeResponse();
    const handlers = layer.route.stack.map((item) => item.handle);
    async function run(index) {
      if (index >= handlers.length || res.ended) return;
      await handlers[index](req, res, (error) => error ? Promise.reject(error) : run(index + 1));
    }
    await run(0);
    return res;
  }
  const login = async (email, password) => {
    const response = await invoke("post", "/login", { body: { email, password } });
    assert.equal(response.statusCode, 200);
    return response.headers["set-cookie"].split(";")[0];
  };

  try {
    const submitted = await invoke("post", "/admin/signup", { body: { name: "New Admin", email: "new-admin@example.com", phone: "+1 555 0100", reason: "Manage courses" } });
    assert.equal(submitted.statusCode, 202);
    assert.match(submitted.body.message, /main administrator/);
    assert.equal(accounts.has("new-admin@example.com"), false);

    const ownerCookie = await login(owner.email, "MainPassword!234");
    const otherCookie = await login(otherAdmin.email, "OtherPassword!234");
    const ownerPending = await invoke("get", "/admin/pending-accounts", { cookie: ownerCookie });
    const request = ownerPending.body.find((item) => item.email === "new-admin@example.com");
    assert.ok(request);
    const denied = await invoke("post", "/admin/access-requests/:requestId/approve", { cookie: otherCookie, params: { requestId: request.request_id } });
    assert.equal(denied.statusCode, 403);

    const approved = await invoke("post", "/admin/access-requests/:requestId/approve", { cookie: ownerCookie, params: { requestId: request.request_id } });
    assert.equal(approved.statusCode, 201);
    assert.equal(approved.body.email, request.email);
    assert.equal(accounts.has(request.email), false);
    const token = new URL(approved.body.invitation).searchParams.get("token");
    assert.equal([...invitations.values()][0].token_hash, createHash("sha256").update(token).digest("hex"));

    const accepted = await invoke("post", "/admin/invitations/accept", { body: { token, password: "NewAdminPassword!234" } });
    assert.equal(accepted.statusCode, 201);
    assert.equal(accounts.get(request.email).role, "admin");
    assert.equal((await login(request.email, "NewAdminPassword!234")).startsWith("olp_session="), true);
    assert.equal((await invoke("post", "/admin/invitations/accept", { body: { token, password: "AnotherPassword!234" } })).statusCode, 400);

    const rejectedSubmit = await invoke("post", "/admin/signup", { body: { name: "Second Person", email: "second@example.com", phone: "+1 555 0101" } });
    assert.equal(rejectedSubmit.statusCode, 202);
    const secondRequest = [...requests.values()].find((item) => item.email === "second@example.com");
    const rejected = await invoke("post", "/admin/access-requests/:requestId/reject", { cookie: ownerCookie, params: { requestId: secondRequest.request_id } });
    assert.equal(rejected.statusCode, 200);
    assert.equal(secondRequest.status, "rejected");
  } finally {
    db.execute = originalExecute;
    db.getConnection = originalGetConnection;
  }
});
