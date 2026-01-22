import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { isBookRecent } from '@/lib/mockData';
import { 
  ArrowLeft, 
  BookOpen, 
  Plus, 
  X, 
  Search, 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  Calendar
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const statusConfig = {
  complete: {
    label: 'Compliant',
    icon: CheckCircle,
    className: 'bg-success/10 text-success border-success/20',
    bgClass: 'bg-success/5',
  },
  incomplete: {
    label: 'Incomplete',
    icon: AlertTriangle,
    className: 'bg-warning/10 text-warning border-warning/20',
    bgClass: 'bg-warning/5',
  },
  outdated: {
    label: 'Outdated',
    icon: XCircle,
    className: 'bg-danger/10 text-danger border-danger/20',
    bgClass: 'bg-danger/5',
  },
};

export default function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { courses, books, getCourseStatusFn, assignBookToCourse, removeBookFromCourse } = useData();
  
  const [search, setSearch] = useState('');

  const course = courses.find(c => c.id === id);
  
  const status = course ? getCourseStatusFn(course) : 'incomplete';
  const config = statusConfig[status];
  const StatusIcon = config.icon;

  const assignedBooks = useMemo(() => {
    if (!course) return [];
    return books.filter(b => course.assignedBookIds.includes(b.id));
  }, [course, books]);

  const availableBooks = useMemo(() => {
    if (!course) return [];
    return books.filter(b => 
      !course.assignedBookIds.includes(b.id) && 
      isBookRecent(b.publicationYear)
    );
  }, [course, books]);

  const filteredAvailableBooks = useMemo(() => {
    if (!search) return availableBooks;
    const searchLower = search.toLowerCase();
    return availableBooks.filter(
      b =>
        b.title.toLowerCase().includes(searchLower) ||
        b.author.toLowerCase().includes(searchLower) ||
        b.subjectCode.toLowerCase().includes(searchLower)
    );
  }, [availableBooks, search]);

  const progress = Math.min((assignedBooks.length / 5) * 100, 100);

  const handleAssign = (bookId: string) => {
    if (!course) return;
    assignBookToCourse(course.id, bookId);
    toast.success('Book assigned to course');
  };

  const handleRemove = (bookId: string) => {
    if (!course) return;
    removeBookFromCourse(course.id, bookId);
    toast.success('Book removed from course');
  };

  if (!course) {
    return (
      <MainLayout title="Course Not Found" subtitle="">
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">The course you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/courses')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Courses
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout 
      title={`${course.code} - ${course.name}`}
      subtitle={`${course.program} • ${course.department}`}
    >
      <Button 
        variant="ghost" 
        className="mb-6"
        onClick={() => navigate('/courses')}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Courses
      </Button>

      {/* Status Header */}
      <div className={cn(
        "rounded-xl p-6 mb-6 animate-slide-up",
        config.bgClass
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={cn(
              "w-12 h-12 rounded-lg flex items-center justify-center",
              status === 'complete' && "bg-success/20",
              status === 'incomplete' && "bg-warning/20",
              status === 'outdated' && "bg-danger/20"
            )}>
              <StatusIcon className={cn(
                "w-6 h-6",
                status === 'complete' && "text-success",
                status === 'incomplete' && "text-warning",
                status === 'outdated' && "text-danger"
              )} />
            </div>
            <div>
              <Badge variant="outline" className={config.className}>
                {config.label}
              </Badge>
              <p className="text-sm text-muted-foreground mt-1">
                {status === 'complete' && 'This course meets all compliance requirements'}
                {status === 'incomplete' && 'This course needs at least 5 books assigned'}
                {status === 'outdated' && 'This course has books older than 5 years'}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold">{assignedBooks.length}/5</p>
            <p className="text-sm text-muted-foreground">books assigned</p>
          </div>
        </div>
        <Progress value={progress} className="mt-4 h-2" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assigned Books */}
        <div className="bg-card rounded-xl shadow-card animate-slide-up" style={{ animationDelay: '100ms' }}>
          <div className="p-6 border-b border-border">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-lg">Assigned Books</h3>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Books currently assigned to this course
            </p>
          </div>
          <div className="divide-y divide-border max-h-[500px] overflow-auto">
            {assignedBooks.length === 0 ? (
              <div className="p-8 text-center">
                <BookOpen className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                <p className="text-muted-foreground">No books assigned yet</p>
              </div>
            ) : (
              assignedBooks.map((book) => {
                const isRecent = isBookRecent(book.publicationYear);
                return (
                  <div key={book.id} className="p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">{book.title}</p>
                        <p className="text-sm text-muted-foreground">{book.author}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "text-xs",
                              isRecent 
                                ? 'bg-success/10 text-success border-success/20' 
                                : 'bg-danger/10 text-danger border-danger/20'
                            )}
                          >
                            <Calendar className="w-3 h-3 mr-1" />
                            {book.publicationYear}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {book.subjectCode}
                          </Badge>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-danger hover:text-danger hover:bg-danger/10 flex-shrink-0"
                        onClick={() => handleRemove(book.id)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Available Books */}
        <div className="bg-card rounded-xl shadow-card animate-slide-up" style={{ animationDelay: '200ms' }}>
          <div className="p-6 border-b border-border">
            <div className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-success" />
              <h3 className="font-semibold text-lg">Available Books</h3>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Recent books (≤5 years) available for assignment
            </p>
            <div className="relative mt-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search available books..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="divide-y divide-border max-h-[400px] overflow-auto">
            {filteredAvailableBooks.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-muted-foreground">No matching books found</p>
              </div>
            ) : (
              filteredAvailableBooks.map((book) => (
                <div key={book.id} className="p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{book.title}</p>
                      <p className="text-sm text-muted-foreground">{book.author}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-xs bg-success/10 text-success border-success/20">
                          <Calendar className="w-3 h-3 mr-1" />
                          {book.publicationYear}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {book.subjectCode}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-success hover:text-success hover:bg-success/10 flex-shrink-0"
                      onClick={() => handleAssign(book.id)}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
