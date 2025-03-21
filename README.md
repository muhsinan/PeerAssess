# PeerAssess: AI-Powered Peer Assessment Tool

PeerAssess is a modern web application designed to facilitate and enhance peer assessment in educational settings. By combining user-friendly interfaces with AI assistance, it creates a comprehensive platform for students to submit assignments and review their peers' work.

## Features

- **Assignment Submission**: Rich text editor with formatting options and file attachments
- **Peer Review System**: Intuitive interface for reviewing peers' work using customizable rubrics
- **AI Assistance**: AI-powered suggestions for providing constructive feedback
- **Dashboard Overview**: Clear visualization of pending reviews, submissions, and feedback
- **Responsive Design**: Works seamlessly across desktop and mobile devices

## Tech Stack

- **Frontend**: Next.js, React, TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Headless UI, Hero Icons
- **Rich Text Editing**: TinyMCE
- **Form Handling**: React Hook Form

## Project Structure

```
src/
├── app/                      # Next.js app router pages
│   ├── dashboard/            # Dashboard page
│   ├── peer-reviews/         # Peer review pages
│   ├── submit-assignment/    # Assignment submission page
│   └── page.tsx              # Landing page
├── components/               # Reusable components
│   ├── layout/               # Layout components (Navbar, Footer, etc.)
│   ├── review/               # Review-related components
│   ├── submission/           # Submission-related components
│   └── shared/               # Shared utility components
└── styles/                   # Global styles
```

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm or yarn

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

3. Run the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Future Enhancements

- **User Authentication**: Implement user registration and authentication
- **AI Grading**: Add AI capabilities to assist in grading and providing feedback
- **Analytics Dashboard**: Provide insights into student performance and peer review patterns
- **Course Management**: Allow instructors to create and manage courses and assignments
- **Integration**: Connect with popular Learning Management Systems (LMS)

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Icons by [Heroicons](https://heroicons.com/)
