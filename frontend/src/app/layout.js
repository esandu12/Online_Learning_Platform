import "./globals.css";
import { Suspense } from "react";
import RoleNavbar from "../components/RoleNavbar";

export const metadata = {
  title: "LearnSpace | Online Learning Platform",
  description: "Browse courses, explore lessons, and manage student enrollments.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full antialiased" data-scroll-behavior="smooth">
      <body className="min-h-full flex flex-col"><Suspense fallback={<header aria-hidden="true" className="min-h-[76px] border-b border-slate-200/80 bg-white" />}><RoleNavbar /></Suspense>{children}</body>
    </html>
  );
}
