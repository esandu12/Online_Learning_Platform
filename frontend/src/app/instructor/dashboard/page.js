
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiRequest } from "../../../lib/api";

export default function InstructorDashboard() {
  const [user, setUser] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const session = await apiRequest("/auth/me");

        if (session.user?.role !== "instructor") {
          throw new Error("Instructor access required");
        }

        const results = await apiRequest("/auth/instructor/courses");

        if (active) {
          setUser(session.user);
          setCourses(results);
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
      <section className="rounded-2xl bg-indigo-800 p-8 text-white">
        <p className="text-indigo-200">Instructor Dashboard</p>
        <h1 className="mt-2 text-3xl font-bold">
          Welcome, {user.name || user.email}
        </h1>
        <p className="mt-2">Role: Instructor</p>
      </section>

      <div className="rounded-xl border bg-white p-6">
        <p className="text-slate-500">Courses I Teach</p>
        <p className="mt-2 text-4xl font-bold">{courses.length}</p>
      </div>

      <section>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-bold">My Teaching Courses</h2>
          <Link
            href="/instructor/courses"
            className="rounded-lg bg-indigo-600 px-5 py-3 text-white"
          >
            Manage My Courses
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {courses.map((course) => (
            <div key={course.course_id} className="rounded-xl border bg-white p-5">
              <h3 className="text-lg font-semibold">{course.course_name}</h3>
              <p className="mt-2 text-slate-500">
                {course.level} · {course.duration}
              </p>
              <Link
                href={`/courses/${encodeURIComponent(course.course_id)}`}
                className="mt-4 inline-block text-indigo-600"
              >
                View Course
              </Link>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
