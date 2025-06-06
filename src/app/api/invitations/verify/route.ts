import { NextRequest, NextResponse } from 'next/server';
import { verifyInvitationToken } from '@/lib/invitation-tokens';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    
    if (!token) {
      return NextResponse.json(
        { error: 'Invitation token is required' },
        { status: 400 }
      );
    }
    
    const invitation = await verifyInvitationToken(token);
    
    if (!invitation) {
      return NextResponse.json(
        { error: 'Invalid or expired invitation token' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      valid: true,
      invitation: {
        courseId: invitation.course_id,
        courseName: invitation.course_name,
        instructorName: invitation.instructor_name,
        studentEmail: invitation.student_email,
        expiresAt: invitation.expires_at,
        createdAt: invitation.created_at
      }
    });
  } catch (error) {
    console.error('Error verifying invitation token:', error);
    return NextResponse.json(
      { error: 'Failed to verify invitation token' },
      { status: 500 }
    );
  }
} 