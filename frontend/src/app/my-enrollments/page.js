
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiRequest } from "../../lib/api";

export default function MyEnrollmentsPage() {
  const [students, setStudents] = useState([]);
  const [studentId, setStudentId] = useState("");
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadStudents() {
      try {
        const data = await apiRequest("/enrollments/students");
        setStudents(data);
      } catch (err) {
        setError(err.message);
      }
    }

    loadStudents();
  }, []);

  useEffect(() => {
    if (!studentId) return;

    const controller = new AbortController();

    async function loadEnrollments() {
      setLoading(true);
      setError("");
      setEnrollments([]);

      try {
        const data = await apiRequest(
          `/enrollments/students/${encodeURIComponent(studentId)}`,
          { signal: controller.signal }
        );
        setEnrollments(data);
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadEnrollments();
    return () => controller.abort();
  }, [studentId]);

  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-900">
      <div className="mx-auto max-w-5xl">
        <Link href="/" className="text-blue-600 hover:underline">
          ← Back to Course Catalog
        </Link>

        <h1 className="mt-6 text-3xl font-bold">My Enrollments</h1>
        <p className="mt-2 text-slate-500">
          View the courses enrolled in by a student.
        </p>

        <section className="mt-8 rounded-xl border bg-white p-6">
          <label htmlFor="student" className="block font-medium">
            Select Student
          </label>

          <select
            id="student"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            className="mt-3 w-full rounded-lg border bg-white p-3"
          >
            <option value="">Choose a student</option>
            {students.map((student) => (
              <option key={student.student_id} value={student.student_id}>
                {student.first_name} {student.last_name}
                {" "}({student.student_id})
              </option>
            ))}
          </select>
        </section>

        {error && (
          <p role="alert" className="mt-6 text-red-600">{error}</p>
        )}

        {loading && <p className="mt-6">Loading enrollments...</p>}

        {!loading && !error && studentId && (
          <section className="mt-8">
            <h2 className="mb-5 text-2xl font-bold">
              Enrolled Courses ({enrollments.length})
            </h2>

            {enrollments.length === 0 ? (
              <p>No enrolled courses found for this student.</p>
            ) : (
              <div className="grid gap-5 md:grid-cols-2">
                {enrollments.map((enrollment) => (
                  <article
                    key={enrollment.course_id}
                    className="rounded-xl border bg-white p-6 shadow-sm"
                  >
                    <h3 className="text-xl font-bold">
                      {enrollment.course_name}
                    </h3>

                    <p className="mt-3 text-slate-600">
                      Level: {enrollment.level}
                    </p>

                    <p className="mt-1 text-slate-600">
                      Duration: {enrollment.duration}
                    </p>

                    <p className="mt-1 text-slate-600">
                      Enrolled: {
                        enrollment.enrollment_date
                          ? String(enrollment.enrollment_date).slice(0, 10)
                          : "Not specified"
                      }
                    </p>

                    <Link
                      href={`/courses/${enrollment.course_id}`}
                      className="mt-5 inline-block rounded-lg bg-blue-600 px-5 py-3 text-white"
                    >
                      View Course
                    </Link>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
