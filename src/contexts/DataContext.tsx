import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

// --- ADAPTED TYPES (Matches your UI requirements) ---
export interface Course {
  id: string;
  code: string;       // UI expects 'code' instead of 'official_code'
  name: string;       // UI expects 'name' instead of 'title'
  program: string;    // UI expects 'program' instead of 'department[]'
  department: string[];
  course_type: string;
  assignedBookIds: string[]; // Dashboard needs this to check compliance
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

interface DataContextType {
  courses: Course[];
  books: Book[];
  loading: boolean;
  refreshData: () => Promise<void>;
  getStats: () => { total: number; complete: number; incomplete: number; outdated: number; };
  getDepartmentStats: () => { name: string; total: number; complete: number; }[];
  getCourseStatusFn: (status: string) => Course[];
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshData = useCallback(async () => {
    setLoading(true);
    try {
      const [coursesRes, booksRes, linksRes] = await Promise.all([
        supabase.from('courses').select('*').order('official_code'),
        supabase.from('books').select('*'),
        supabase.from('course_books').select('course_id, book_id')
      ]);

      if (coursesRes.error) throw coursesRes.error;
      if (booksRes.error) throw booksRes.error;
      if (linksRes.error) throw linksRes.error;

      const rawCourses = coursesRes.data || [];
      const rawBooks = booksRes.data || [];
      const rawLinks = linksRes.data || [];

      // --- ADAPTER LOGIC: Transform Supabase rows to UI-friendly objects ---
      const transformedCourses: Course[] = rawCourses.map(rc => {
        // Find links using either the official_code or the UUID
        const links = rawLinks.filter(l => 
          l.course_id === rc.official_code || l.course_id === rc.id
        );
        
        return {
          id: rc.id,
          code: rc.official_code,           // Map official_code -> code
          name: rc.title,                   // Map title -> name
          program: rc.department?.[0] || 'Unknown', // Map first dept -> program
          department: rc.department || [],
          course_type: rc.course_type,
          assignedBookIds: links.map(l => l.book_id), // Provide the ID list for status checks
          updated_at: rc.updated_at
        };
      });

      setCourses(transformedCourses);
      setBooks(rawBooks);
    } catch (error) {
      console.error('Data loading error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // --- STATS HELPER FUNCTIONS ---

  const getStats = () => {
    const total = courses.length;
    // Complete = at least 1 book assigned
    const complete = courses.filter(c => c.assignedBookIds.length > 0).length;
    const incomplete = total - complete;
    const outdated = 0; // Placeholder for year-based logic

    return { total, complete, incomplete, outdated };
  };

  const getDepartmentStats = () => {
    // Grouping stats by the first department entry (program)
    const depts = Array.from(new Set(courses.map(c => c.program)));
    return depts.map(dept => {
      const deptCourses = courses.filter(c => c.program === dept);
      return {
        name: dept,
        total: deptCourses.length,
        complete: deptCourses.filter(c => c.assignedBookIds.length > 0).length
      };
    });
  };

  const getCourseStatusFn = (status: string) => {
    switch (status) {
      case 'complete': return courses.filter(c => c.assignedBookIds.length > 0);
      case 'incomplete': return courses.filter(c => c.assignedBookIds.length === 0);
      default: return courses;
    }
  };

  return (
    <DataContext.Provider 
      value={{ 
        courses, 
        books, 
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