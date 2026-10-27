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

  if (state === "checking") return <main className="mx-auto max-w-3xl p-10 text-slate-600" role="status">Checking your session…</main>;
  if (state === "forbidden") return <main className="mx-auto max-w-3xl p-10"><p role="alert">This page is only available to the required account role.</p></main>;
  return children;
}
