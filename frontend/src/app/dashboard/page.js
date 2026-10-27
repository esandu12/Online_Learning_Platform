"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "../../lib/api";

export default function DashboardIndex() {
  const router = useRouter();
  useEffect(() => {
    apiRequest("/auth/me").then(({ user }) => router.replace(`/dashboard/${user.role}`)).catch(() => router.replace("/login"));
  }, [router]);
  return <main className="p-10 text-slate-600" role="status">Opening your dashboard…</main>;
}
