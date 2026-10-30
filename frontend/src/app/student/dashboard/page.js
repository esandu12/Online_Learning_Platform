
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiRequest } from "../../../lib/api";

export default function StudentDashboard() {
  const [user, setUser] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const session = await apiRequest("/auth/me");

        if (session.user?.role !== "student") {
          throw new Error("Student access required");
        }

        const enrolled = await apiRequest("/enrollments/me");

        if (active) {
          setUser(session.user);
          setCourses(enrolled);
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

  if (error) {
    return <main className="app-page"><div className="app-container rounded-xl border border-red-200 bg-red-50 p-4 text-red-800" role="alert">{error}</div></main>;
  }

  return (
    <main className="app-page">
      <div className="app-container space-y-6">
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950 via-indigo-900 to-violet-800 p-7 text-white shadow-lg shadow-indigo-950/10 sm:p-9">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-200">Student dashboard</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
          Welcome, {user.name || user.email}
        </h1>
        <p className="mt-2">Role: Student</p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="panel">
          <p className="text-slate-500">Enrolled Courses</p>
          <p className="mt-2 text-4xl font-bold">{courses.length}</p>
        </div>
        <div className="panel">
          <p className="text-slate-500">My Account</p>
          <p className="mt-2 font-semibold">{user.email}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/"
          className="rounded-xl bg-indigo-700 px-5 py-3 font-semibold text-white no-underline shadow-sm transition hover:bg-indigo-800"
        >
          Browse Courses
        </Link>
        <Link
          href="/my-enrollments"
          className="rounded-xl border border-slate-200 bg-white px-5 py-3 font-semibold text-slate-700 no-underline transition hover:bg-indigo-50/50"
        >
          Manage My Enrollments
        </Link>
      </div>

      <section>
        <h2 className="section-title mb-4">My courses</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {courses.map((course) => (
            <div key={course.course_id} className="panel">
              <h3 className="text-lg font-semibold">{course.course_name}</h3>
              <p className="mt-1 text-slate-500">{course.level}</p>
              <Link
                href={`/courses/${encodeURIComponent(course.course_id)}`}
                className="mt-4 inline-block font-semibold text-indigo-700 no-underline hover:text-indigo-900"
              >
                View Course
              </Link>
            </div>
          ))}
        </div>
      </section>
      </div>
    </main>
  );
}
