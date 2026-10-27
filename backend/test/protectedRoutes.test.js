const test = require("node:test");
const assert = require("node:assert/strict");
const app = require("../src/server");

function findRoute(prefix, method, routePath) {
  const mount = app.router.stack.find((layer) => layer.handle?.stack?.some((item) => item.route?.path === routePath && item.route.methods[method.toLowerCase()]));
  assert.ok(mount, `${method} ${prefix}${routePath} route is registered`);
  return mount.handle.stack.find((item) => item.route?.path === routePath && item.route.methods[method.toLowerCase()]).route;
}

function runUnauthenticatedGuard(route) {
  const guard = route.stack[0].handle;
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

function runWrongRoleGuard(route, role) {
  const guard = route.stack[1]?.handle;
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
  runUnauthenticatedGuard(findRoute("/api/enrollments", "GET", "/students"));
  runUnauthenticatedGuard(findRoute("/api/enrollments", "GET", "/students/:studentId"));
  runUnauthenticatedGuard(findRoute("/api/enrollments", "POST", "/"));
});

test("student directory is admin-only and instructors cannot enroll students", () => {
  runWrongRoleGuard(findRoute("/api/enrollments", "GET", "/students"), "instructor");
  runWrongRoleGuard(findRoute("/api/enrollments", "POST", "/"), "instructor");
});

test("instructor approval controls require authentication", () => {
  runUnauthenticatedGuard(findRoute("/api/auth", "GET", "/admin/instructors"));
  runUnauthenticatedGuard(findRoute("/api/auth", "POST", "/admin/instructors/:accountId/approve"));
});

test("instructor approval controls require the administrator role", () => {
  runWrongRoleGuard(findRoute("/api/auth", "GET", "/admin/instructors"), "student");
  runWrongRoleGuard(findRoute("/api/auth", "POST", "/admin/instructors/:accountId/approve"), "instructor");
});

test("additional administrator invitations require an authenticated administrator", () => {
  const route = findRoute("/api/auth", "POST", "/admin/invitations");
  runUnauthenticatedGuard(route);
  runWrongRoleGuard(route, "student");
  runWrongRoleGuard(route, "instructor");
});
