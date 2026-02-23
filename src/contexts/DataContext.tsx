import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

// --- ADAPTED TYPES ---
export interface Course {
  id: string;
  code: string;       
  name: string;       
  program: string;    
  department: string[];
  course_type: string;
  assignedBookIds: string[]; 
  updated_at?: string;
}

export interface Book {
  id: string;
  title: string;
  author: string | null;
  publisher: string | null;
  year: number | null;
  call_number: string | null;
  accession_number: string | null;
  source_type: string;
}

export interface CourseBook {
  course_id: string;
  book_id: string;
}

interface DataContextType {
  courses: Course[];
  books: Book[];
  totalBookCount: number; // Added to handle the 1000+ limit
  loading: boolean;
  refreshData: () => Promise<void>;
  getStats: () => { total: number; complete: number; incomplete: number; outdated: number; };
  getDepartmentStats: () => { name: string; total: number; complete: number; }[];
  getCourseStatusFn: (course: Course) => 'complete' | 'incomplete' | 'outdated';
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [courseBooks, setCourseBooks] = useState<CourseBook[]>([]);
  const [totalBookCount, setTotalBookCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const refreshData = useCallback(async () => {
    setLoading(true);
    try {
      // Parallel fetch for speed
      const [coursesRes, booksRes, linksRes, countRes] = await Promise.all([
        supabase.from('courses').select('*').order('official_code'),
        supabase.from('books').select('*').limit(1000), // List limit
        supabase.from('course_books').select('*'),
        supabase.from('books').select('*', { count: 'exact', head: true }) // Total count
      ]);

      if (coursesRes.error) throw coursesRes.error;
      if (booksRes.error) throw booksRes.error;
      if (linksRes.error) throw linksRes.error;

      const rawCourses = coursesRes.data || [];
      const rawBooks = booksRes.data || [];
      const rawLinks = linksRes.data || [];

      // Update basic states
      setBooks(rawBooks);
      setCourseBooks(rawLinks);
      setTotalBookCount(countRes.count || 0);

      if (countRes.count != null){
        setTotalBookCount(countRes.count)
      }

      // --- ADAPTER LOGIC ---
      const transformedCourses: Course[] = rawCourses.map(rc => {
        const links = rawLinks.filter(l => 
          l.course_id === rc.official_code || l.course_id === rc.id
        );
        
        return {
          id: rc.id,
          code: rc.official_code,
          name: rc.title,
          program: rc.department?.[0] || 'Unknown',
          department: rc.department || [],
          course_type: rc.course_type,
          assignedBookIds: links.map(l => l.book_id),
          updated_at: rc.updated_at
        };
      });

      setCourses(transformedCourses);
    } catch (error) {
      console.error('Data loading error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const getStats = () => {
    const total = courses.length;
    const complete = courses.filter(c => c.assignedBookIds.length >= 5).length;
    const incomplete = courses.filter(c => c.assignedBookIds.length > 0 && c.assignedBookIds.length < 5).length;
    const outdated = total - (complete + incomplete);

    return { total, complete, incomplete, outdated };
  };

  const getDepartmentStats = () => {
    const depts = Array.from(new Set(courses.map(c => c.program)));
    return depts.map(dept => {
      const deptCourses = courses.filter(c => c.program === dept);
      return {
        name: dept,
        total: deptCourses.length,
        complete: deptCourses.filter(c => c.assignedBookIds.length >= 5).length
      };
    });
  };

  const getCourseStatusFn = (course: Course) => {
    const count = course.assignedBookIds.length;
    if (count >= 5) return 'complete';
    if (count > 0) return 'incomplete';
    return 'outdated';
  };

  return (
    <DataContext.Provider 
      value={{ 
        courses, 
        books, 
        totalBookCount,
        loading, 
        refreshData, 
        getStats, 
        getDepartmentStats, 
        getCourseStatusFn 
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};