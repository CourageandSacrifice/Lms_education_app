'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-client';
import { useRouter } from 'next/navigation';
import { User, Course, CourseSection, Page } from '@/types';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [sections, setSections] = useState<CourseSection[]>([]);
  const [selectedSection, setSelectedSection] = useState<CourseSection | null>(null);
  const [pages, setPages] = useState<Page[]>([]);
  const [selectedPage, setSelectedPage] = useState<Page | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/');
        return;
      }

      // Get user profile
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profile) {
        setUser(profile);
      }

      // Get courses (for admin/teacher all courses, for students enrolled courses)
      let coursesQuery;
      if (profile?.role === 'student') {
        const { data: enrollments } = await supabase
          .from('course_enrollments')
          .select('course_id')
          .eq('user_id', session.user.id);
        
        const courseIds = enrollments?.map(e => e.course_id) || [];
        if (courseIds.length > 0) {
          const { data } = await supabase
            .from('courses')
            .select('*')
            .in('id', courseIds);
          setCourses(data || []);
          if (data && data.length > 0) {
            setSelectedCourse(data[0]);
          }
        }
      } else {
        const { data } = await supabase.from('courses').select('*');
        setCourses(data || []);
        if (data && data.length > 0) {
          setSelectedCourse(data[0]);
        }
      }

      setLoading(false);
    };

    checkUser();
  }, [router, supabase]);

  useEffect(() => {
    const fetchSections = async () => {
      if (!selectedCourse) return;
      
      const { data } = await supabase
        .from('course_sections')
        .select('*')
        .eq('course_id', selectedCourse.id)
        .order('order_index');
      
      setSections(data || []);
      if (data && data.length > 0) {
        setSelectedSection(data[0]);
      } else {
        setSelectedSection(null);
        setPages([]);
        setSelectedPage(null);
      }
    };

    fetchSections();
  }, [selectedCourse, supabase]);

  useEffect(() => {
    const fetchPages = async () => {
      if (!selectedSection) {
        setPages([]);
        setSelectedPage(null);
        return;
      }
      
      const { data } = await supabase
        .from('pages')
        .select('*')
        .eq('section_id', selectedSection.id)
        .order('order_index');
      
      setPages(data || []);
      if (data && data.length > 0) {
        setSelectedPage(data[0]);
      } else {
        setSelectedPage(null);
      }
    };

    fetchPages();
  }, [selectedSection, supabase]);

  const handlePagesReorder = async (newPages: Page[]) => {
    setPages(newPages);
    
    // Update order in database
    for (let i = 0; i < newPages.length; i++) {
      await supabase
        .from('pages')
        .update({ order_index: i })
        .eq('id', newPages[i].id);
    }
  };

  const navigatePage = (direction: 'prev' | 'next') => {
    if (!selectedPage || pages.length === 0) return;
    
    const currentIndex = pages.findIndex(p => p.id === selectedPage.id);
    let newIndex: number;
    
    if (direction === 'prev') {
      newIndex = currentIndex > 0 ? currentIndex - 1 : pages.length - 1;
    } else {
      newIndex = currentIndex < pages.length - 1 ? currentIndex + 1 : 0;
    }
    
    setSelectedPage(pages[newIndex]);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--gradient-primary)' }}>
        <div className="text-center text-white">
          <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4" />
          <p className="text-lg font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header 
        user={user} 
        courses={courses}
        selectedCourse={selectedCourse}
        onCourseChange={setSelectedCourse}
      />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          user={user}
          sections={sections}
          selectedSection={selectedSection}
          onSectionChange={setSelectedSection}
          pages={pages}
          selectedPage={selectedPage}
          onPageSelect={setSelectedPage}
          onPagesReorder={handlePagesReorder}
        />
        <main className="flex-1 overflow-auto">
          {/* Pass context to children */}
          <div className="h-full">
            {selectedPage ? (
              <div className="h-full">
                {/* Clone children with props */}
                <PageContent 
                  page={selectedPage} 
                  user={user}
                  pages={pages}
                  onNavigate={navigatePage}
                />
              </div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center p-8">
                  <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center mx-auto mb-4">
                    <svg className="w-10 h-10 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">No page selected</h3>
                  <p className="text-gray-500">Select a page from the sidebar to view its content</p>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

// Import PageContent component
import PageContent from '@/components/PageContent';
