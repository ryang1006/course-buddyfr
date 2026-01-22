// Mock Users
export interface User {
  id: string;
  username: string;
  password: string;
  name: string;
  role: 'admin' | 'librarian';
  avatar?: string;
}

export const users: User[] = [
  { id: '1', username: 'admin', password: 'admin123', name: 'Dr. Maria Santos', role: 'admin' },
  { id: '2', username: 'librarian', password: 'lib123', name: 'Juan Dela Cruz', role: 'librarian' },
];

// Mock Books
export interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  publicationYear: number;
  subjectCode: string;
  status: 'available' | 'assigned';
  deletedAt?: Date;
  deletedBy?: string;
}

const currentYear = new Date().getFullYear();
const fiveYearsAgo = currentYear - 5;

export const generateBooks = (): Book[] => [
  // IT Books - Recent
  { id: 'b1', title: 'Clean Code: A Handbook of Agile Software Craftsmanship', author: 'Robert C. Martin', isbn: '978-0132350884', publicationYear: 2024, subjectCode: 'IT101', status: 'available' },
  { id: 'b2', title: 'Introduction to Algorithms', author: 'Thomas H. Cormen', isbn: '978-0262046305', publicationYear: 2023, subjectCode: 'IT102', status: 'assigned' },
  { id: 'b3', title: 'Design Patterns: Elements of Reusable Object-Oriented Software', author: 'Gang of Four', isbn: '978-0201633610', publicationYear: 2024, subjectCode: 'IT103', status: 'available' },
  { id: 'b4', title: 'The Pragmatic Programmer', author: 'David Thomas', isbn: '978-0135957059', publicationYear: 2023, subjectCode: 'IT101', status: 'available' },
  { id: 'b5', title: 'Structure and Interpretation of Computer Programs', author: 'Harold Abelson', isbn: '978-0262510875', publicationYear: 2022, subjectCode: 'IT102', status: 'assigned' },
  { id: 'b6', title: 'Artificial Intelligence: A Modern Approach', author: 'Stuart Russell', isbn: '978-0134610993', publicationYear: 2024, subjectCode: 'IT201', status: 'available' },
  { id: 'b7', title: 'Deep Learning', author: 'Ian Goodfellow', isbn: '978-0262035613', publicationYear: 2023, subjectCode: 'IT201', status: 'available' },
  { id: 'b8', title: 'Machine Learning Yearning', author: 'Andrew Ng', isbn: '978-1234567890', publicationYear: 2024, subjectCode: 'IT201', status: 'available' },
  
  // Engineering Books - Recent
  { id: 'b9', title: 'Engineering Mechanics: Statics', author: 'J.L. Meriam', isbn: '978-1119723448', publicationYear: 2024, subjectCode: 'CE101', status: 'available' },
  { id: 'b10', title: 'Fundamentals of Electric Circuits', author: 'Charles K. Alexander', isbn: '978-0078028229', publicationYear: 2023, subjectCode: 'EE101', status: 'assigned' },
  { id: 'b11', title: 'Thermodynamics: An Engineering Approach', author: 'Yunus Cengel', isbn: '978-0073398174', publicationYear: 2024, subjectCode: 'ME101', status: 'available' },
  { id: 'b12', title: 'Structural Analysis', author: 'R.C. Hibbeler', isbn: '978-0134610672', publicationYear: 2023, subjectCode: 'CE102', status: 'available' },
  { id: 'b13', title: 'Control Systems Engineering', author: 'Norman S. Nise', isbn: '978-1119474227', publicationYear: 2022, subjectCode: 'EE102', status: 'available' },
  { id: 'b14', title: 'Fluid Mechanics', author: 'Frank M. White', isbn: '978-0073398273', publicationYear: 2024, subjectCode: 'ME102', status: 'available' },
  { id: 'b15', title: 'Materials Science and Engineering', author: 'William D. Callister', isbn: '978-1119405498', publicationYear: 2023, subjectCode: 'CE103', status: 'available' },
  
  // Math Books - Recent
  { id: 'b16', title: 'Calculus: Early Transcendentals', author: 'James Stewart', isbn: '978-1285741550', publicationYear: 2024, subjectCode: 'MATH101', status: 'assigned' },
  { id: 'b17', title: 'Linear Algebra and Its Applications', author: 'David C. Lay', isbn: '978-0321982384', publicationYear: 2023, subjectCode: 'MATH102', status: 'available' },
  { id: 'b18', title: 'Discrete Mathematics and Its Applications', author: 'Kenneth H. Rosen', isbn: '978-0073383095', publicationYear: 2024, subjectCode: 'MATH103', status: 'available' },
  { id: 'b19', title: 'Probability and Statistics', author: 'Morris H. DeGroot', isbn: '978-0321500465', publicationYear: 2022, subjectCode: 'MATH104', status: 'available' },
  { id: 'b20', title: 'Differential Equations', author: 'Dennis G. Zill', isbn: '978-1305965720', publicationYear: 2024, subjectCode: 'MATH105', status: 'available' },
  
  // Science Books - Recent
  { id: 'b21', title: 'University Physics', author: 'Hugh D. Young', isbn: '978-0133969290', publicationYear: 2024, subjectCode: 'PHYS101', status: 'available' },
  { id: 'b22', title: 'Chemistry: The Central Science', author: 'Theodore Brown', isbn: '978-0134414232', publicationYear: 2023, subjectCode: 'CHEM101', status: 'assigned' },
  { id: 'b23', title: 'Biology', author: 'Neil A. Campbell', isbn: '978-0134093413', publicationYear: 2024, subjectCode: 'BIO101', status: 'available' },
  { id: 'b24', title: 'Organic Chemistry', author: 'Paula Yurkanis Bruice', isbn: '978-0134042282', publicationYear: 2023, subjectCode: 'CHEM102', status: 'available' },
  { id: 'b25', title: 'Fundamentals of Physics', author: 'David Halliday', isbn: '978-1118230718', publicationYear: 2022, subjectCode: 'PHYS102', status: 'available' },
  
  // General Education Books - Recent
  { id: 'b26', title: 'Technical Writing', author: 'John M. Lannon', isbn: '978-0134118499', publicationYear: 2024, subjectCode: 'GE101', status: 'available' },
  { id: 'b27', title: 'Ethics: Theory and Contemporary Issues', author: 'Barbara MacKinnon', isbn: '978-1305958678', publicationYear: 2023, subjectCode: 'GE102', status: 'available' },
  { id: 'b28', title: 'The Art of Public Speaking', author: 'Stephen E. Lucas', isbn: '978-1259924620', publicationYear: 2024, subjectCode: 'GE103', status: 'available' },
  { id: 'b29', title: 'Critical Thinking', author: 'Brooke Noel Moore', isbn: '978-0078038280', publicationYear: 2023, subjectCode: 'GE104', status: 'available' },
  { id: 'b30', title: 'World History', author: 'William J. Duiker', isbn: '978-1337401043', publicationYear: 2024, subjectCode: 'GE105', status: 'available' },
  
  // Outdated Books (older than 5 years)
  { id: 'b31', title: 'Programming in C (3rd Edition)', author: 'Stephen G. Kochan', isbn: '978-0672326660', publicationYear: 2019, subjectCode: 'IT101', status: 'assigned' },
  { id: 'b32', title: 'Database System Concepts (6th Ed)', author: 'Abraham Silberschatz', isbn: '978-0073523323', publicationYear: 2018, subjectCode: 'IT103', status: 'assigned' },
  { id: 'b33', title: 'Computer Networks (5th Ed)', author: 'Andrew S. Tanenbaum', isbn: '978-0132126953', publicationYear: 2019, subjectCode: 'IT102', status: 'assigned' },
  { id: 'b34', title: 'Operating System Concepts (9th Ed)', author: 'Abraham Silberschatz', isbn: '978-1118063330', publicationYear: 2018, subjectCode: 'IT103', status: 'assigned' },
  { id: 'b35', title: 'Engineering Mathematics (Old Ed)', author: 'K.A. Stroud', isbn: '978-0831134709', publicationYear: 2020, subjectCode: 'MATH101', status: 'assigned' },
  
  // More recent books for variety
  { id: 'b36', title: 'Web Development with Node and Express', author: 'Ethan Brown', isbn: '978-1492053514', publicationYear: 2024, subjectCode: 'IT104', status: 'available' },
  { id: 'b37', title: 'React Up & Running', author: 'Stoyan Stefanov', isbn: '978-1492051466', publicationYear: 2023, subjectCode: 'IT104', status: 'available' },
  { id: 'b38', title: 'Python Crash Course', author: 'Eric Matthes', isbn: '978-1593279288', publicationYear: 2024, subjectCode: 'IT105', status: 'available' },
  { id: 'b39', title: 'JavaScript: The Good Parts', author: 'Douglas Crockford', isbn: '978-0596517748', publicationYear: 2023, subjectCode: 'IT104', status: 'available' },
  { id: 'b40', title: 'Learning SQL', author: 'Alan Beaulieu', isbn: '978-1492057611', publicationYear: 2024, subjectCode: 'IT103', status: 'available' },
  
  { id: 'b41', title: 'Reinforced Concrete Design', author: 'Chu-Kia Wang', isbn: '978-0470279274', publicationYear: 2023, subjectCode: 'CE104', status: 'available' },
  { id: 'b42', title: 'Steel Design', author: 'William T. Segui', isbn: '978-1337094740', publicationYear: 2024, subjectCode: 'CE105', status: 'available' },
  { id: 'b43', title: 'Microelectronic Circuits', author: 'Adel S. Sedra', isbn: '978-0199339136', publicationYear: 2023, subjectCode: 'EE103', status: 'available' },
  { id: 'b44', title: 'Power System Analysis', author: 'John J. Grainger', isbn: '978-0070612938', publicationYear: 2024, subjectCode: 'EE104', status: 'available' },
  { id: 'b45', title: 'Heat and Mass Transfer', author: 'Yunus Cengel', isbn: '978-0073398181', publicationYear: 2023, subjectCode: 'ME103', status: 'available' },
  
  { id: 'b46', title: 'Machine Design', author: 'Robert L. Norton', isbn: '978-0133356717', publicationYear: 2024, subjectCode: 'ME104', status: 'available' },
  { id: 'b47', title: 'Environmental Engineering', author: 'Howard S. Peavy', isbn: '978-0070491342', publicationYear: 2023, subjectCode: 'CE106', status: 'available' },
  { id: 'b48', title: 'Digital Signal Processing', author: 'John G. Proakis', isbn: '978-0131873742', publicationYear: 2024, subjectCode: 'EE105', status: 'available' },
  { id: 'b49', title: 'Computer Architecture', author: 'John L. Hennessy', isbn: '978-0128119051', publicationYear: 2023, subjectCode: 'IT106', status: 'available' },
  { id: 'b50', title: 'Software Engineering', author: 'Ian Sommerville', isbn: '978-0137035151', publicationYear: 2024, subjectCode: 'IT107', status: 'available' },
];

