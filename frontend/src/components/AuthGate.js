"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "../lib/api";

export default function AuthGate({ roles, children }) {
  const router = useRouter();
  const [state, setState] = useState("checking");

  useEffect(() => {
    let active = true;
    apiRequest("/auth/me").then(({ user }) => {
      if (!active) return;
      if (roles && !roles.includes(user.role)) {
        setState("forbidden");
      } else {
        setState("ready");
      }
    }).catch(() => {
      if (active) {
        router.replace("/login");
      }
    });
    return () => { active = false; };
  }, [roles, router]);

  if (state === "checking") return <main className="app-page" role="status"><div className="app-container panel">Checking your session…</div></main>;
  if (state === "forbidden") return <main className="app-page"><div className="app-container rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900"><p role="alert">This page is only available to the required account role.</p></div></main>;
  return children;
}
