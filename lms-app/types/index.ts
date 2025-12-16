export type UserRole = 'student' | 'teacher' | 'admin';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  avatar_url?: string;
  created_at: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  created_by: string;
  created_at: string;
}

export interface CourseSection {
  id: string;
  course_id: string;
  title: string;
  order_index: number;
  created_at: string;
}

export interface Page {
  id: string;
  section_id: string;
  title: string;
  order_index: number;
  created_at: string;
}

export type BlockType = 
  | 'text' 
  | 'heading' 
  | 'image' 
  | 'video' 
  | 'yes_no' 
  | 'multiple_choice' 
  | 'file_upload'
  | 'video_post';

export interface Block {
  id: string;
  page_id: string;
  type: BlockType;
  title: string;
  content: string;
  options?: string[];
  order_index: number;
  created_at: string;
}

export interface VideoPost {
  id: string;
  block_id: string;
  user_id: string;
  video_url: string;
  thumbnail_url: string;
  created_at: string;
}

export interface StudentAnswer {
  id: string;
  user_id: string;
  block_id: string;
  answer: string;
  created_at: string;
}

export interface CourseEnrollment {
  id: string;
  user_id: string;
  course_id: string;
  enrolled_at: string;
}
