-- =====================================================
-- LearnFlow LMS - Supabase Database Schema
-- =====================================================
-- Run this in your Supabase SQL Editor to set up the database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLES
-- =====================================================

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('student', 'teacher', 'admin')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Courses table
CREATE TABLE IF NOT EXISTS public.courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Course sections table
CREATE TABLE IF NOT EXISTS public.course_sections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pages table
CREATE TABLE IF NOT EXISTS public.pages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  section_id UUID NOT NULL REFERENCES public.course_sections(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Blocks table
CREATE TABLE IF NOT EXISTS public.blocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  page_id UUID NOT NULL REFERENCES public.pages(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('text', 'heading', 'image', 'video', 'yes_no', 'multiple_choice', 'file_upload', 'video_post')),
  title TEXT NOT NULL,
  content TEXT,
  options TEXT[],
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Course enrollments table
CREATE TABLE IF NOT EXISTS public.course_enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, course_id)
);

-- Student answers table
CREATE TABLE IF NOT EXISTS public.student_answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  block_id UUID NOT NULL REFERENCES public.blocks(id) ON DELETE CASCADE,
  answer TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, block_id)
);

-- Video posts table
CREATE TABLE IF NOT EXISTS public.video_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  block_id UUID NOT NULL REFERENCES public.blocks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(block_id, user_id)
);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_posts ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view all users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

-- Courses policies
CREATE POLICY "Anyone can view courses" ON public.courses FOR SELECT USING (true);
CREATE POLICY "Teachers and admins can create courses" ON public.courses FOR INSERT 
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('teacher', 'admin'))
  );
CREATE POLICY "Teachers and admins can update courses" ON public.courses FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('teacher', 'admin'))
  );

-- Course sections policies
CREATE POLICY "Anyone can view sections" ON public.course_sections FOR SELECT USING (true);
CREATE POLICY "Teachers and admins can manage sections" ON public.course_sections FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('teacher', 'admin'))
  );

-- Pages policies
CREATE POLICY "Anyone can view pages" ON public.pages FOR SELECT USING (true);
CREATE POLICY "Teachers and admins can manage pages" ON public.pages FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('teacher', 'admin'))
  );

-- Blocks policies
CREATE POLICY "Anyone can view blocks" ON public.blocks FOR SELECT USING (true);
CREATE POLICY "Teachers and admins can manage blocks" ON public.blocks FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('teacher', 'admin'))
  );

-- Enrollments policies
CREATE POLICY "Users can view own enrollments" ON public.course_enrollments FOR SELECT 
  USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('teacher', 'admin')));
CREATE POLICY "Anyone can enroll" ON public.course_enrollments FOR INSERT WITH CHECK (user_id = auth.uid());

-- Student answers policies
CREATE POLICY "Students can view own answers, teachers can view all" ON public.student_answers FOR SELECT
  USING (
    user_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('teacher', 'admin'))
  );
CREATE POLICY "Students can submit answers" ON public.student_answers FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Students can update own answers" ON public.student_answers FOR UPDATE USING (user_id = auth.uid());

-- Video posts policies
CREATE POLICY "Anyone can view video posts" ON public.video_posts FOR SELECT USING (true);
CREATE POLICY "Users can create own video posts" ON public.video_posts FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own video posts" ON public.video_posts FOR UPDATE USING (user_id = auth.uid());

-- =====================================================
-- TRIGGER: Auto-create user profile on signup
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- TEST DATA (with valid UUIDs)
-- =====================================================

-- Insert sample courses
INSERT INTO public.courses (id, title, description) VALUES
  ('11111111-aaaa-bbbb-cccc-111111111111', 'Introduction to Web Development', 'Learn the fundamentals of HTML, CSS, and JavaScript to build modern websites'),
  ('22222222-aaaa-bbbb-cccc-222222222222', 'Advanced React Patterns', 'Master advanced React concepts including hooks, context, and performance optimization'),
  ('33333333-aaaa-bbbb-cccc-333333333333', 'Database Design Fundamentals', 'Learn how to design efficient and scalable database schemas');

-- Insert course sections
INSERT INTO public.course_sections (id, course_id, title, order_index) VALUES
  -- Web Development Course
  ('aaaaaaaa-1111-1111-1111-aaaaaaaaaaaa', '11111111-aaaa-bbbb-cccc-111111111111', 'Getting Started', 0),
  ('aaaaaaaa-2222-2222-2222-aaaaaaaaaaaa', '11111111-aaaa-bbbb-cccc-111111111111', 'HTML Basics', 1),
  ('aaaaaaaa-3333-3333-3333-aaaaaaaaaaaa', '11111111-aaaa-bbbb-cccc-111111111111', 'CSS Styling', 2),
  ('aaaaaaaa-4444-4444-4444-aaaaaaaaaaaa', '11111111-aaaa-bbbb-cccc-111111111111', 'JavaScript Fundamentals', 3),
  -- React Course
  ('bbbbbbbb-1111-1111-1111-bbbbbbbbbbbb', '22222222-aaaa-bbbb-cccc-222222222222', 'React Hooks Deep Dive', 0),
  ('bbbbbbbb-2222-2222-2222-bbbbbbbbbbbb', '22222222-aaaa-bbbb-cccc-222222222222', 'Context and State Management', 1),
  ('bbbbbbbb-3333-3333-3333-bbbbbbbbbbbb', '22222222-aaaa-bbbb-cccc-222222222222', 'Performance Optimization', 2);

