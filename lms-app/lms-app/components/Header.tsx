'use client';

import { useState, useRef, useEffect } from 'react';
import { createClient } from '@/lib/supabase-client';
import { useRouter } from 'next/navigation';
import { User, Course } from '@/types';
import { 
  BookOpen, 
  ChevronDown, 
  LogOut, 
  User as UserIcon, 
  Settings,
  Bell,
  Search
} from 'lucide-react';

interface HeaderProps {
  user: User | null;
  courses: Course[];
  selectedCourse: Course | null;
  onCourseChange: (course: Course) => void;
}

export default function Header({ user, courses, selectedCourse, onCourseChange }: HeaderProps) {
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showCourseDropdown, setShowCourseDropdown] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const courseRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileDropdown(false);
      }
      if (courseRef.current && !courseRef.current.contains(event.target as Node)) {
        setShowCourseDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-700';
      case 'teacher': return 'bg-purple-100 text-purple-700';
      default: return 'bg-blue-100 text-blue-700';
    }
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-50">
      {/* Logo and Course Selector */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl" style={{ background: 'var(--gradient-primary)' }}>
            <BookOpen size={24} className="text-white" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            LearnFlow
          </span>
        </div>

        {/* Course Selector */}
        <div ref={courseRef} className="relative">
          <button
            onClick={() => setShowCourseDropdown(!showCourseDropdown)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <span className="text-sm font-medium text-gray-700">
              {selectedCourse?.title || 'Select Course'}
            </span>
            <ChevronDown size={16} className={`text-gray-500 transition-transform ${showCourseDropdown ? 'rotate-180' : ''}`} />
          </button>

          {showCourseDropdown && (
            <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-100 py-2 dropdown-enter">
              {courses.map((course) => (
                <button
                  key={course.id}
                  onClick={() => {
                    onCourseChange(course);
                    setShowCourseDropdown(false);
                  }}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                    selectedCourse?.id === course.id ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700'
                  }`}
                >
                  <div className="font-medium">{course.title}</div>
                  <div className="text-xs text-gray-500 mt-0.5 truncate">{course.description}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search..."
            className="w-64 pl-10 pr-4 py-2 bg-gray-50 border border-transparent focus:border-indigo-300 focus:bg-white rounded-xl text-sm outline-none transition-all"
          />
        </div>

        {/* Notifications */}
        <button className="p-2 hover:bg-gray-100 rounded-xl transition-colors relative">
          <Bell size={20} className="text-gray-600" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {/* Profile Dropdown */}
        <div ref={profileRef} className="relative">
          <button
            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
            className="flex items-center gap-3 p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
              {user?.full_name?.charAt(0) || user?.email?.charAt(0) || '?'}
            </div>
            <div className="hidden md:block text-left">
              <div className="text-sm font-medium text-gray-800">{user?.full_name || 'User'}</div>
              <div className="text-xs text-gray-500 capitalize">{user?.role}</div>
            </div>
            <ChevronDown size={16} className={`text-gray-500 transition-transform ${showProfileDropdown ? 'rotate-180' : ''}`} />
          </button>

          {showProfileDropdown && (
            <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-100 py-2 dropdown-enter">
              <div className="px-4 py-3 border-b border-gray-100">
                <div className="font-medium text-gray-800">{user?.full_name}</div>
                <div className="text-sm text-gray-500">{user?.email}</div>
                <span className={`inline-block mt-2 px-2 py-0.5 rounded-full text-xs font-medium capitalize ${getRoleBadgeColor(user?.role || 'student')}`}>
                  {user?.role}
                </span>
              </div>
              
              <div className="py-1">
                <button className="w-full flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-50 transition-colors">
                  <UserIcon size={18} />
                  <span>Profile</span>
                </button>
                <button className="w-full flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-50 transition-colors">
                  <Settings size={18} />
                  <span>Settings</span>
                </button>
              </div>
              
              <div className="border-t border-gray-100 pt-1">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut size={18} />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
