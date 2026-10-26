
import { Suspense } from "react";
import CourseDetailsClient from "./CourseDetailsClient";

// This component reads the dynamic course ID
async function CourseContent({ params }) {
  const { id } = await params;

  return <CourseDetailsClient courseId={id} />;
}

// Main page with Suspense boundary
export default function CourseDetailsPage({ params }) {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-50 p-10">
          <p className="text-slate-600">
            Loading course details...
          </p>
        </main>
      }
    >
      <CourseContent params={params} />
    </Suspense>
  );
}
