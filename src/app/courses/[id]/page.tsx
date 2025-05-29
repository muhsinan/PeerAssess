// Server Component
import CourseDetailsClient from './CourseDetailsClient';

export default async function CourseDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CourseDetailsClient courseId={id} />;
} 