// Mock Courses
export interface Course {
  id: string;
  code: string;
  name: string;
  program: string;
  department: string;
  assignedBookIds: string[];
  deletedAt?: Date;
  deletedBy?: string;
}

export const generateCourses = (): Course[] => [
  // Complete courses (5+ recent books)
  { id: 'c1', code: 'IT101', name: 'Introduction to Programming', program: 'BSIT', department: 'Computer Studies', assignedBookIds: ['b1', 'b4', 'b36', 'b37', 'b38'] },
  { id: 'c2', code: 'IT201', name: 'Artificial Intelligence', program: 'BSIT', department: 'Computer Studies', assignedBookIds: ['b6', 'b7', 'b8', 'b49', 'b50'] },
  { id: 'c3', code: 'CE101', name: 'Statics and Dynamics', program: 'BSCE', department: 'Civil Engineering', assignedBookIds: ['b9', 'b12', 'b15', 'b41', 'b42'] },
  { id: 'c4', code: 'MATH101', name: 'Calculus I', program: 'General', department: 'Mathematics', assignedBookIds: ['b16', 'b17', 'b18', 'b19', 'b20'] },
  { id: 'c5', code: 'GE101', name: 'Technical Communication', program: 'General', department: 'General Education', assignedBookIds: ['b26', 'b27', 'b28', 'b29', 'b30'] },
  
  // Incomplete courses (less than 5 books)
  { id: 'c6', code: 'IT102', name: 'Data Structures', program: 'BSIT', department: 'Computer Studies', assignedBookIds: ['b2', 'b5'] },
  { id: 'c7', code: 'IT103', name: 'Database Management', program: 'BSIT', department: 'Computer Studies', assignedBookIds: ['b3', 'b40'] },
  { id: 'c8', code: 'EE101', name: 'Circuit Analysis', program: 'BSEE', department: 'Electrical Engineering', assignedBookIds: ['b10', 'b13'] },
  { id: 'c9', code: 'ME101', name: 'Thermodynamics', program: 'BSME', department: 'Mechanical Engineering', assignedBookIds: ['b11', 'b14'] },
  { id: 'c10', code: 'PHYS101', name: 'Physics I', program: 'General', department: 'Natural Sciences', assignedBookIds: ['b21', 'b25'] },
  { id: 'c11', code: 'CHEM101', name: 'General Chemistry', program: 'General', department: 'Natural Sciences', assignedBookIds: ['b22'] },
  
  // Outdated courses (has books older than 5 years)
  { id: 'c12', code: 'IT104', name: 'Web Development', program: 'BSIT', department: 'Computer Studies', assignedBookIds: ['b31', 'b36', 'b37', 'b39'] },
  { id: 'c13', code: 'IT105', name: 'Operating Systems', program: 'BSIT', department: 'Computer Studies', assignedBookIds: ['b32', 'b33', 'b34', 'b38', 'b49'] },
  { id: 'c14', code: 'MATH102', name: 'Engineering Mathematics', program: 'Engineering', department: 'Mathematics', assignedBookIds: ['b35', 'b17', 'b18', 'b19', 'b20'] },
  { id: 'c15', code: 'IT106', name: 'Computer Networks', program: 'BSIT', department: 'Computer Studies', assignedBookIds: ['b33', 'b48'] },
];