-- Insert pages
INSERT INTO public.pages (id, section_id, title, order_index) VALUES
  -- Getting Started section
  ('cccccccc-1111-1111-1111-cccccccccccc', 'aaaaaaaa-1111-1111-1111-aaaaaaaaaaaa', 'Welcome to the Course', 0),
  ('cccccccc-1112-1111-1111-cccccccccccc', 'aaaaaaaa-1111-1111-1111-aaaaaaaaaaaa', 'Setting Up Your Environment', 1),
  ('cccccccc-1113-1111-1111-cccccccccccc', 'aaaaaaaa-1111-1111-1111-aaaaaaaaaaaa', 'Your First Web Page', 2),
  -- HTML Basics section
  ('cccccccc-2221-2222-2222-cccccccccccc', 'aaaaaaaa-2222-2222-2222-aaaaaaaaaaaa', 'HTML Document Structure', 0),
  ('cccccccc-2222-2222-2222-cccccccccccc', 'aaaaaaaa-2222-2222-2222-aaaaaaaaaaaa', 'Common HTML Elements', 1),
  ('cccccccc-2223-2222-2222-cccccccccccc', 'aaaaaaaa-2222-2222-2222-aaaaaaaaaaaa', 'Forms and Input', 2),
  ('cccccccc-2224-2222-2222-cccccccccccc', 'aaaaaaaa-2222-2222-2222-aaaaaaaaaaaa', 'HTML Quiz', 3),
  -- CSS Styling section
  ('cccccccc-3331-3333-3333-cccccccccccc', 'aaaaaaaa-3333-3333-3333-aaaaaaaaaaaa', 'Introduction to CSS', 0),
  ('cccccccc-3332-3333-3333-cccccccccccc', 'aaaaaaaa-3333-3333-3333-aaaaaaaaaaaa', 'Selectors and Properties', 1),
  ('cccccccc-3333-3333-3333-cccccccccccc', 'aaaaaaaa-3333-3333-3333-aaaaaaaaaaaa', 'Flexbox Layout', 2),
  -- JavaScript section
  ('cccccccc-4441-4444-4444-cccccccccccc', 'aaaaaaaa-4444-4444-4444-aaaaaaaaaaaa', 'JavaScript Basics', 0),
  ('cccccccc-4442-4444-4444-cccccccccccc', 'aaaaaaaa-4444-4444-4444-aaaaaaaaaaaa', 'Variables and Data Types', 1),
  ('cccccccc-4443-4444-4444-cccccccccccc', 'aaaaaaaa-4444-4444-4444-aaaaaaaaaaaa', 'Functions and Scope', 2),
  ('cccccccc-4444-4444-4444-cccccccccccc', 'aaaaaaaa-4444-4444-4444-aaaaaaaaaaaa', 'Video Introduction', 3);

