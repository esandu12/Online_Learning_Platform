
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiRequest } from "../../../lib/api";

export default function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [courseCount, setCourseCount] = useState(0);
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

        const courses = await apiRequest("/courses");

        if (active) {
          setUser(session.user);
          setCourseCount(courses.length);
        }
      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => { active = false; };
  }, []);

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

      <div className="flex flex-wrap gap-3">
        <Link
          href="/admin/courses"
          className="rounded-xl bg-indigo-700 px-5 py-3 font-semibold text-white no-underline shadow-sm transition hover:bg-indigo-800"
        >
          Manage All Courses
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
