"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { apiRequest } from "../lib/api";

export default function Home() {
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [level, setLevel] = useState("all");
  const [sort, setSort] = useState("name");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadCatalog() {
      try {
        const [courseRows, categoryRows] = await Promise.all([
          apiRequest("/courses"),
          apiRequest("/categories"),
        ]);
        setCourses(courseRows);
        setCategories(categoryRows);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadCatalog();
  }, []);

  const visibleCourses = useMemo(() => {
    const query = search.trim().toLowerCase();
    return courses
      .filter((course) => [course.course_name, course.course_id, course.category_name, course.instructor_name]
        .some((value) => (value || "").toLowerCase().includes(query)))
      .filter((course) => category === "all" || course.category_id === category)
      .filter((course) => level === "all" || course.level === level)
      .sort((a, b) => sort === "price-low"
        ? Number(a.price) - Number(b.price)
        : sort === "price-high"
          ? Number(b.price) - Number(a.price)
          : a.course_name.localeCompare(b.course_name));
  }, [courses, search, category, level, sort]);

  return (
    <main className="min-h-screen bg-[#f5f7fb] text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-5 sm:px-8 md:flex-row md:items-center md:justify-between">
          <Link href="/" className="text-xl font-bold tracking-tight text-slate-950">LearnSpace</Link>
          <nav aria-label="Main navigation" className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium text-slate-600">
            <Link href="/" aria-current="page" className="text-indigo-700">Courses</Link>
            <Link href="/my-enrollments" className="hover:text-indigo-700">My Enrollments</Link>
            <Link href="/admin/courses" className="hover:text-indigo-700">Manage Courses</Link>
            <Link href="/login" className="hover:text-indigo-700">Sign in</Link>
            <Link href="/signup" className="hover:text-indigo-700">Sign up</Link>
          </nav>
        </div>
      </header>

      <section className="bg-gradient-to-br from-indigo-950 via-indigo-900 to-violet-800 text-white">
        <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-200">Learn at your pace</p>
          <h1 className="mt-3 max-w-3xl text-3xl font-bold tracking-tight sm:text-5xl">Build skills that move you forward.</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-indigo-100">Explore practical courses, meet your instructors, and keep your learning organized in one place.</p>
          <p className="mt-7 text-sm text-indigo-200">{courses.length} courses in the catalog</p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-9 sm:px-8 sm:py-12">
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div><h2 className="text-2xl font-bold tracking-tight">Course catalog</h2><p className="mt-1 text-sm text-slate-500">Search, filter, and find your next course.</p></div>
          <p className="text-sm text-slate-500" aria-live="polite">{visibleCourses.length} results</p>
        </div>

        <div className="mb-7 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-sm font-medium text-slate-700 sm:col-span-2 lg:col-span-1">Search
            <input type="search" placeholder="Course, instructor, category..." value={search} onChange={(e) => setSearch(e.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
          </label>
          <label className="text-sm font-medium text-slate-700">Category
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 font-normal">
              <option value="all">All categories</option>{categories.map((item) => <option key={item.category_id} value={item.category_id}>{item.category_name}</option>)}
            </select>
          </label>
          <label className="text-sm font-medium text-slate-700">Level
            <select value={level} onChange={(e) => setLevel(e.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 font-normal">
              <option value="all">All levels</option><option>Beginner</option><option>Intermediate</option><option>Advanced</option>
            </select>
          </label>
          <label className="text-sm font-medium text-slate-700">Sort by
            <select value={sort} onChange={(e) => setSort(e.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 font-normal">
              <option value="name">Course name</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option>
            </select>
          </label>
        </div>

        {loading && <p className="py-10 text-center text-slate-600" role="status">Loading courses...</p>}
        {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800" role="alert">{error}</div>}
        {!loading && !error && visibleCourses.length === 0 && <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-600">No courses match these filters. Try another search.</div>}

        {!loading && !error && visibleCourses.length > 0 && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {visibleCourses.map((course) => (
              <article key={course.course_id} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                <div className="flex items-center justify-between gap-3"><span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">{course.category_name || "Course"}</span><span className="text-xs text-slate-400">{course.course_id}</span></div>
                <h3 className="mt-4 text-xl font-semibold leading-snug">{course.course_name}</h3>
                <p className="mt-2 text-sm text-slate-500">Instructor: {course.instructor_name || "To be announced"}</p>
                <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-600"><span className="rounded-md bg-slate-100 px-2.5 py-1">{course.level || "All levels"}</span><span className="rounded-md bg-slate-100 px-2.5 py-1">{course.duration || "Flexible duration"}</span></div>
                <div className="mt-auto flex items-center justify-between gap-3 pt-6"><span className="text-lg font-bold">LKR {Number(course.price || 0).toLocaleString()}</span><Link href={`/courses/${encodeURIComponent(course.course_id)}`} className="rounded-lg bg-indigo-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2">View course</Link></div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
