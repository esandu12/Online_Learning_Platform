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
  return <main className="app-page"><div className="app-container">
    <header className="flex flex-col gap-5 border-b border-slate-200/80 pb-6 sm:flex-row sm:items-center sm:justify-between"><div><Link href="/" className="text-sm font-semibold text-indigo-700 no-underline">← Course catalog</Link><p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-indigo-600">Teaching workspace</p><h1 className="page-title mt-2">Instructor dashboard</h1><p className="subtle-copy mt-2">Create and update the courses you teach.</p></div><AccountMenu /></header>
    <AccountProfile />
    <section className="panel mt-7"><h2 className="section-title">Your courses ({courses.length})</h2>
      {error && <p role="alert" className="mt-4 text-red-700">{error}</p>}
      {!error && courses.length === 0 && <p className="mt-4 text-slate-600">No courses are assigned to your account yet.</p>}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">{courses.map((course) => <article key={course.course_id} className="rounded-xl border border-slate-200 bg-slate-50/70 p-5"><h3 className="font-semibold">{course.course_name}</h3><p className="mt-1 text-sm text-slate-600">{course.category_name || "Course"} · {course.level || "All levels"}</p><Link className="mt-4 inline-block font-semibold text-indigo-700 no-underline" href={`/courses/${encodeURIComponent(course.course_id)}`}>View course →</Link></article>)}</div>
    </section>
  </div></main>;
}

export default function InstructorDashboard() { return <AuthGate roles={["instructor"]}><InstructorContent /></AuthGate>; }
