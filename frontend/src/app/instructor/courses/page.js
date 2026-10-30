
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

  if (loading) return <main className="app-page" role="status"><div className="app-container panel">Loading your courses…</div></main>;

  return (
    <main className="app-page">
      <div className="app-container space-y-6">
      <Link href="/instructor/dashboard" className="text-sm font-semibold text-indigo-700 no-underline hover:text-indigo-900">
        ← Instructor dashboard
      </Link>

      <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-600">Teaching workspace</p><h1 className="page-title mt-2">Manage my courses</h1></div>

      <form onSubmit={saveCourse} className="panel space-y-4">
        <h2 className="section-title">
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
            className="rounded-xl bg-indigo-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-800 disabled:opacity-50"
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

      {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">{error}</p>}
      {message && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">{message}</p>}

      <section>
        <h2 className="section-title mb-4">
          My Courses ({courses.length})
        </h2>

        <div className="grid gap-4 md:grid-cols-2">
          {courses.map((course) => (
            <article key={course.course_id} className="panel">
              <h3 className="text-lg font-semibold">{course.course_name}</h3>
              <p className="mt-2 text-slate-500">
                {course.level} · {course.duration}
              </p>

              <div className="mt-4 flex gap-4">
                <button
                  onClick={() => startEdit(course)}
                  className="font-semibold text-indigo-700 hover:text-indigo-900"
                >
                  Edit Course
                </button>

                <Link
                  href={`/courses/${encodeURIComponent(course.course_id)}`}
                  className="font-semibold text-indigo-700 no-underline hover:text-indigo-900"
                >
                  View Course
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
      </div>
    </main>
  );
}
