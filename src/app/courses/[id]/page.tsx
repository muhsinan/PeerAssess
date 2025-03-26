// Server Component
import CourseDetailsClient from './CourseDetailsClient';

export default async function CourseDetailsPage({ params }: { params: { id: string } }) {
  const { id } = await params;
  return <CourseDetailsClient courseId={id} />;
} 