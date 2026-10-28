
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

  if (loading) return <main className="p-8">Loading dashboard...</main>;
  if (error) return <main className="p-8 text-red-600">{error}</main>;

  return (
    <main className="mx-auto max-w-6xl space-y-8 px-5 py-10 text-slate-900">
      <section className="rounded-2xl bg-slate-900 p-8 text-white">
        <p className="text-indigo-300">Administrator Dashboard</p>
        <h1 className="mt-2 text-3xl font-bold">
          Welcome, {user.name || user.email}
        </h1>
        <p className="mt-2">Role: Admin</p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border bg-white p-6">
          <p className="text-slate-500">Total Courses</p>
          <p className="mt-2 text-4xl font-bold">{courseCount}</p>
        </div>
        <div className="rounded-xl border bg-white p-6">
          <p className="text-slate-500">Administrator Email</p>
          <p className="mt-2 font-semibold">{user.email}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/admin/courses"
          className="rounded-lg bg-indigo-600 px-5 py-3 text-white"
        >
          Manage All Courses
        </Link>

        <Link
          href="/"
          className="rounded-lg border bg-white px-5 py-3"
        >
          View Catalog
        </Link>
      </div>
    </main>
  );
}
