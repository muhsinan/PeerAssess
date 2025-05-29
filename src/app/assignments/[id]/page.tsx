// Server Component
import AssignmentDetailsClient from './AssignmentDetailsClient';

export default async function AssignmentDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AssignmentDetailsClient assignmentId={id} />;
} 