// Recycle Bin Items
export interface DeletedItem {
  id: string;
  name: string;
  type: 'book' | 'course';
  deletedAt: Date;
  deletedBy: string;
  originalData: Book | Course;
}

export const generateDeletedItems = (): DeletedItem[] => [
  {
    id: 'd1',
    name: 'Outdated Programming Guide',
    type: 'book',
    deletedAt: new Date('2024-01-15'),
    deletedBy: 'Dr. Maria Santos',
    originalData: { id: 'del-b1', title: 'Outdated Programming Guide', author: 'Old Author', isbn: '978-0000000001', publicationYear: 2015, subjectCode: 'IT101', status: 'available' } as Book
  },
  {
    id: 'd2',
    name: 'Legacy Systems Course',
    type: 'course',
    deletedAt: new Date('2024-01-10'),
    deletedBy: 'Juan Dela Cruz',
    originalData: { id: 'del-c1', code: 'IT000', name: 'Legacy Systems Course', program: 'BSIT', department: 'Computer Studies', assignedBookIds: [] } as Course
  },
  {
    id: 'd3',
    name: 'COBOL Programming',
    type: 'book',
    deletedAt: new Date('2024-01-08'),
    deletedBy: 'Dr. Maria Santos',
    originalData: { id: 'del-b2', title: 'COBOL Programming', author: 'Grace Hopper', isbn: '978-0000000002', publicationYear: 2010, subjectCode: 'IT101', status: 'available' } as Book
  },
  {
    id: 'd4',
    name: 'Assembly Language Basics',
    type: 'book',
    deletedAt: new Date('2024-01-05'),
    deletedBy: 'Juan Dela Cruz',
    originalData: { id: 'del-b3', title: 'Assembly Language Basics', author: 'Low Level', isbn: '978-0000000003', publicationYear: 2012, subjectCode: 'IT102', status: 'available' } as Book
  },
  {
    id: 'd5',
    name: 'Deprecated Course XYZ',
    type: 'course',
    deletedAt: new Date('2024-01-02'),
    deletedBy: 'Dr. Maria Santos',
    originalData: { id: 'del-c2', code: 'OLD001', name: 'Deprecated Course XYZ', program: 'BSIT', department: 'Computer Studies', assignedBookIds: [] } as Course
  },
];

