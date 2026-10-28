
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiRequest } from "../../../lib/api";

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
              const enrollments = await apiRequest(
                "/enrollments/me",
                { signal: controller.signal }
              );

              if (!controller.signal.aborted) {
                setAlreadyEnrolled(
                  enrollments.some(
                    (item) => item.course_id === courseId
                  )
                );
              }
            } catch (err) {
              if (!controller.signal.aborted) {
                setEnrollmentError(
                  err.message || "Could not check enrollment"
                );
              }
            }
          }
        } catch (err) {
          if (!controller.signal.aborted) {
            setUser(null);
          }
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(
            err.message || "Unable to load course details"
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    if (courseId) {
      loadPage();
    }

    return () => controller.abort();
  }, [courseId]);

  async function handleEnrollment() {
    if (!user || user.role !== "student") {
      setEnrollmentError(
        "Please sign in with a student account."
      );
      return;
    }

    if (alreadyEnrolled || enrolling) return;

    setEnrolling(true);
    setEnrollmentMessage("");
    setEnrollmentError("");

    try {
      const result = await apiRequest("/enrollments", {
        method: "POST",
        body: JSON.stringify({
          course_id: courseId,
        }),
      });

      setAlreadyEnrolled(true);
      setEnrollmentMessage(
        result.message || "Successfully enrolled!"
      );
    } catch (err) {
      const message =
        err.message || "Could not enroll in this course";

      setEnrollmentError(message);

      if (/already enrolled/i.test(message)) {
        setAlreadyEnrolled(true);
      }
    } finally {
      setEnrolling(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 p-10">
        Loading course details...
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-slate-50 p-10">
        <p className="text-red-600">{error}</p>

        <Link href="/" className="text-blue-600">
          Back to courses
        </Link>
      </main>
    );
  }

  if (!data?.course) {
    return (
      <main className="p-10">
        Course not found.
      </main>
    );
  }

  const {
    course,
    lessons = [],
    assignments = [],
    quizzes = [],
  } = data;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b bg-white px-6 py-5">
        <div className="mx-auto flex max-w-5xl justify-between gap-4">
          <Link href="/" className="text-blue-600">
            ← All Courses
          </Link>

          <Link
            href="/my-enrollments"
            className="text-blue-600"
          >
            My Enrollments
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-5xl space-y-8 px-6 py-10">

        {/* Course Information */}
        <section className="rounded-2xl bg-slate-900 p-8 text-white">
          <p className="text-sm text-blue-300">
            {course.category_name}
          </p>

          <h1 className="mt-3 text-4xl font-bold">
            {course.course_name}
          </h1>

          <p className="mt-4 text-slate-300">
            Instructor: {course.instructor_name}
          </p>

          {course.specialization && (
            <p className="mt-2 text-sm text-slate-400">
              Specialization: {course.specialization}
            </p>
          )}

          <div className="mt-6 flex flex-wrap gap-4">
            <span className="rounded-lg bg-slate-800 px-4 py-2">
              {course.level}
            </span>

            <span className="rounded-lg bg-slate-800 px-4 py-2">
              {course.duration}
            </span>

            <span className="rounded-lg bg-blue-600 px-4 py-2 font-bold">
              LKR {Number(course.price).toLocaleString()}
            </span>
          </div>
        </section>

        {/* Enrollment */}
        <section className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-2xl font-bold">
            Enroll in This Course
          </h2>

          {!user ? (
            <div>
              <p className="mb-4 text-slate-600">
                Sign in as a student to enroll.
              </p>

              <Link
                href="/login"
                className="inline-block rounded-lg bg-blue-600 px-6 py-3 font-medium text-white"
              >
                Sign in to Enroll
              </Link>
            </div>
          ) : user.role !== "student" ? (
            <p className="rounded-lg bg-amber-50 p-4 text-amber-800">
              Enrollment is available for student accounts only.
              You are signed in as {user.role}.
            </p>
          ) : (
            <div>
              <p className="mb-2 text-slate-600">
                Signed in as:
              </p>

              <p className="mb-5 font-semibold">
                {user.name || user.email}
              </p>

              <button
                type="button"
                onClick={handleEnrollment}
                disabled={enrolling || alreadyEnrolled}
                className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {enrolling
                  ? "Enrolling..."
                  : alreadyEnrolled
                    ? "Already Enrolled"
                    : "Enroll Now"}
              </button>
            </div>
          )}

          {enrollmentMessage && (
            <p
              role="status"
              className="mt-4 rounded-lg bg-green-50 p-3 text-green-700"
            >
              {enrollmentMessage}
            </p>
          )}

          {enrollmentError && (
            <p
              role="alert"
              className="mt-4 rounded-lg bg-red-50 p-3 text-red-700"
            >
              {enrollmentError}
            </p>
          )}
        </section>

        {/* Lessons */}
        <section className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-2xl font-bold">
            Course Lessons ({lessons.length})
          </h2>

          {lessons.length === 0 ? (
            <p>No lessons available yet.</p>
          ) : (
            <div className="space-y-3">
              {lessons.map((lesson, index) => (
                <div
                  key={lesson.lesson_id}
                  className="rounded-lg border p-4"
                >
                  <p className="font-semibold">
                    {index + 1}. {lesson.lesson_title}
                  </p>

                  <p className="text-sm text-slate-500">
                    {lesson.lesson_duration}
                  </p>

                  {lesson.lesson_url && (
                    <a
                      href={lesson.lesson_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-block text-blue-600"
                    >
                      View Lesson
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Assignments */}
        <section className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-2xl font-bold">
            Assignments ({assignments.length})
          </h2>

          {assignments.length === 0 ? (
            <p>No assignments available.</p>
          ) : (
            <div className="space-y-3">
              {assignments.map((assignment) => (
                <div
                  key={assignment.assignment_id}
                  className="rounded-lg border p-4"
                >
                  <p className="font-semibold">
                    {assignment.assignment_title}
                  </p>

                  <p className="mt-2 text-sm text-slate-500">
                    Deadline:{" "}
                    {assignment.deadline
                      ? new Date(
                          assignment.deadline
                        ).toLocaleDateString()
                      : "Not specified"}
                  </p>

                  <p className="mt-1 text-sm">
                    Maximum Marks: {assignment.marks}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Quizzes */}
        <section className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-2xl font-bold">
            Quizzes ({quizzes.length})
          </h2>

          {quizzes.length === 0 ? (
            <p>No quizzes available.</p>
          ) : (
            <div className="space-y-3">
              {quizzes.map((quiz) => (
                <div
                  key={quiz.quiz_id}
                  className="rounded-lg border p-4"
                >
                  <p className="font-semibold">
                    Quiz {quiz.quiz_id}
                  </p>

                  <p className="mt-2 text-sm text-slate-500">
                    Duration: {quiz.duration}
                  </p>

                  <p className="mt-1 text-sm">
                    Total Marks: {quiz.total_marks}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
