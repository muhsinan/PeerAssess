# Peercept: AI-Powered Peer Assessment Tool

Peercept is a modern web application designed to facilitate and enhance peer assessment in educational settings. By combining user-friendly interfaces with AI assistance, it creates a comprehensive platform for students to submit assignments and review their peers' work.

## Features

- **User Authentication**: Secure login and registration system with role-based access control
- **Course Management**: Create and manage courses with student enrollments
- **Assignment Creation**: Instructors can create assignments with detailed descriptions and due dates
- **Customizable Rubrics**: Create detailed assessment rubrics with weighted criteria
- **Assignment Submission**: Rich text editor with formatting options and file attachments
- **Peer Review System**: Intuitive interface for reviewing peers' work using customizable rubrics
- **AI Assistance**: AI-powered suggestions for providing constructive feedback
- **Dashboard Overview**: Clear visualization of pending reviews, submissions, and feedback
- **Responsive Design**: Works seamlessly across desktop and mobile devices

## Tech Stack

- **Frontend**: Next.js 15.2, React 19, TypeScript
- **Backend**: Next.js API routes with PostgreSQL database
- **Authentication**: Secure password hashing with bcrypt
- **Styling**: Tailwind CSS 4
- **UI Components**: Headless UI, Hero Icons
- **Rich Text Editing**: TinyMCE
- **Form Handling**: React Hook Form

## Project Structure

```
src/
├── app/                     # Next.js app router pages
│   ├── dashboard/           # Dashboard page
│   ├── courses/             # Course management
│   ├── assignments/         # Assignment management
│   ├── submissions/         # View submissions
│   ├── my-submissions/      # User's submissions
│   ├── my-assignments/      # User's assignments
│   ├── reviews/             # Review management
│   ├── peer-reviews/        # Peer review pages
│   ├── rubrics/             # Rubric management
│   ├── submit-assignment/   # Assignment submission page
│   ├── profile/             # User profile
│   ├── settings/            # User settings
│   ├── login/               # Authentication
│   ├── register/            # User registration
│   ├── api/                 # API routes
│   └── page.tsx             # Landing page
├── components/              # Reusable components
│   ├── layout/              # Layout components (Navbar, Footer)
│   ├── review/              # Review-related components
│   └── submission/          # Submission-related components
├── db/                      # Database connection and migrations
├── lib/                     # Utility functions
└── middleware.ts            # Request middleware
```

## Database Structure

The application uses a PostgreSQL database with the following main tables:

- **users**: Student and instructor accounts
- **courses**: Course information
- **course_enrollments**: Student course enrollments
- **assignments**: Assignment details
- **rubrics**: Assessment rubrics
- **rubric_criteria**: Individual rubric criteria
- **submissions**: Student assignment submissions
- **submission_attachments**: Files attached to submissions
- **peer_reviews**: Reviews assigned to submissions
- **peer_review_scores**: Individual scores for each criterion

For more detailed information about the database structure, see [DATABASE_README.md](./DATABASE_README.md).

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm or yarn
- PostgreSQL database

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/muhsinan/PeerAssess
   cd PeerAssess
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Set up environment variables:
   Create a `.env.local` file with the following variables:
   ```
   DB_USER=your_db_user
   DB_HOST=your_db_host
   DB_NAME=your_db_name
   DB_PASSWORD=your_db_password
   DB_PORT=5432
   ```

4. Run the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Database Setup

1. Execute the database schema SQL script:
   ```bash
   psql -h your_db_host -U your_db_user -d your_db_name -f database_schema.sql
   ```

2. This will create all necessary tables and populate them with sample data for testing.

## License

This project is licensed under the MIT License.

## Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Icons by [Heroicons](https://heroicons.com/)
- Database powered by [PostgreSQL](https://www.postgresql.org/)
