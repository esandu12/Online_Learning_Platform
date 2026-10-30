
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiRequest } from "../../../lib/api";

export default function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [courseCount, setCourseCount] = useState(0);
  const [pendingAccounts, setPendingAccounts] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [approvingId, setApprovingId] = useState("");
  const [notice, setNotice] = useState("");
  const [approvalError, setApprovalError] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const session = await apiRequest("/auth/me");

        if (session.user?.role !== "admin") {
          throw new Error("Administrator access required");
        }

        const [courses, pending] = await Promise.all([
          apiRequest("/courses"),
          apiRequest("/auth/admin/pending-accounts"),
        ]);

        if (active) {
          setUser(session.user);
          setCourseCount(courses.length);
          setPendingAccounts(pending);
        }
      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    const interval = window.setInterval(() => {
      apiRequest("/auth/admin/pending-accounts").then((pending) => {
        if (active) setPendingAccounts(pending);
      }).catch(() => {});
    }, 30_000);
    return () => { active = false; window.clearInterval(interval); };
  }, []);

  async function refreshPending() {
    setRefreshing(true);
    setApprovalError("");
    try {
      setPendingAccounts(await apiRequest("/auth/admin/pending-accounts"));
    } catch (err) {
      setApprovalError(err.message);
    } finally {
      setRefreshing(false);
    }
  }

  async function approve(account) {
    setApprovingId(account.account_id);
    setApprovalError("");
    setNotice("");
    try {
      await apiRequest(`/auth/admin/accounts/${encodeURIComponent(account.account_id)}/approve`, { method: "POST" });
      setPendingAccounts((current) => current.filter((item) => item.account_id !== account.account_id));
      setNotice(`${account.role === "admin" ? "Administrator access" : "Instructor application"} approved. They can sign in now.`);
    } catch (err) {
      setApprovalError(err.message);
    } finally {
      setApprovingId("");
    }
  }

  if (loading) return <main className="app-page" role="status"><div className="app-container panel">Loading your dashboard…</div></main>;
  if (error) return <main className="app-page"><div className="app-container rounded-xl border border-red-200 bg-red-50 p-4 text-red-800" role="alert">{error}</div></main>;

  return (
    <main className="app-page">
      <div className="app-container space-y-6">
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950 via-indigo-900 to-violet-800 p-7 text-white shadow-lg shadow-indigo-950/10 sm:p-9">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-200">Platform workspace</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
          Welcome, {user.name || user.email}
        </h1>
        <p className="mt-2">Role: Admin</p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="panel">
          <p className="text-slate-500">Total Courses</p>
          <p className="mt-2 text-4xl font-bold">{courseCount}</p>
        </div>
        <div className="panel">
          <p className="text-slate-500">Administrator Email</p>
          <p className="mt-2 font-semibold">{user.email}</p>
        </div>
      </div>

      <section className="panel" aria-labelledby="requests-heading">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-indigo-600">Account access</p>
            <h2 id="requests-heading" className="mt-1 text-xl font-bold text-slate-900">Pending requests</h2>
          </div>
          <span className={`rounded-full px-3 py-1 text-sm font-semibold ${pendingAccounts.length ? "bg-amber-100 text-amber-900" : "bg-slate-100 text-slate-600"}`} aria-live="polite">
            {pendingAccounts.length} waiting
          </span>
          <button type="button" onClick={refreshPending} disabled={refreshing} className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60">
            {refreshing ? "Checking…" : "Refresh"}
          </button>
        </div>
        {pendingAccounts.length === 0 ? (
          <p className="mt-5 rounded-xl bg-slate-50 p-4 text-slate-600">There are no instructor applications or administrator access requests waiting for review.</p>
        ) : (
          <ul className="mt-5 divide-y divide-slate-100">
            {pendingAccounts.map((account) => (
              <li key={account.account_id} className="flex flex-col gap-4 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900">{account.display_name || account.email}</p>
                  <p className="mt-1 break-all text-sm text-slate-600">{account.email}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {account.role === "admin" ? "Administrator access request" : "Instructor application"}
                    {account.specialization ? ` · ${account.specialization}` : ""}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => approve(account)}
                  disabled={Boolean(approvingId)}
                  className="shrink-0 rounded-xl bg-indigo-700 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-indigo-800 disabled:cursor-wait disabled:opacity-60"
                >
                  {approvingId === account.account_id ? "Approving…" : "Approve request"}
                </button>
              </li>
            ))}
          </ul>
        )}
        {approvalError && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800" role="alert">{approvalError}</p>}
        {notice && <p className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800" role="status">{notice}</p>}
      </section>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/admin/courses"
          className="rounded-xl bg-indigo-700 px-5 py-3 font-semibold text-white no-underline shadow-sm transition hover:bg-indigo-800"
        >
          Manage All Courses
        </Link>

        <Link
          href="/dashboard/admin"
          className="rounded-xl border border-slate-200 bg-white px-5 py-3 font-semibold text-slate-700 no-underline transition hover:bg-indigo-50/50"
        >
          Invitation tools
        </Link>

        <Link
          href="/"
          className="rounded-xl border border-slate-200 bg-white px-5 py-3 font-semibold text-slate-700 no-underline transition hover:bg-indigo-50/50"
        >
          View Catalog
        </Link>
      </div>
      </div>
    </main>
  );
}
