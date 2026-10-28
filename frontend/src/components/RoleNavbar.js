
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

export default function RoleNavbar() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function getProfile() {
      try {
        const result = await apiRequest("/auth/me");
        if (active) setUser(result.user);
      } catch {
        if (active) setUser(null);
      } finally {
        if (active) setLoading(false);
      }
    }

    getProfile();
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

  return (
    <header className="border-b bg-white text-slate-900">
      <nav className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-4">
        <Link href="/" className="text-xl font-bold">
          LearnSpace
        </Link>

        <div className="flex flex-wrap items-center gap-4 text-sm">
          <Link href="/">Courses</Link>

          {!loading && !user && (
            <>
              <Link href="/login">Sign in</Link>
              <Link href="/signup">Sign up</Link>
            </>
          )}

          {user && (
            <>
              <Link href={dashboardPaths[user.role] || "/"}>
                Dashboard
              </Link>

              {user.role === "student" && (
                <Link href="/my-enrollments">
                  My Enrollments
                </Link>
              )}

              {user.role === "instructor" && (
                <Link href="/instructor/courses">
                  My Courses
                </Link>
              )}

              {user.role === "admin" && (
                <Link href="/admin/courses">
                  Manage Courses
                </Link>
              )}

              <Link
                href={dashboardPaths[user.role] || "/"}
                className="rounded-lg bg-indigo-50 px-3 py-2"
              >
                <span className="font-semibold">
                  {user.name || user.email}
                </span>
                <span className="ml-2 capitalize text-indigo-700">
                  {user.role}
                </span>
              </Link>

              <button
                onClick={signOut}
                className="rounded-lg border px-3 py-2 hover:bg-slate-50"
              >
                Sign out
              </button>
            </>
          )}
        </div>
      </nav>

      {error && (
        <p role="alert" className="px-5 pb-3 text-sm text-red-600">
          {error}
        </p>
      )}
    </header>
  );
}