// Helper functions
export const isBookRecent = (publicationYear: number): boolean => {
  const currentYear = new Date().getFullYear();
  return publicationYear >= currentYear - 5;
};

export const getCourseStatus = (course: Course, books: Book[]): 'complete' | 'incomplete' | 'outdated' => {
  const assignedBooks = books.filter(b => course.assignedBookIds.includes(b.id));
  
  if (assignedBooks.length < 5) {
    return 'incomplete';
  }
  
  const hasOutdatedBook = assignedBooks.some(b => !isBookRecent(b.publicationYear));
  if (hasOutdatedBook) {
    return 'outdated';
  }
  
  return 'complete';
};

export const getComplianceStats = (courses: Course[], books: Book[]) => {
  const stats = {
    total: courses.length,
    complete: 0,
    incomplete: 0,
    outdated: 0,
  };
  
  courses.forEach(course => {
    const status = getCourseStatus(course, books);
    stats[status]++;
  });
  
  return stats;
};

export const getDepartmentBookCounts = (courses: Course[], books: Book[]) => {
  const departments: { [key: string]: number } = {};
  
  courses.forEach(course => {
    if (!departments[course.department]) {
      departments[course.department] = 0;
    }
    departments[course.department] += course.assignedBookIds.length;
  });
  
  return Object.entries(departments).map(([name, count]) => ({ name, count }));
};
