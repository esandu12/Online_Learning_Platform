
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const API = "http://127.0.0.1:5001/api";

export default function CourseDetailsClient({ courseId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!courseId) return;

    async function loadDetails() {
      setLoading(true);
      setError("");
      setData(null);

      try {
        const response = await fetch(
          `${API}/courses/${encodeURIComponent(courseId)}/details`
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Unable to load course");
        }

        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadDetails();
  }, [courseId]);

  if (loading) {
    return <main className="p-10">Loading course...</main>;
  }

  if (error) {
    return (
      <main className="p-10 text-red-600" role="alert">
        {error}
      </main>
    );
  }

  if (!data) return null;

  const { course, lessons, assignments, quizzes } = data;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b bg-white px-6 py-5">
        <div className="mx-auto max-w-5xl">
          <Link href="/" className="text-blue-600">
            ← All Courses
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-5xl space-y-8 px-6 py-10">
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

          <div className="mt-6 flex flex-wrap gap-4">
            <span>{course.level}</span>
            <span>{course.duration}</span>
            <span>
              LKR {Number(course.price).toLocaleString()}
            </span>
          </div>
        </section>

        <section className="rounded-xl border bg-white p-6">
          <h2 className="mb-4 text-2xl font-bold">Course Lessons</h2>

          {lessons.length === 0 ? (
            <p>No lessons available yet.</p>
          ) : (
            <div className="space-y-3">
              {lessons.map((lesson, index) => (
                <div
                  key={lesson.lesson_id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div>
                    <p className="font-semibold">
                      {index + 1}. {lesson.lesson_title}
                    </p>
                    <p className="text-sm text-slate-500">
                      {lesson.lesson_duration}
                    </p>
                  </div>

                  {lesson.lesson_url && (
                    <a
                      href={lesson.lesson_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      View Lesson
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-xl border bg-white p-6">
          <h2 className="mb-4 text-2xl font-bold">Assignments</h2>

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
                  <p className="text-sm text-slate-500">
                    Deadline:{" "}
                    {assignment.deadline
                      ? new Date(assignment.deadline).toLocaleDateString()
                      : "Not specified"}
                  </p>
                  <p className="text-sm">
                    Maximum Marks: {assignment.marks}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-xl border bg-white p-6">
          <h2 className="mb-4 text-2xl font-bold">Quizzes</h2>

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
                  <p className="text-sm text-slate-500">
                    Duration: {quiz.duration}
                  </p>
                  <p className="text-sm">
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