-- Insert blocks for "Welcome to the Course" page
INSERT INTO public.blocks (page_id, type, title, content, options, order_index) VALUES
  ('cccccccc-1111-1111-1111-cccccccccccc', 'heading', 'Welcome to Web Development!', 'Your journey to becoming a web developer starts here.', NULL, 0),
  ('cccccccc-1111-1111-1111-cccccccccccc', 'text', 'Course Overview', 'In this comprehensive course, you will learn everything you need to know to build modern, responsive websites. We will cover HTML for structure, CSS for styling, and JavaScript for interactivity.

By the end of this course, you will be able to:
- Create well-structured HTML documents
- Style web pages with CSS
- Add interactivity with JavaScript
- Build responsive layouts
- Deploy your projects online', NULL, 1),
  ('cccccccc-1111-1111-1111-cccccccccccc', 'image', 'Web Development Stack', 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800', NULL, 2),
  ('cccccccc-1111-1111-1111-cccccccccccc', 'yes_no', 'Ready to Start?', 'Are you excited to begin your web development journey?', NULL, 3);

-- Insert blocks for "Setting Up Your Environment" page
INSERT INTO public.blocks (page_id, type, title, content, options, order_index) VALUES
  ('cccccccc-1112-1111-1111-cccccccccccc', 'heading', 'Setting Up Your Development Environment', 'Get your tools ready for web development', NULL, 0),
  ('cccccccc-1112-1111-1111-cccccccccccc', 'text', 'Required Tools', 'Before we start coding, you will need to install a few essential tools:

1. A modern web browser (Chrome, Firefox, or Edge)
2. A code editor (VS Code is recommended)
3. Git for version control (optional but recommended)

These tools are free and available for all major operating systems.', NULL, 1),
  ('cccccccc-1112-1111-1111-cccccccccccc', 'multiple_choice', 'Which code editor will you use?', 'Select the code editor you plan to use for this course:', ARRAY['Visual Studio Code', 'Sublime Text', 'Atom', 'WebStorm', 'Other'], 2),
  ('cccccccc-1112-1111-1111-cccccccccccc', 'video_post', 'Introduce Yourself', 'Record a short video introducing yourself and sharing what you hope to learn from this course!', NULL, 3);

-- Insert blocks for "HTML Document Structure" page
INSERT INTO public.blocks (page_id, type, title, content, options, order_index) VALUES
  ('cccccccc-2221-2222-2222-cccccccccccc', 'heading', 'Understanding HTML Document Structure', 'Learn how HTML documents are organized', NULL, 0),
  ('cccccccc-2221-2222-2222-cccccccccccc', 'text', 'The Basic Structure', 'Every HTML document follows a standard structure:

<!DOCTYPE html> - Declares this is an HTML5 document
<html> - The root element
<head> - Contains metadata
<body> - Contains visible content

The DOCTYPE declaration tells the browser which version of HTML to use. The html element wraps everything, while head contains information about the page, and body contains what users see.', NULL, 1),
  ('cccccccc-2221-2222-2222-cccccccccccc', 'yes_no', 'Knowledge Check', 'Does the <head> element contain the visible content of a webpage?', NULL, 2),
  ('cccccccc-2221-2222-2222-cccccccccccc', 'file_upload', 'Submit Your First HTML File', 'Create a basic HTML document with the proper structure and upload it here for review.', NULL, 3);

-- Insert blocks for "HTML Quiz" page
INSERT INTO public.blocks (page_id, type, title, content, options, order_index) VALUES
  ('cccccccc-2224-2222-2222-cccccccccccc', 'heading', 'HTML Knowledge Quiz', 'Test your understanding of HTML basics', NULL, 0),
  ('cccccccc-2224-2222-2222-cccccccccccc', 'multiple_choice', 'Question 1', 'What does HTML stand for?', ARRAY['Hyper Text Markup Language', 'High Tech Modern Language', 'Hyper Transfer Markup Language', 'Home Tool Markup Language'], 1),
  ('cccccccc-2224-2222-2222-cccccccccccc', 'multiple_choice', 'Question 2', 'Which HTML element is used for the largest heading?', ARRAY['<h1>', '<heading>', '<h6>', '<head>'], 2),
  ('cccccccc-2224-2222-2222-cccccccccccc', 'yes_no', 'Question 3', 'Is the <br> tag used to create a line break?', NULL, 3),
  ('cccccccc-2224-2222-2222-cccccccccccc', 'multiple_choice', 'Question 4', 'Which attribute is used to specify the destination of a link?', ARRAY['href', 'src', 'link', 'url'], 4);

-- Insert blocks for "Video Introduction" page
INSERT INTO public.blocks (page_id, type, title, content, options, order_index) VALUES
  ('cccccccc-4444-4444-4444-cccccccccccc', 'heading', 'JavaScript Video Introduction', 'Watch this introduction to JavaScript', NULL, 0),
  ('cccccccc-4444-4444-4444-cccccccccccc', 'video', 'Introduction to JavaScript', 'https://www.youtube.com/embed/W6NZfCO5SIk', NULL, 1),
  ('cccccccc-4444-4444-4444-cccccccccccc', 'text', 'Key Takeaways', 'After watching the video, remember these key points:

- JavaScript adds interactivity to websites
- It runs in the browser (client-side)
- Modern JavaScript is powerful and versatile
- You can also use JavaScript on the server (Node.js)', NULL, 2),
  ('cccccccc-4444-4444-4444-cccccccccccc', 'video_post', 'Share Your Learning', 'Record a video explaining one concept from the JavaScript introduction that you found interesting!', NULL, 3);

-- =====================================================
-- INDEXES for better performance
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_course_sections_course ON public.course_sections(course_id);
CREATE INDEX IF NOT EXISTS idx_pages_section ON public.pages(section_id);
CREATE INDEX IF NOT EXISTS idx_blocks_page ON public.blocks(page_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_user ON public.course_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_answers_user ON public.student_answers(user_id);
CREATE INDEX IF NOT EXISTS idx_video_posts_block ON public.video_posts(block_id);

-- =====================================================
-- POST-SETUP: After creating users in Auth
-- =====================================================
-- 
-- 1. Create these users in Supabase Dashboard > Authentication > Users:
--    - admin@learnflow.com (password: admin123)
--    - teacher@learnflow.com (password: teacher123)
--    - student@learnflow.com (password: student123)
--
-- 2. Then run these commands to update roles:
--
-- UPDATE public.users SET role = 'admin', full_name = 'Admin User' WHERE email = 'admin@learnflow.com';
-- UPDATE public.users SET role = 'teacher', full_name = 'Sarah Johnson' WHERE email = 'teacher@learnflow.com';
-- UPDATE public.users SET role = 'student', full_name = 'Alex Chen' WHERE email = 'student@learnflow.com';
--
-- 3. Enroll student in courses:
--
-- INSERT INTO public.course_enrollments (user_id, course_id)
-- SELECT u.id, c.id 
-- FROM public.users u, public.courses c
-- WHERE u.email = 'student@learnflow.com';
