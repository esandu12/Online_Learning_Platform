
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiRequest } from "../../lib/api";

export default function MyEnrollmentsPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [unauthorized, setUnauthorized] = useState(false);


async function unenroll(courseId) {
  if (!window.confirm("Are you sure you want to unenroll?")) {
    return;
  }

  try {
    setError("");

    await apiRequest(
      `/enrollments/${encodeURIComponent(courseId)}`,
      { method: "DELETE" }
    );

    setCourses((previous) =>
      previous.filter((course) => course.course_id !== courseId)
    );
  } catch (err) {
    setError(err.message || "Unable to unenroll");
  }
}


  useEffect(() => {
    let active = true;

    async function loadEnrollments() {
      try {
        const session = await apiRequest("/auth/me");

        if (session.user?.role !== "student") {
          if (active) setUnauthorized(true);
          return;
        }

        const results = await apiRequest("/enrollments/me");

        if (active) setCourses(results);
      } catch (err) {
        if (active) {
          setError(err.message || "Failed to load enrollments");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadEnrollments();

    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="app-page">
      <div className="app-container">
        <Link href="/" className="text-sm font-semibold text-indigo-700 no-underline hover:text-indigo-900">
          ← Course catalog
        </Link>

        <p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-indigo-600">Your learning</p>
        <h1 className="page-title mt-2">
          My enrollments
        </h1>

        {loading ? (
          <p className="panel mt-6" role="status">Loading your enrollments…</p>
        ) : unauthorized ? (
          <p className="panel mt-6">
            Please sign in as a student to view enrollments.
          </p>
        ) : error ? (
          <div role="alert" className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">
            {error}
            <div className="mt-3">
            <Link href="/login" className="font-semibold text-indigo-700">
                Sign in
              </Link>
            </div>
          </div>
        ) : courses.length === 0 ? (
          <p className="panel mt-6 text-center text-slate-600">
            You have not enrolled in any courses yet.
          </p>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {courses.map((course) => (
              
              <div
                key={course.course_id}
                className="panel"
              >
                <h2 className="text-xl font-bold">
                  {course.course_name}
                </h2>
                <button
                  type="button"
                  onClick={() => unenroll(course.course_id)}
                  className="mt-3 rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-50"
                >
                  Unenroll
                </button>
                <p className="mt-2 text-slate-600">
                  Instructor: {course.instructor_name}
                </p>

                <p className="mt-1 text-slate-600">
                  Level: {course.level}
                </p>

                <Link
                  href={`/courses/${encodeURIComponent(course.course_id)}`}
                  className="mt-4 inline-block font-semibold text-indigo-700 no-underline hover:text-indigo-900"
                >
                  View Course
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
