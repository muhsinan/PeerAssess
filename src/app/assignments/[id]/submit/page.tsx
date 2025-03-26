// Server Component
import SubmitAssignmentClient from './SubmitAssignmentClient';

export default async function SubmitAssignmentPage({ params }: { params: { id: string } }) {
  const { id } = await params;
  return <SubmitAssignmentClient assignmentId={id} />;
} 