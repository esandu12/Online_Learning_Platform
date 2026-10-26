
import CourseDetailsClient from "./CourseDetailsClient";

// Render this route dynamically
export const dynamic = "force-dynamic";

export default async function CourseDetailsPage({ params }) {
  const { id } = await params;

  return <CourseDetailsClient courseId={id} />;
}

