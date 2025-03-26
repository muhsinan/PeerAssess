// Server Component
import AssignmentDetailsClient from './AssignmentDetailsClient';

export default function AssignmentDetailsPage({ params }: { params: { id: string } }) {
  return <AssignmentDetailsClient assignmentId={params.id} />;
} 