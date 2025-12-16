# LearnFlow - Modern Learning Management System

A beautiful, feature-rich learning management system built with Next.js 14 and Supabase. Designed for students, teachers, and administrators.

![LearnFlow Preview](preview.png)

## ✨ Features

### Core Features
- **🔐 Supabase Authentication** - Secure email/password login
- **👥 Role-Based Access** - Students, Teachers, and Admins with different permissions
- **📚 Course Management** - Courses, Sections, and Pages hierarchy
- **🧱 Block-Based Content** - Flexible content blocks for pages

### Block Types
- **📝 Text Block** - Rich text content
- **📌 Heading Block** - Section headings
- **🖼️ Image Block** - Image display
- **🎬 Video Block** - Embedded video (YouTube, Vimeo)
- **✅ Yes/No Question** - Simple binary questions
- **📋 Multiple Choice** - Quiz questions with options
- **📁 File Upload** - Student file submissions
- **🎥 Video Post** - Webcam recording from students

### Interactive Features
- **↔️ Drag & Drop Pages** - Reorder pages in the sidebar (Teachers/Admins)
- **↕️ Drag & Drop Blocks** - Reorder content blocks (Teachers/Admins)
- **✏️ Inline Editing** - Edit block title and content directly (Teachers/Admins)
- **➕ Add Blocks** - Add new blocks at the bottom of pages
- **🔄 Page Navigation** - Navigate between pages with arrows
- **🎥 Video Recording** - Record directly from webcam with thumbnail generation

### UI/UX
- **🎨 Beautiful Design** - Modern, gradient-based design system
- **📱 Responsive Layout** - Works on desktop and tablet
- **✨ Smooth Animations** - Polished micro-interactions
- **🌙 Glass Morphism** - Modern visual effects

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- A Supabase account (free tier works)

### 1. Clone and Install

```bash
# Clone the repository
git clone <your-repo-url>
cd lms-app

# Install dependencies
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **Project Settings > API** and copy:
   - Project URL
   - Anon/Public Key

3. Create `.env.local` file:
```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### 3. Set Up Database

1. Go to **SQL Editor** in your Supabase dashboard
2. Copy the contents of `supabase-schema.sql`
3. Run the SQL to create tables and test data

### 4. Create Test Users

In Supabase Dashboard > **Authentication > Users**, create these users:

| Email | Password | Role |
|-------|----------|------|
| admin@learnflow.com | admin123 | Admin |
| teacher@learnflow.com | teacher123 | Teacher |
| student@learnflow.com | student123 | Student |

After creating users, run these SQL commands to update their roles:

```sql
UPDATE public.users SET role = 'admin', full_name = 'Admin User' WHERE email = 'admin@learnflow.com';
UPDATE public.users SET role = 'teacher', full_name = 'Sarah Johnson' WHERE email = 'teacher@learnflow.com';
UPDATE public.users SET role = 'student', full_name = 'Alex Chen' WHERE email = 'student@learnflow.com';
```

### 5. Enroll Student in Courses

```sql
-- Get the student's user ID and enroll in courses
INSERT INTO public.course_enrollments (user_id, course_id)
SELECT u.id, c.id 
FROM public.users u, public.courses c
WHERE u.email = 'student@learnflow.com';
```

### 6. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## 🏗️ Project Structure

```
lms-app/
├── app/
│   ├── globals.css          # Global styles
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Login page
│   └── dashboard/
│       ├── layout.tsx       # Dashboard layout with sidebar
│       └── page.tsx         # Dashboard page
├── components/
│   ├── Header.tsx           # Top navigation with profile
│   ├── Sidebar.tsx          # Left sidebar with sections/pages
│   ├── PageContent.tsx      # Main content area with blocks
│   ├── BlockItem.tsx        # Individual block component
│   ├── AddBlockModal.tsx    # Modal for adding new blocks
│   ├── VideoRecorder.tsx    # Webcam recording component
│   └── VideoPlayer.tsx      # Video playback modal
├── lib/
│   ├── supabase-client.ts   # Supabase client setup
│   └── supabase-server.ts   # Supabase server setup
├── types/
│   └── index.ts             # TypeScript type definitions
└── supabase-schema.sql      # Database schema & test data
```

## 🔑 User Roles & Permissions

| Feature | Student | Teacher | Admin |
|---------|---------|---------|-------|
| View courses | ✅ (enrolled) | ✅ (all) | ✅ (all) |
| View content | ✅ | ✅ | ✅ |
| Answer questions | ✅ | ✅ | ✅ |
| Upload files | ✅ | ✅ | ✅ |
| Record videos | ✅ | ✅ | ✅ |
| Reorder pages | ❌ | ✅ | ✅ |
| Reorder blocks | ❌ | ✅ | ✅ |
| Edit blocks | ❌ | ✅ | ✅ |
| Add blocks | ❌ | ✅ | ✅ |
| Delete blocks | ❌ | ✅ | ✅ |

## 🎬 Video Recording Feature

The Video Post block type allows students to:
1. Click to open the video recorder
2. Grant camera/microphone permissions
3. Record a video
4. Preview and re-record if needed
5. Save the video with auto-generated thumbnail
6. Click thumbnail to replay video

Teachers can click on student video thumbnails to view submissions.

## 🚢 Deploying to Vercel

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and import your repository
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy!

## 📝 Database Schema

### Tables
- `users` - User profiles with roles
- `courses` - Course definitions
- `course_sections` - Sections within courses
- `pages` - Pages within sections
- `blocks` - Content blocks within pages
- `course_enrollments` - Student course enrollments
- `student_answers` - Responses to questions
- `video_posts` - Video recordings from students

### Row Level Security
All tables have RLS policies ensuring:
- Students can only access enrolled courses
- Students can only submit/view their own answers
- Teachers/Admins have full access

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Styling**: Tailwind CSS
- **Drag & Drop**: dnd-kit
- **Icons**: Lucide React
- **Language**: TypeScript

## 📄 License

MIT License - feel free to use this for your own projects!

---

Built with ❤️ using Next.js and Supabase
