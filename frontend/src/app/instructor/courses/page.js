
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiRequest } from "../../../lib/api";

const emptyForm = {
  course_id: "",
  course_name: "",
  level: "Beginner",
  duration: "",
  price: "",
  category_id: "",
};

export default function InstructorCoursesPage() {
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function reload() {
    const results = await apiRequest("/instructor/courses");
    setCourses(results);
  }

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const [session, courseData, categoryData] =
          await Promise.all([
            apiRequest("/auth/me"),
            apiRequest("/instructor/courses"),
            apiRequest("/categories"),
          ]);

        if (session.user?.role !== "instructor") {
          throw new Error("Instructor account required");
        }

        if (active) {
          setCourses(courseData);
          setCategories(categoryData);
        }
      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => { active = false; };
  }, []);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function startEdit(course) {
    setEditing(true);
    setForm({
      course_id: course.course_id,
      course_name: course.course_name,
      level: course.level,
      duration: course.duration,
      price: String(course.price),
      category_id: course.category_id,
    });
    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetForm() {
    setForm(emptyForm);
    setEditing(false);
  }

  async function saveCourse(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const path = editing
        ? `/instructor/courses/${encodeURIComponent(form.course_id)}`
        : "/instructor/courses";

      const payload = {
        ...form,
        price: Number(form.price),
      };

      await apiRequest(path, {
        method: editing ? "PUT" : "POST",
        body: JSON.stringify(payload),
      });

      await reload();
      resetForm();
      setMessage(
        editing ? "Course updated successfully" : "Course created successfully"
      );
    } catch (err) {
      setError(err.message || "Unable to save course");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <main className="p-8">Loading courses...</main>;

  return (
    <main className="mx-auto max-w-6xl space-y-8 px-5 py-10 text-slate-900">
      <Link href="/instructor/dashboard" className="text-indigo-600">
        ← Instructor Dashboard
      </Link>

      <h1 className="text-3xl font-bold">Manage My Courses</h1>

      <form onSubmit={saveCourse} className="space-y-4 rounded-xl border bg-white p-6">
        <h2 className="text-xl font-semibold">
          {editing ? "Update Course" : "Add New Course"}
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-1">
            <span className="block text-sm">Course ID</span>
            <input
              required
              maxLength={10}
              disabled={editing}
              value={form.course_id}
              onChange={(e) => update("course_id", e.target.value)}
              className="w-full rounded-lg border p-3"
            />
          </label>

          <label className="space-y-1">
            <span className="block text-sm">Course Name</span>
            <input
              required
              maxLength={100}
              value={form.course_name}
              onChange={(e) => update("course_name", e.target.value)}
              className="w-full rounded-lg border p-3"
            />
          </label>

          <label className="space-y-1">
            <span className="block text-sm">Level</span>
            <select
              value={form.level}
              onChange={(e) => update("level", e.target.value)}
              className="w-full rounded-lg border p-3"
            >
              <option>Beginner</option>
              <option>Intermediate</option>
              <option>Advanced</option>
            </select>
          </label>

          <label className="space-y-1">
            <span className="block text-sm">Duration</span>
            <input
              required
              value={form.duration}
              onChange={(e) => update("duration", e.target.value)}
              placeholder="10 Weeks"
              className="w-full rounded-lg border p-3"
            />
          </label>

          <label className="space-y-1">
            <span className="block text-sm">Price (LKR)</span>
            <input
              required
              type="number"
              min="0"
              step="0.01"
              value={form.price}
              onChange={(e) => update("price", e.target.value)}
              className="w-full rounded-lg border p-3"
            />
          </label>

          <label className="space-y-1">
            <span className="block text-sm">Category</span>
            <select
              required
              value={form.category_id}
              onChange={(e) => update("category_id", e.target.value)}
              className="w-full rounded-lg border p-3"
            >
              <option value="">Select Category</option>
              {categories.map((category) => (
                <option
                  key={category.category_id}
                  value={category.category_id}
                >
                  {category.category_name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-indigo-600 px-5 py-3 text-white disabled:opacity-50"
          >
            {saving ? "Saving..." : editing ? "Update Course" : "Add Course"}
          </button>

          {editing && (
            <button type="button" onClick={resetForm} className="rounded-lg border px-5 py-3">
              Cancel
            </button>
          )}
        </div>
      </form>

      {error && <p role="alert" className="rounded-lg bg-red-50 p-4 text-red-700">{error}</p>}
      {message && <p role="status" className="rounded-lg bg-green-50 p-4 text-green-700">{message}</p>}

      <section>
        <h2 className="mb-4 text-2xl font-bold">
          My Courses ({courses.length})
        </h2>

        <div className="grid gap-4 md:grid-cols-2">
          {courses.map((course) => (
            <article key={course.course_id} className="rounded-xl border bg-white p-5">
              <h3 className="text-lg font-semibold">{course.course_name}</h3>
              <p className="mt-2 text-slate-500">
                {course.level} · {course.duration}
              </p>

              <div className="mt-4 flex gap-4">
                <button
                  onClick={() => startEdit(course)}
                  className="text-indigo-600"
                >
                  Edit Course
                </button>

                <Link
                  href={`/courses/${encodeURIComponent(course.course_id)}`}
                  className="text-indigo-600"
                >
                  View Course
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
