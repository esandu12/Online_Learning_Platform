
"use client";

import { useEffect, useState } from "react";

const API = "http://127.0.0.1:5001/api";

const emptyForm = {
  course_id: "",
  course_name: "",
  level: "Beginner",
  duration: "",
  price: "",
  instructor_id: "",
  category_id: "",
};

export default function CourseManagement() {
  const [courses, setCourses] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [levelFilter, setLevelFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name-asc");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function request(path, options) {
    const response = await fetch(`${API}${path}`, options);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Request failed");
    }

    return data;
  }

  async function loadCourses() {
    const data = await request("/courses");
    setCourses(data);
  }

  useEffect(() => {
    async function loadData() {
      try {
        const [courseData, instructorData, categoryData] =
          await Promise.all([
            request("/courses"),
            request("/instructors"),
            request("/categories"),
          ]);

        setCourses(courseData);
        setInstructors(instructorData);
        setCategories(categoryData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  function startEdit(course) {
    setForm({
      course_id: course.course_id,
      course_name: course.course_name,
      level: course.level || "Beginner",
      duration: course.duration || "",
      price: course.price,
      instructor_id: course.instructor_id || "",
      category_id: course.category_id || "",
    });

    setEditing(true);
    setMessage("");
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetForm() {
    setForm({ ...emptyForm });
    setEditing(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!form.course_id.trim() || !form.course_name.trim() ||
        !form.instructor_id || !form.category_id ||
        form.price === "" || Number(form.price) < 0) {
      setError("Please complete all required fields correctly.");
      return;
    }

    setSaving(true);

    try {
      await request(
        editing
          ? `/courses/${encodeURIComponent(form.course_id)}`
          : "/courses",
        {
          method: editing ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...form,
            price: Number(form.price),
          }),
        }
      );

      await loadCourses();
      setMessage(editing ? "Course updated successfully." : "Course created successfully.");
      resetForm();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function deleteCourse(course) {
    if (!window.confirm(`Delete "${course.course_name}"?`)) return;

    setError("");
    setMessage("");

    try {
      await request(`/courses/${encodeURIComponent(course.course_id)}`, {
        method: "DELETE",
      });

      await loadCourses();
      setMessage("Course deleted successfully.");
    } catch (err) {
      setError(err.message);
    }
  }


  const filtered = courses
    .filter((course) => {
      const query = search.toLowerCase().trim();

      const matchesSearch =
        course.course_name.toLowerCase().includes(query) ||
        course.course_id.toLowerCase().includes(query) ||
        (course.category_name || "").toLowerCase().includes(query);

      const matchesCategory =
        categoryFilter === "all" ||
        course.category_id === categoryFilter;

      const matchesLevel =
        levelFilter === "all" ||
        course.level === levelFilter;

      return matchesSearch && matchesCategory && matchesLevel;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "name-desc":
          return b.course_name.localeCompare(a.course_name);
        case "price-low":
          return Number(a.price) - Number(b.price);
        case "price-high":
          return Number(b.price) - Number(a.price);
        default:
          return a.course_name.localeCompare(b.course_name);
      }
    });


  const fieldStyle =
    "w-full rounded-lg border border-slate-300 bg-white p-3 text-slate-900";

  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-900">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8">
          <a href="/" className="text-blue-600 hover:underline">
            ← Course Catalog
          </a>
          <h1 className="mt-3 text-3xl font-bold">
            Course Management
          </h1>
          <p className="text-slate-500">
            Create, view, update and delete courses.
          </p>
        </header>

        {message && (
          <div role="status" className="mb-5 rounded-lg bg-green-50 p-4 text-green-700">
            {message}
          </div>
        )}

        {error && (
          <div role="alert" className="mb-5 rounded-lg bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        <section className="mb-10 rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-xl font-bold">
            {editing ? "Edit Course" : "Add New Course"}
          </h2>

          <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
            <label className="block text-sm font-medium">
              Course ID
              <input
                name="course_id"
                value={form.course_id}
                onChange={handleChange}
                disabled={editing}
                required
                maxLength={10}
                className={fieldStyle + " mt-1 disabled:bg-slate-100"}
                placeholder="CRS007"
              />
            </label>

            <label className="block text-sm font-medium">
              Course Name
              <input
                name="course_name"
                value={form.course_name}
                onChange={handleChange}
                required
                maxLength={100}
                className={fieldStyle + " mt-1"}
                placeholder="Python Programming"
              />
            </label>

            <label className="block text-sm font-medium">
              Level
              <select name="level" value={form.level}
                onChange={handleChange} className={fieldStyle + " mt-1"}>
                <option>Beginner</option>
                <option>Intermediate</option>
                <option>Advanced</option>
              </select>
            </label>

            <label className="block text-sm font-medium">
              Duration
              <input name="duration" value={form.duration}
                onChange={handleChange} maxLength={30}
                className={fieldStyle + " mt-1"} placeholder="8 Weeks" />
            </label>

            <label className="block text-sm font-medium">
              Price (LKR)
              <input type="number" name="price" value={form.price}
                onChange={handleChange} min="0" step="0.01"
                required className={fieldStyle + " mt-1"} />
            </label>

            <label className="block text-sm font-medium">
              Instructor
              <select name="instructor_id" value={form.instructor_id}
                onChange={handleChange} required className={fieldStyle + " mt-1"}>
                <option value="">Select Instructor</option>
                {instructors.map((i) => (
                  <option key={i.instructor_id} value={i.instructor_id}>
                    {i.instructor_name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm font-medium">
              Category
              <select name="category_id" value={form.category_id}
                onChange={handleChange} required className={fieldStyle + " mt-1"}>
                <option value="">Select Category</option>
                {categories.map((c) => (
                  <option key={c.category_id} value={c.category_id}>
                    {c.category_name}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex items-end gap-3">
              <button type="submit" disabled={saving}
                className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white disabled:opacity-50">
                {saving ? "Saving..." : editing ? "Update Course" : "Add Course"}
              </button>
              {editing && (
                <button type="button" onClick={resetForm}
                  className="rounded-lg border px-5 py-3">
                  Cancel
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="rounded-xl border bg-white p-6 shadow-sm">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-xl font-bold">
              Courses ({filtered.length})
            </h2>

            <input
              type="search"
              placeholder="Search ID, name or category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border p-3 md:w-80"
            />
          </div>

          <div className="mb-6 grid gap-3 md:grid-cols-3">

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              aria-label="Filter courses by category"
              className="rounded-lg border p-3"
            >
              <option value="all">All Categories</option>
              {categories.map((category) => (
                <option
                  key={category.category_id}
                  value={category.category_id}
                >
                  {category.category_name}
                </option>
              ))}
            </select>

            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              aria-label="Filter courses by level"
              className="rounded-lg border p-3"
            >
              <option value="all">All Levels</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              aria-label="Sort courses"
              className="rounded-lg border p-3"
            >
              <option value="name-asc">Name A–Z</option>
              <option value="name-desc">Name Z–A</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>

          </div>

          {loading ? (
            <p>Loading courses...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="p-3">ID</th>
                    <th className="p-3">Course</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Price</th>
                    <th className="p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((course) => (
                    <tr key={course.course_id} className="border-t">
                      <td className="p-3">{course.course_id}</td>
                      <td className="p-3 font-medium">{course.course_name}</td>
                      <td className="p-3">{course.category_name}</td>
                      <td className="p-3">
                        LKR {Number(course.price).toLocaleString()}
                      </td>
                      <td className="flex gap-2 p-3">
                        <button onClick={() => startEdit(course)}
                          className="rounded bg-amber-100 px-3 py-2 text-amber-800">
                          Edit
                        </button>
                        <button onClick={() => deleteCourse(course)}
                          className="rounded bg-red-100 px-3 py-2 text-red-700">
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filtered.length === 0 && (
                <p className="p-5 text-center text-slate-500">
                  No courses found.
                </p>
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
