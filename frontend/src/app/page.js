
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const API_URL = "http://127.0.0.1:5001/api";

export default function Home() {
  const [courses, setCourses] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadCourses() {
      try {
        const response = await fetch(`${API_URL}/courses`);
        if (!response.ok) throw new Error("Unable to load courses");
        const data = await response.json();
        setCourses(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadCourses();
  }, []);

  const filtered = courses.filter((course) =>
    course.course_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b bg-white px-8 py-5">
        <h1 className="text-2xl font-bold">Online Learning Platform</h1>
        <p className="text-sm text-slate-500">
          Explore courses and develop your skills
        </p>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="mb-6 text-3xl font-bold">Available Courses</h2>

        <input
          type="search"
          placeholder="Search courses..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-8 w-full rounded-lg border p-3"
        />

        {loading && <p>Loading courses...</p>}
        {error && <p className="text-red-600">{error}</p>}

        {!loading && !error && filtered.length === 0 && (
          <p>No courses found.</p>
        )}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((course) => (
            <article
              key={course.course_id}
              className="rounded-xl border bg-white p-6 shadow-sm"
            >
              <span className="text-sm text-blue-600">
                {course.category_name}
              </span>
              <h3 className="mt-2 text-xl font-semibold">
                {course.course_name}
              </h3>
              <p className="mt-3 text-sm text-slate-500">
                Instructor: {course.instructor_name}
              </p>
              <p className="mt-2 text-sm">
                {course.level} · {course.duration}
              </p>
              <p className="mt-5 text-lg font-bold">
                LKR {Number(course.price).toLocaleString()}
              </p>
              <Link
                href={`/courses/${course.course_id}`}
                className="mt-5 block rounded-lg bg-blue-600 px-4 py-3 text-center font-medium text-white hover:bg-blue-700"
              >
                View Course
              </Link>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
