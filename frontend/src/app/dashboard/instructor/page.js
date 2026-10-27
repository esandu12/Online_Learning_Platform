"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AuthGate from "../../../components/AuthGate";
import AccountMenu from "../../../components/AccountMenu";
import AccountProfile from "../../../components/AccountProfile";
import { apiRequest } from "../../../lib/api";

function InstructorContent() {
  const [courses, setCourses] = useState([]);
  const [error, setError] = useState("");
  useEffect(() => { apiRequest("/auth/instructor/courses").then(setCourses).catch((err) => setError(err.message)); }, []);
  return <main className="min-h-screen bg-slate-50 p-6 text-slate-900"><div className="mx-auto max-w-5xl">
    <header className="flex items-center justify-between"><div><Link href="/" className="text-sm text-indigo-700">Course catalog</Link><h1 className="mt-2 text-3xl font-bold">Instructor dashboard</h1></div><AccountMenu /></header>
    <AccountProfile />
    <section className="mt-8 rounded-2xl border bg-white p-7 shadow-sm"><h2 className="text-xl font-semibold">Your courses ({courses.length})</h2>
      {error && <p role="alert" className="mt-4 text-red-700">{error}</p>}
      {!error && courses.length === 0 && <p className="mt-4 text-slate-600">No courses are assigned to your account yet.</p>}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">{courses.map((course) => <article key={course.course_id} className="rounded-xl border p-5"><h3 className="font-semibold">{course.course_name}</h3><p className="mt-1 text-sm text-slate-600">{course.category_name || "Course"} · {course.level || "All levels"}</p><Link className="mt-4 inline-block text-indigo-700" href={`/courses/${encodeURIComponent(course.course_id)}`}>View course →</Link></article>)}</div>
    </section>
  </div></main>;
}

export default function InstructorDashboard() { return <AuthGate roles={["instructor"]}><InstructorContent /></AuthGate>; }
