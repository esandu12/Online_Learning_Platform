"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiRequest } from "../../../lib/api";

function formatPrice(price) {
  const amount = Number(price);
  return Number.isFinite(amount)
    ? `LKR ${amount.toLocaleString()}`
    : "Price unavailable";
}

function SectionHeading({ eyebrow, title, count }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div>
        {eyebrow && (
          <p className="mb-1 text-xs font-bold uppercase tracking-[0.16em] text-indigo-600">
            {eyebrow}
          </p>
        )}
        <h2 className="text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">
          {title}
        </h2>
      </div>
      {typeof count === "number" && (
        <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-600">
          {count}
        </span>
      )}
    </div>
  );
}

export default function CourseDetailsClient({ courseId }) {
  const [data, setData] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [enrolling, setEnrolling] = useState(false);
  const [enrollmentMessage, setEnrollmentMessage] = useState("");
  const [enrollmentError, setEnrollmentError] = useState("");
  const [alreadyEnrolled, setAlreadyEnrolled] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function loadPage() {
      setLoading(true);
      setError("");
      setEnrollmentError("");
      setEnrollmentMessage("");

      try {
        const details = await apiRequest(
          `/courses/${encodeURIComponent(courseId)}/details`,
          { signal: controller.signal }
        );

        if (controller.signal.aborted) return;
        setData(details);

        try {
          const session = await apiRequest("/auth/me", {
            signal: controller.signal,
          });

          if (controller.signal.aborted) return;
          const currentUser = session.user;
          setUser(currentUser);

          if (currentUser?.role === "student") {
            try {
              const enrollments = await apiRequest("/enrollments/me", {
                signal: controller.signal,
              });

              if (!controller.signal.aborted) {
                setAlreadyEnrolled(
                  enrollments.some((item) => item.course_id === courseId)
                );
              }
            } catch (err) {
              if (!controller.signal.aborted) {
                setEnrollmentError(err.message || "Could not check enrollment");
              }
            }
          } else {
            setAlreadyEnrolled(false);
          }
        } catch {
          if (!controller.signal.aborted) {
            setUser(null);
            setAlreadyEnrolled(false);
          }
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err.message || "Unable to load course details");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    if (courseId) loadPage();
    return () => controller.abort();
  }, [courseId]);

  async function handleEnrollment() {
    if (!user || user.role !== "student") {
      setEnrollmentError("Please sign in with a student account.");
      return;
    }

    if (alreadyEnrolled || enrolling) return;

    setEnrolling(true);
    setEnrollmentMessage("");
    setEnrollmentError("");

    try {
      const result = await apiRequest("/enrollments", {
        method: "POST",
        body: JSON.stringify({ course_id: courseId }),
      });

      setAlreadyEnrolled(true);
      setEnrollmentMessage(result.message || "Successfully enrolled!");
    } catch (err) {
      const message = err.message || "Could not enroll in this course";
      setEnrollmentError(message);
      if (/already enrolled/i.test(message)) setAlreadyEnrolled(true);
    } finally {
      setEnrolling(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-[70vh] bg-slate-50 px-5 py-12 sm:px-8">
        <div className="mx-auto max-w-7xl animate-pulse space-y-6">
          <div className="h-5 w-36 rounded bg-slate-200" />
          <div className="h-64 rounded-3xl bg-slate-200" />
          <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
            <div className="h-80 rounded-3xl bg-white" />
            <div className="h-72 rounded-3xl bg-white" />
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="grid min-h-[65vh] place-items-center bg-slate-50 px-5 py-12">
        <section className="w-full max-w-xl rounded-3xl border border-rose-100 bg-white p-8 text-center shadow-sm">
          <span className="mx-auto mb-4 grid size-12 place-items-center rounded-2xl bg-rose-50 text-xl text-rose-600" aria-hidden="true">!</span>
          <h1 className="text-xl font-bold text-slate-950">We couldn’t load this course</h1>
          <p role="alert" className="mt-2 text-sm leading-6 text-slate-600">{error}</p>
          <Link href="/" className="mt-6 inline-flex rounded-xl bg-indigo-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-800">
            Back to courses
          </Link>
        </section>
      </main>
    );
  }

  if (!data?.course) {
    return (
      <main className="grid min-h-[65vh] place-items-center bg-slate-50 px-5 py-12">
        <section className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-bold text-slate-950">Course not found</h1>
          <p className="mt-2 text-sm text-slate-600">It may have been removed or the link may be incorrect.</p>
          <Link href="/" className="mt-6 inline-flex rounded-xl bg-indigo-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-800">
            Browse courses
          </Link>
        </section>
      </main>
    );
  }

  const { course, lessons = [], assignments = [], quizzes = [] } = data;

  return (
    <main className="min-h-screen bg-[radial-gradient(ellipse_at_top,_#eef2ff_0,_#f8fafc_32rem)] px-5 pb-16 pt-7 text-slate-900 sm:px-8 lg:pt-10">
      <div className="mx-auto max-w-7xl">
        <nav aria-label="Breadcrumb" className="mb-6 flex items-center justify-between">
          <Link href="/" className="group inline-flex items-center gap-2 rounded-lg py-2 text-sm font-semibold text-slate-600 transition hover:text-indigo-700">
            <span aria-hidden="true" className="transition-transform group-hover:-translate-x-0.5">←</span>
            All courses
          </Link>
          <span className="hidden text-sm text-slate-400 sm:inline">Course overview</span>
        </nav>

        <section className="relative isolate overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-950 via-[#172554] to-indigo-950 px-6 py-8 text-white shadow-[0_24px_70px_-30px_rgba(30,41,89,0.65)] sm:px-10 sm:py-10 lg:px-12">
          <div aria-hidden="true" className="absolute -right-24 -top-36 -z-10 size-[28rem] rounded-full border border-white/10 bg-indigo-300/10 blur-2xl" />
          <div aria-hidden="true" className="absolute right-24 top-24 -z-10 size-48 rounded-full border border-cyan-200/15" />
          <div className="grid gap-9 lg:grid-cols-[minmax(0,1fr)_270px] lg:items-center">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-indigo-200/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-indigo-100 backdrop-blur">
                  {course.category_name || "Course"}
                </span>
                {course.specialization && (
                  <span className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-medium text-slate-300">
                    {course.specialization}
                  </span>
                )}
              </div>

              <h1 className="mt-5 max-w-3xl text-3xl font-bold tracking-[-0.04em] sm:text-4xl lg:text-5xl">
                {course.course_name}
              </h1>

              <div className="mt-5 flex items-center gap-3">
                <span aria-hidden="true" className="grid size-11 shrink-0 place-items-center rounded-full bg-gradient-to-br from-cyan-200 to-indigo-300 text-sm font-bold text-slate-900">
                  {(course.instructor_name || "I").split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase()}
                </span>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Instructor</p>
                  <p className="mt-0.5 font-semibold text-white">{course.instructor_name || "Instructor"}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
              <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Level</p>
                <p className="mt-1.5 text-lg font-semibold text-white">{course.level || "Not specified"}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Duration</p>
                <p className="mt-1.5 text-lg font-semibold text-white">{course.duration || "Not specified"}</p>
              </div>
              <div className="col-span-2 rounded-2xl border border-indigo-300/20 bg-indigo-400/15 p-4 backdrop-blur lg:col-span-1">
                <p className="text-xs font-medium uppercase tracking-wider text-indigo-200">Course fee</p>
                <p className="mt-1.5 text-2xl font-bold tracking-tight text-white">{formatPrice(course.price)}</p>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-7 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-6">
            <section className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-[0_12px_35px_-28px_rgba(15,23,42,0.35)] sm:p-7">
              <SectionHeading eyebrow="Start learning" title="Course lessons" count={lessons.length} />
              {lessons.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center">
                  <p className="font-semibold text-slate-700">No lessons yet</p>
                  <p className="mt-1 text-sm text-slate-500">Lessons will appear here when the instructor adds them.</p>
                </div>
              ) : (
                <ol className="space-y-3">
                  {lessons.map((lesson, index) => (
                    <li key={lesson.lesson_id} className="group flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 transition hover:border-indigo-200 hover:bg-indigo-50/30 sm:flex-row sm:items-center">
                      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-indigo-50 text-sm font-bold text-indigo-700 ring-1 ring-indigo-100">{String(index + 1).padStart(2, "0")}</span>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-slate-900">{lesson.lesson_title}</p>
                        {lesson.lesson_duration && <p className="mt-1 text-sm text-slate-500">{lesson.lesson_duration}</p>}
                      </div>
                      {lesson.lesson_url && (
                        <a href={lesson.lesson_url} target="_blank" rel="noopener noreferrer" className="inline-flex shrink-0 items-center justify-center rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-indigo-700 transition hover:border-indigo-200 hover:bg-white">
                          View lesson <span aria-hidden="true" className="ml-2">↗</span>
                        </a>
                      )}
                    </li>
                  ))}
                </ol>
              )}
            </section>

            <section className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-[0_12px_35px_-28px_rgba(15,23,42,0.35)] sm:p-7">
              <SectionHeading eyebrow="Practice" title="Assignments" count={assignments.length} />
              {assignments.length === 0 ? (
                <p className="rounded-2xl bg-slate-50 px-5 py-6 text-sm text-slate-500">No assignments available.</p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {assignments.map((assignment) => (
                    <article key={assignment.assignment_id} className="rounded-2xl border border-slate-200/80 p-4">
                      <h3 className="font-semibold text-slate-900">{assignment.assignment_title}</h3>
                      <p className="mt-3 text-sm text-slate-500">Deadline: {assignment.deadline ? new Date(assignment.deadline).toLocaleDateString() : "Not specified"}</p>
                      <p className="mt-1 text-sm text-slate-500">Maximum marks: {assignment.marks}</p>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-[0_12px_35px_-28px_rgba(15,23,42,0.35)] sm:p-7">
              <SectionHeading eyebrow="Check your progress" title="Quizzes" count={quizzes.length} />
              {quizzes.length === 0 ? (
                <p className="rounded-2xl bg-slate-50 px-5 py-6 text-sm text-slate-500">No quizzes available.</p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {quizzes.map((quiz) => (
                    <article key={quiz.quiz_id} className="rounded-2xl border border-slate-200/80 p-4">
                      <h3 className="font-semibold text-slate-900">Quiz {quiz.quiz_id}</h3>
                      <p className="mt-3 text-sm text-slate-500">Duration: {quiz.duration}</p>
                      <p className="mt-1 text-sm text-slate-500">Total marks: {quiz.total_marks}</p>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>

          <aside className="space-y-5 lg:sticky lg:top-24">
            <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_18px_48px_-34px_rgba(15,23,42,0.45)]">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-600">Your next step</p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">Enroll in this course</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Join the course to keep it in your learning list.
              </p>

              {!user ? (
                <div className="mt-5">
                  <Link href="/login" className="inline-flex w-full items-center justify-center rounded-xl bg-indigo-700 px-5 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-800 focus-visible:outline-indigo-500">
                    Sign in to enroll
                  </Link>
                  <p className="mt-3 text-center text-xs text-slate-500">Student account required</p>
                </div>
              ) : user.role !== "student" ? (
                <p className="mt-5 rounded-2xl bg-amber-50 p-4 text-sm leading-6 text-amber-900 ring-1 ring-amber-100">
                  Enrollment is available for student accounts. You are signed in as {user.role}.
                </p>
              ) : (
                <div className="mt-5">
                  <p className="mb-3 truncate text-sm text-slate-600">Signed in as <span className="font-semibold text-slate-900">{user.name || user.email}</span></p>
                  <button type="button" onClick={handleEnrollment} disabled={enrolling || alreadyEnrolled} className="inline-flex w-full items-center justify-center rounded-xl bg-indigo-700 px-5 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-800 disabled:cursor-not-allowed disabled:bg-emerald-600">
                    {enrolling ? "Enrolling…" : alreadyEnrolled ? "✓ Enrolled" : "Enroll now"}
                  </button>
                </div>
              )}

              {enrollmentMessage && <p role="status" className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800 ring-1 ring-emerald-100">{enrollmentMessage}</p>}
              {enrollmentError && <p role="alert" className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-800 ring-1 ring-rose-100">{enrollmentError}</p>}
            </section>

            <section className="rounded-3xl border border-slate-200/80 bg-white/80 p-6">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Course at a glance</p>
              <dl className="mt-4 divide-y divide-slate-100">
                <div className="flex justify-between gap-4 py-3 text-sm">
                  <dt className="text-slate-500">Lessons</dt><dd className="font-semibold text-slate-900">{lessons.length}</dd>
                </div>
                <div className="flex justify-between gap-4 py-3 text-sm">
                  <dt className="text-slate-500">Assignments</dt><dd className="font-semibold text-slate-900">{assignments.length}</dd>
                </div>
                <div className="flex justify-between gap-4 py-3 text-sm">
                  <dt className="text-slate-500">Quizzes</dt><dd className="font-semibold text-slate-900">{quizzes.length}</dd>
                </div>
              </dl>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}

