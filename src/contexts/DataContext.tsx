import React, { createContext, useContext, useState, ReactNode } from 'react';
import { 
  Book, Course, DeletedItem, 
  generateBooks, generateCourses, generateDeletedItems,
  getCourseStatus, getComplianceStats, getDepartmentBookCounts
} from '@/lib/mockData';

interface DataContextType {
  books: Book[];
  courses: Course[];
  deletedItems: DeletedItem[];
  
  // Book operations
  addBook: (book: Omit<Book, 'id' | 'status'>) => void;
  updateBook: (id: string, book: Partial<Book>) => void;
  deleteBook: (id: string, deletedBy: string) => void;
  
  // Course operations
  addCourse: (course: Omit<Course, 'id'>) => void;
  updateCourse: (id: string, course: Partial<Course>) => void;
  deleteCourse: (id: string, deletedBy: string) => void;
  assignBookToCourse: (courseId: string, bookId: string) => void;
  removeBookFromCourse: (courseId: string, bookId: string) => void;
  
  // Recycle bin operations
  restoreItem: (id: string) => void;
  permanentlyDeleteItem: (id: string) => void;
  emptyRecycleBin: () => void;
  
  // Import operations
  importBooks: (books: Omit<Book, 'id' | 'status'>[]) => void;
  
  // Stats
  getStats: () => ReturnType<typeof getComplianceStats>;
  getDepartmentStats: () => ReturnType<typeof getDepartmentBookCounts>;
  getCourseStatusFn: (course: Course) => ReturnType<typeof getCourseStatus>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [books, setBooks] = useState<Book[]>(generateBooks);
  const [courses, setCourses] = useState<Course[]>(generateCourses);
  const [deletedItems, setDeletedItems] = useState<DeletedItem[]>(generateDeletedItems);

  // Book operations
  const addBook = (book: Omit<Book, 'id' | 'status'>) => {
    const newBook: Book = {
      ...book,
      id: `b${Date.now()}`,
      status: 'available',
    };
    setBooks(prev => [...prev, newBook]);
  };

  const updateBook = (id: string, updates: Partial<Book>) => {
    setBooks(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
  };

  const deleteBook = (id: string, deletedBy: string) => {
    const book = books.find(b => b.id === id);
    if (book) {
      // Remove from any courses
      setCourses(prev => prev.map(c => ({
        ...c,
        assignedBookIds: c.assignedBookIds.filter(bid => bid !== id)
      })));
      
      // Add to deleted items
      const deletedItem: DeletedItem = {
        id: `d${Date.now()}`,
        name: book.title,
        type: 'book',
        deletedAt: new Date(),
        deletedBy,
        originalData: book,
      };
      setDeletedItems(prev => [...prev, deletedItem]);
      
      // Remove from books
      setBooks(prev => prev.filter(b => b.id !== id));
    }
  };

  // Course operations
  const addCourse = (course: Omit<Course, 'id'>) => {
    const newCourse: Course = {
      ...course,
      id: `c${Date.now()}`,
    };
    setCourses(prev => [...prev, newCourse]);
  };

  const updateCourse = (id: string, updates: Partial<Course>) => {
    setCourses(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const deleteCourse = (id: string, deletedBy: string) => {
    const course = courses.find(c => c.id === id);
    if (course) {
      const deletedItem: DeletedItem = {
        id: `d${Date.now()}`,
        name: `${course.code} - ${course.name}`,
        type: 'course',
        deletedAt: new Date(),
        deletedBy,
        originalData: course,
      };
      setDeletedItems(prev => [...prev, deletedItem]);
      setCourses(prev => prev.filter(c => c.id !== id));
    }
  };

  const assignBookToCourse = (courseId: string, bookId: string) => {
    setCourses(prev => prev.map(c => {
      if (c.id === courseId && !c.assignedBookIds.includes(bookId)) {
        return { ...c, assignedBookIds: [...c.assignedBookIds, bookId] };
      }
      return c;
    }));
    setBooks(prev => prev.map(b => b.id === bookId ? { ...b, status: 'assigned' } : b));
  };

  const removeBookFromCourse = (courseId: string, bookId: string) => {
    setCourses(prev => prev.map(c => {
      if (c.id === courseId) {
        return { ...c, assignedBookIds: c.assignedBookIds.filter(id => id !== bookId) };
      }
      return c;
    }));
    
    // Check if book is still assigned to any course
    const stillAssigned = courses.some(c => 
      c.id !== courseId && c.assignedBookIds.includes(bookId)
    );
    if (!stillAssigned) {
      setBooks(prev => prev.map(b => b.id === bookId ? { ...b, status: 'available' } : b));
    }
  };

  // Recycle bin operations
  const restoreItem = (id: string) => {
    const item = deletedItems.find(d => d.id === id);
    if (item) {
      if (item.type === 'book') {
        setBooks(prev => [...prev, item.originalData as Book]);
      } else {
        setCourses(prev => [...prev, item.originalData as Course]);
      }
      setDeletedItems(prev => prev.filter(d => d.id !== id));
    }
  };

  const permanentlyDeleteItem = (id: string) => {
    setDeletedItems(prev => prev.filter(d => d.id !== id));
  };

  const emptyRecycleBin = () => {
    setDeletedItems([]);
  };

  // Import operations
  const importBooks = (newBooks: Omit<Book, 'id' | 'status'>[]) => {
    const booksToAdd: Book[] = newBooks.map((book, index) => ({
      ...book,
      id: `b${Date.now()}_${index}`,
      status: 'available' as const,
    }));
    setBooks(prev => [...prev, ...booksToAdd]);
  };

  // Stats
  const getStats = () => getComplianceStats(courses, books);
  const getDepartmentStats = () => getDepartmentBookCounts(courses, books);
  const getCourseStatusFn = (course: Course) => getCourseStatus(course, books);

  return (
    <DataContext.Provider value={{
      books,
      courses,
      deletedItems,
      addBook,
      updateBook,
      deleteBook,
      addCourse,
      updateCourse,
      deleteCourse,
      assignBookToCourse,
      removeBookFromCourse,
      restoreItem,
      permanentlyDeleteItem,
      emptyRecycleBin,
      importBooks,
      getStats,
      getDepartmentStats,
      getCourseStatusFn,
    }}>
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
