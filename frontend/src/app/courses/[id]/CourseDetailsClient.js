
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
  const [enrolling, setEnrolling] = useState(false);

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
        setData(result);
      } catch (err) {
        if (err.name !== "AbortError") setError(err.message);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadDetails();
    return () => controller.abort();
  }, [courseId]);


useEffect(() => {
  async function loadStudents() {
    try {
      const studentsData = await apiRequest("/enrollments/students");
      setStudents(studentsData);
    } catch (err) {
      setEnrollmentMessage(err.message);
    }
  }

  loadStudents();
}, []);

async function handleEnrollment() {
  if (!selectedStudent) {
    setEnrollmentMessage("Please select a student.");
    return;
  }

  setEnrolling(true);
  setEnrollmentMessage("");

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

    setEnrollmentMessage("Student enrolled successfully!");
  } catch (err) {
    setEnrollmentMessage(err.message);
  } finally {
    setEnrolling(false);
  }
}


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
        <h2 className="mb-4 text-2xl font-bold">
            Enroll in This Course
        </h2>

        <p className="mb-4 text-sm text-slate-500">
            Select an existing student to enroll in this course.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row">
            <select
            value={selectedStudent}
            onChange={(e) => setSelectedStudent(e.target.value)}
            aria-label="Select student"
            className="flex-1 rounded-lg border bg-white p-3"
            >
            <option value="">Select Student</option>

            {students.map((student) => (
                <option
                key={student.student_id}
                value={student.student_id}
                >
                {student.first_name} {student.last_name}
                </option>
            ))}
            </select>

            <button
            type="button"
            onClick={handleEnrollment}
            disabled={enrolling || !selectedStudent}
            className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white disabled:opacity-50"
            >
            {enrolling ? "Enrolling..." : "Enroll Now"}
            </button>
        </div>

        {enrollmentMessage && (
            <p role={enrollmentMessage.includes("successfully") ? "status" : "alert"} className="mt-4 text-sm">
            {enrollmentMessage}
            </p>
        )}
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
