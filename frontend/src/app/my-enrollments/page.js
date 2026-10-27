"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AuthGate from "../../components/AuthGate";
import AccountMenu from "../../components/AccountMenu";
import { apiRequest } from "../../lib/api";

function EnrollmentsContent() {
  const [enrollments, setEnrollments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [courseId, setCourseId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    const [{ user }, courseRows] = await Promise.all([apiRequest("/auth/me"), apiRequest("/courses")]);
    const rows = await apiRequest(`/enrollments/students/${encodeURIComponent(user.profileId)}`);
    setEnrollments(rows);
    setCourses(courseRows);
  }
  useEffect(() => {
    Promise.all([apiRequest("/auth/me"), apiRequest("/courses")])
      .then(async ([{ user }, courseRows]) => {
        const rows = await apiRequest(`/enrollments/students/${encodeURIComponent(user.profileId)}`);
        setEnrollments(rows);
        setCourses(courseRows);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function enroll(event) {
    event.preventDefault(); setError(""); setMessage(""); setSaving(true);
    try {
      await apiRequest("/enrollments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ course_id: courseId }) });
      await load(); setMessage("You are enrolled in this course."); setCourseId("");
    } catch (err) { setError(err.message); } finally { setSaving(false); }
  }

  return <main className="min-h-screen bg-slate-50 p-6 text-slate-900"><div className="mx-auto max-w-5xl">
    <header className="flex items-center justify-between"><div><Link href="/dashboard/student" className="text-sm text-indigo-700">← Student dashboard</Link><h1 className="mt-2 text-3xl font-bold">My enrollments</h1><p className="mt-1 text-slate-600">Only your courses are shown here.</p></div><AccountMenu /></header>
    <section className="mt-7 rounded-2xl border bg-white p-6 shadow-sm"><h2 className="text-xl font-semibold">Enroll in a course</h2><form onSubmit={enroll} className="mt-4 flex flex-col gap-3 sm:flex-row"><select required value={courseId} onChange={(e) => setCourseId(e.target.value)} className="min-w-0 flex-1 rounded-lg border bg-white p-3"><option value="">Choose a course</option>{courses.filter((course) => !enrollments.some((item) => item.course_id === course.course_id)).map((course) => <option key={course.course_id} value={course.course_id}>{course.course_name}</option>)}</select><button disabled={saving || loading} className="rounded-lg bg-indigo-700 px-5 py-3 font-semibold text-white disabled:opacity-60">{saving ? "Enrolling…" : "Enroll"}</button></form></section>
    {error && <p role="alert" className="mt-5 rounded-lg bg-red-50 p-3 text-red-800">{error}</p>}{message && <p role="status" className="mt-5 rounded-lg bg-green-50 p-3 text-green-800">{message}</p>}
    {loading && <p className="mt-6" role="status">Loading your enrollments…</p>}
    {!loading && enrollments.length === 0 && <p className="mt-6 rounded-xl border border-dashed bg-white p-8 text-center text-slate-600">You haven’t enrolled in a course yet.</p>}
    {!loading && enrollments.length > 0 && <section className="mt-7 grid gap-5 md:grid-cols-2">{enrollments.map((item) => <article key={item.course_id} className="rounded-xl border bg-white p-6 shadow-sm"><h2 className="text-xl font-bold">{item.course_name}</h2><p className="mt-2 text-slate-600">{item.level || "All levels"} · {item.duration || "Flexible duration"}</p><p className="mt-2 text-sm text-slate-500">Enrolled: {item.enrollment_date ? String(item.enrollment_date).slice(0, 10) : "Not specified"}</p><Link href={`/courses/${encodeURIComponent(item.course_id)}`} className="mt-5 inline-block rounded-lg bg-indigo-700 px-4 py-2.5 text-white">View course</Link></article>)}</section>}
  </div></main>;
}

export default function MyEnrollmentsPage() { return <AuthGate roles={["student"]}><EnrollmentsContent /></AuthGate>; }
