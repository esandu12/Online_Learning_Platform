const test = require("node:test");
const assert = require("node:assert/strict");
const app = require("../src/server");

function findRoute(prefix, method, routePath, mountRouteHint) {
  const mounts = app.router.stack.filter((layer) => layer.handle?.stack?.some((item) => item.route?.path === routePath && item.route.methods[method.toLowerCase()]));
  const mount = (mountRouteHint && mounts.find((layer) => layer.handle.stack.some((item) => item.route?.path === mountRouteHint))) || mounts.find((layer) => layer.handle.stack.some((item) => item.route?.path === routePath && item.route.methods[method.toLowerCase()] && item.route.stack?.some((middleware) => middleware.handle.name === "authenticate"))) || mounts.find((layer) => layer.handle.stack.some((item) => item.route?.path === routePath && item.route.methods[method.toLowerCase()]));
  assert.ok(mount, `${method} ${prefix}${routePath} route is registered`);
  return {
    route: mount.handle.stack.find((item) => item.route?.path === routePath && item.route.methods[method.toLowerCase()]).route,
    mount,
  };
}

function runUnauthenticatedGuard(found) {
  const guards = found.route.stack.map((item) => item.handle);
  const mountGuards = found.mount.handle.stack.filter((item) => !item.route).map((item) => item.handle);
  const guard = [...mountGuards, ...guards].find((middleware) => middleware.name === "authenticate");
  assert.equal(guard.name, "authenticate", "route starts with authentication middleware");
  let statusCode;
  let payload;
  let nextCalled = false;
  const response = {
    status(code) { statusCode = code; return this; },
    json(value) { payload = value; return this; },
  };
  guard({ headers: {} }, response, () => { nextCalled = true; });
  assert.equal(statusCode, 401);
  assert.equal(payload.error, "Authentication required");
  assert.equal(nextCalled, false);
}

function runWrongRoleGuard(found, role) {
  const guards = found.route.stack.map((item) => item.handle);
  const mountGuards = found.mount.handle.stack.filter((item) => !item.route).map((item) => item.handle);
  const ordered = [...mountGuards, ...guards];
  const authenticateIndex = ordered.findIndex((middleware) => middleware.name === "authenticate");
  const guard = ordered[authenticateIndex + 1];
  assert.equal(typeof guard, "function", "route has a role check after authentication");
  let statusCode;
  let nextCalled = false;
  const response = { status(code) { statusCode = code; return this; }, json() { return this; } };
  guard({ user: { role } }, response, () => { nextCalled = true; });
  assert.equal(statusCode, 403);
  assert.equal(nextCalled, false);
}

test("course create, update, and delete routes require authentication", () => {
  runUnauthenticatedGuard(findRoute("/api/courses", "POST", "/"));
  runUnauthenticatedGuard(findRoute("/api/courses", "PUT", "/:id"));
  runUnauthenticatedGuard(findRoute("/api/courses", "DELETE", "/:id"));
});

test("course create, update, and delete routes require the administrator role", () => {
  runWrongRoleGuard(findRoute("/api/courses", "POST", "/"), "student");
  runWrongRoleGuard(findRoute("/api/courses", "PUT", "/:id"), "instructor");
  runWrongRoleGuard(findRoute("/api/courses", "DELETE", "/:id"), "student");
});

test("student directory and enrollment routes require authentication", () => {
  runUnauthenticatedGuard(findRoute("/api/enrollments", "GET", "/me", "/"));
  runUnauthenticatedGuard(findRoute("/api/enrollments", "POST", "/", "/me"));
});

test("instructors cannot access student enrollments", () => {
  runWrongRoleGuard(findRoute("/api/enrollments", "GET", "/me", "/"), "instructor");
  runWrongRoleGuard(findRoute("/api/enrollments", "POST", "/", "/me"), "instructor");
});

test("instructor approval controls require authentication", () => {
  runUnauthenticatedGuard(findRoute("/api/auth", "GET", "/admin/instructors"));
  runUnauthenticatedGuard(findRoute("/api/auth", "POST", "/admin/instructors/:accountId/approve"));
  runUnauthenticatedGuard(findRoute("/api/auth", "GET", "/admin/pending-accounts"));
  runUnauthenticatedGuard(findRoute("/api/auth", "POST", "/admin/accounts/:accountId/approve"));
});

test("instructor approval controls require the administrator role", () => {
  runWrongRoleGuard(findRoute("/api/auth", "GET", "/admin/instructors"), "student");
  runWrongRoleGuard(findRoute("/api/auth", "POST", "/admin/instructors/:accountId/approve"), "instructor");
  runWrongRoleGuard(findRoute("/api/auth", "GET", "/admin/pending-accounts"), "student");
  runWrongRoleGuard(findRoute("/api/auth", "POST", "/admin/accounts/:accountId/approve"), "instructor");
});

test("additional administrator invitations require an authenticated administrator", () => {
  const route = findRoute("/api/auth", "POST", "/admin/invitations");
  runUnauthenticatedGuard(route);
  runWrongRoleGuard(route, "student");
  runWrongRoleGuard(route, "instructor");
});
