"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiRequest } from "../lib/api";

const dashboardPaths = {
  student: "/student/dashboard",
  instructor: "/instructor/dashboard",
  admin: "/admin/dashboard",
};

function initials(value) {
  return (value || "LS").trim().split(/[\s@._-]+/).filter(Boolean).slice(0, 2).map((part) => part[0].toUpperCase()).join("");
}

export default function RoleNavbar() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    apiRequest("/auth/me").then(({ user: currentUser }) => {
      if (active) setUser(currentUser);
    }).catch(() => {
      if (active) setUser(null);
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, []);

  async function signOut() {
    try {
      setError("");
      await apiRequest("/auth/logout", { method: "POST" });
      setUser(null);
      router.push("/login");
      router.refresh();
    } catch (err) {
      setError(err.message || "Could not sign out");
    }
  }

  const dashboard = user ? dashboardPaths[user.role] || "/" : "/";
  const role = user?.role ? `${user.role[0].toUpperCase()}${user.role.slice(1)}` : "";

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/95 text-slate-900 shadow-[0_2px_12px_rgba(15,23,42,0.04)] backdrop-blur">
      <nav aria-label="Main navigation" className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-3.5 sm:px-8 md:min-h-[76px] md:flex-row md:items-center md:justify-between">
        <Link href="/" aria-label="LearnSpace home" className="group inline-flex w-fit items-center gap-3 rounded-lg no-underline">
          <span className="grid size-10 place-items-center rounded-xl bg-indigo-700 text-sm font-black tracking-tight text-white shadow-sm shadow-indigo-900/20 transition group-hover:bg-indigo-800">LS</span>
          <span className="text-lg font-bold tracking-tight text-slate-950">LearnSpace<span className="text-indigo-600">.</span></span>
        </Link>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-medium text-slate-600 sm:gap-x-5">
          <Link href="/" className="rounded-md py-1 hover:text-indigo-700">Courses</Link>
          {user?.role === "student" && <Link href="/my-enrollments" className="rounded-md py-1 hover:text-indigo-700">My enrollments</Link>}
          {user?.role === "instructor" && <Link href="/instructor/courses" className="rounded-md py-1 hover:text-indigo-700">My courses</Link>}
          {user?.role === "admin" && <Link href="/admin/courses" className="rounded-md py-1 hover:text-indigo-700">Manage courses</Link>}

          {!loading && !user && <>
            <Link href="/login" className="rounded-lg px-2.5 py-2 hover:text-indigo-700">Sign in</Link>
            <Link href="/signup" className="rounded-lg bg-indigo-700 px-4 py-2.5 font-semibold text-white shadow-sm transition hover:bg-indigo-800">Create account</Link>
          </>}

          {user && <>
            <Link href={dashboard} className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50/80 py-1.5 pl-1.5 pr-3 text-slate-800 no-underline transition hover:border-indigo-200 hover:bg-indigo-50/70">
              <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-lg bg-indigo-100 text-xs font-bold text-indigo-800">{initials(user.name || user.email)}</span>
              <span className="max-w-40 leading-4"><span className="block truncate font-semibold">{user.name || user.email}</span><span className="mt-0.5 block text-xs font-normal text-slate-500">{role} dashboard</span></span>
            </Link>
            <button onClick={signOut} className="rounded-lg px-2.5 py-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900">Sign out</button>
          </>}
        </div>
      </nav>
      {error && <p role="alert" className="mx-auto max-w-7xl px-5 pb-3 text-sm text-red-700 sm:px-8">{error}</p>}
    </header>
  );
}
