
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiRequest } from "../../../lib/api";

export default function CourseDetailsClient({ courseId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [enrollmentMessage, setEnrollmentMessage] = useState("");
  const [enrollmentError, setEnrollmentError] = useState("");
  const [enrolling, setEnrolling] = useState(false);

  // Load course details
  useEffect(() => {
    if (!courseId) return;

    const controller = new AbortController();

    async function loadDetails() {
      setLoading(true);
      setError("");
      setData(null);

      try {
        const result = await apiRequest(
          `/courses/${encodeURIComponent(courseId)}/details`,
          { signal: controller.signal }
        );

        if (!controller.signal.aborted) {
          setData(result);
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err.message || "Unable to load course details");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadDetails();

    return () => controller.abort();
  }, [courseId]);

  // Load students for enrollment
  useEffect(() => {
    const controller = new AbortController();

    async function loadStudents() {
      try {
        const result = await apiRequest(
          "/enrollments/students",
          { signal: controller.signal }
        );

        if (!controller.signal.aborted) {
          setStudents(result);
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setEnrollmentError(
            err.message || "Unable to load students"
          );
        }
      }
    }

    loadStudents();

    return () => controller.abort();
  }, []);

  // Enroll selected student
  async function handleEnrollment() {
    if (!selectedStudent || !courseId || enrolling) {
      setEnrollmentError("Please select a student.");
      return;
    }

    setEnrolling(true);
    setEnrollmentMessage("");
    setEnrollmentError("");

    try {
      const result = await apiRequest("/enrollments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          student_id: selectedStudent,
          course_id: courseId,
        }),
      });

      setEnrollmentMessage(
        result.message || "Student enrolled successfully!"
      );
    } catch (err) {
      setEnrollmentError(
        err.message || "Failed to enroll student"
      );
    } finally {
      setEnrolling(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 p-10 text-slate-900">
        Loading course details...
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-slate-50 p-10">
        <p role="alert" className="text-red-600">
          {error}
        </p>

        <Link href="/" className="mt-5 inline-block text-blue-600">
          ← Back to Courses
        </Link>
      </main>
    );
  }

  if (!data || !data.course) {
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

      {/* Navigation */}
      <header className="border-b bg-white px-6 py-5">
        <div className="mx-auto flex max-w-5xl flex-wrap justify-between gap-4">
          <Link
            href="/"
            className="font-medium text-blue-600 hover:underline"
          >
            ← All Courses
          </Link>

          <Link
            href="/my-enrollments"
            className="font-medium text-blue-600 hover:underline"
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

        {/* Student Enrollment */}
        <section className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-2xl font-bold">
            Enroll in This Course
          </h2>

          <p className="mb-5 text-sm text-slate-500">
            Select an existing student and enroll in this course.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row">
            <select
              value={selectedStudent}
              onChange={(e) => {
                setSelectedStudent(e.target.value);
                setEnrollmentMessage("");
                setEnrollmentError("");
              }}
              aria-label="Select Student"
              className="flex-1 rounded-lg border border-slate-300 bg-white p-3"
            >
              <option value="">Select Student</option>

              {students.map((student) => (
                <option
                  key={student.student_id}
                  value={student.student_id}
                >
                  {student.first_name} {student.last_name}
                  {" "}({student.student_id})
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={handleEnrollment}
              disabled={enrolling || !selectedStudent}
              className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {enrolling ? "Enrolling..." : "Enroll Now"}
            </button>
          </div>

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

        {/* Course Lessons */}
        <section className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-2xl font-bold">
            Course Lessons ({lessons.length})
          </h2>

          {lessons.length === 0 ? (
            <p className="text-slate-500">
              No lessons available yet.
            </p>
          ) : (
            <div className="space-y-3">
              {lessons.map((lesson, index) => (
                <div
                  key={lesson.lesson_id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4"
                >
                  <div>
                    <p className="font-semibold">
                      {index + 1}. {lesson.lesson_title}
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      {lesson.lesson_duration}
                    </p>
                  </div>

                  {lesson.lesson_url && (
                    <a
                      href={lesson.lesson_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg bg-blue-50 px-4 py-2 font-medium text-blue-600 hover:bg-blue-100"
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
            <p className="text-slate-500">
              No assignments available.
            </p>
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
            <p className="text-slate-500">
              No quizzes available.
            </p>
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
