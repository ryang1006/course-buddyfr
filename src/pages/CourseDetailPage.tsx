import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { supabase } from '@/lib/supabaseClient';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';

/* ---------------- Helpers ---------------- */

const EmptyText = () => (
  <span className="text-gray-400 italic">empty</span>
);

/* ---------------- Component ---------------- */

export default function CourseDetailPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {


    if (!courseId) return;

    const fetchCourse = async () => {
      try {
        setLoading(true);

        const { data, error } = await supabase
          .from('courses')
          .select(`
            id,
            official_code,
            title,
            department,
            course_books (
              books (
                id,
                title,
                author,
                publisher,
                year,
                call_number,
                accession_number
              )
            )
          `)
          .eq('id', courseId)
          .single();

        if (error) throw error;

        setCourse(data);
      } catch (err: any) {
        toast.error(err.message || 'Failed to load course');
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [courseId]);

  const books = (course?.course_books || [])
    ? course.course_books
        .map((cb: any) => cb.books)
        .filter(Boolean) // This removes any null/undefined entries if a book was deleted
    : [];

  return (
    <MainLayout
      title={course?.official_code}
      subtitle={course?.title}
    >
      <div className="bg-card rounded-xl shadow-card overflow-x-auto">
        <Table className="text-sm">
          <TableHeader className="bg-purple-100">
            <TableRow>
              <TableHead>SN</TableHead>
              <TableHead>AUTHOR</TableHead>
              <TableHead>TITLE</TableHead>
              <TableHead>PUBLISHER</TableHead>
              <TableHead>YEAR</TableHead>
              <TableHead>CALL #</TableHead>
              <TableHead>VOLS</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {!loading &&
              books.map((b: any, i: number) => (
                <TableRow key={b.id}>
                  <TableCell>{i + 1}</TableCell>
                  <TableCell>{b.author ?? <EmptyText />}</TableCell>
                  <TableCell>{b.title}</TableCell>
                  <TableCell>{b.publisher ?? <EmptyText />}</TableCell>
                  <TableCell>{b.year ?? <EmptyText />}</TableCell>
                  <TableCell>{b.call_number ?? <EmptyText />}</TableCell>
                  <TableCell>1</TableCell>
                </TableRow>
              ))}

            {!loading && books.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center text-muted-foreground py-6"
                >
                  No books assigned to this course
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </MainLayout>
  );
}
