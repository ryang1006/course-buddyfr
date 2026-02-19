import { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  CheckCircle,
  AlertTriangle,
  XCircle,
} from 'lucide-react';

/* ---------------- Types ---------------- */

type CourseRow = {
  id: string;
  official_code: string;
  title: string;
  department: string[];
  course_books: { book_id: string }[];
};

/* ---------------- Component ---------------- */

export default function CoursesPage() {
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('courses')
        .select(`
          id,
          official_code,
          title,
          department,
          course_books ( book_id )
        `)
        .order('official_code');

      if (error) throw error;

      setCourses(data || []);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getBookCount = (course: CourseRow) =>
    course.course_books?.length ?? 0;

  const getCourseStatus = (course: CourseRow) => {
    const count = getBookCount(course);
    if (count >= 5) return 'complete';
    if (count > 0) return 'incomplete';
    return 'outdated';
  };

  const StatusIcon = ({ status }: { status: string }) => {
    switch (status) {
      case 'complete':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'incomplete':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      default:
        return <XCircle className="w-4 h-4 text-red-500" />;
    }
  };

  return (
    <MainLayout title='Courses'>
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold">Courses</h1>

        {loading ? (
          <div className="text-center text-gray-400 py-10">
            Loading courses…
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {courses.map((course) => {
              const count = getBookCount(course);
              const status = getCourseStatus(course);

              return (
                <Link
                  key={course.id}
                  to={`/courses/${course.id}`}
                  className="block"
                >
                  <div
                    className="
                      rounded-xl border bg-white
                      p-4 space-y-3
                      shadow-sm hover:shadow-md
                      hover:ring-2 hover:ring-primary/40
                      transition
                      cursor-pointer
                    "
                  >
                    {/* Header */}
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-mono text-sm text-gray-500">
                          {course.official_code}
                        </div>
                        <div className="font-semibold leading-tight">
                          {course.title}
                        </div>
                      </div>

                      <StatusIcon status={status} />
                    </div>

                    {/* Department */}
                    <div className="text-sm text-gray-500">
                      {course.department?.join(', ') || 'Unassigned'}
                    </div>

                    {/* Footer */}
                    <div className="flex justify-between items-center pt-2 border-t">
                      <div className="flex items-center gap-1 text-sm">
                        <BookOpen className="w-4 h-4" />
                        {count} book{count !== 1 && 's'}
                      </div>

                      <span
                        className={`
                          text-xs font-medium px-2 py-1 rounded-full
                          ${
                            status === 'complete'
                              ? 'bg-green-100 text-green-700'
                              : status === 'incomplete'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-red-100 text-red-700'
                          }
                        `}
                      >
                        {status}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
