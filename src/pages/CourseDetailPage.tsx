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
  // Use 'id' to match the URL parameter: /courses/:id
  const { id } = useParams<{ id: string }>(); 
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If no ID is present, don't bother fetching
    if (!id) return;

    const fetchCourse = async () => {
      try {
        setLoading(true);
        console.log("Starting Supabase request for UUID:", id);

        const { data, error } = await supabase
          .from('courses')
          .select(`
            id,
            official_code,
            title,
            department,
            course_books (
              book_id,
              books (*)
            )
          `)
          .eq('id', id)
          .single();

        if (error) throw error;
        
        if (data) {
          console.log("Raw Supabase Data:", data);
          setCourse(data);
        }
      } catch (err: any) {
        console.error("Detailed Fetch Error:", err);
        toast.error(err.message || 'Failed to load course');
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [id]); // Dependency should be 'id'

  // Derived state: Extract the books from the nested course_books relationship
  const books = course?.course_books
    ? course.course_books
        .map((cb: any) => cb.books)
        .filter(Boolean) 
    : [];

  return (
    <MainLayout
      title={course?.official_code || 'Loading...'}
      subtitle={course?.title || ''}
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
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                </TableCell>
              </TableRow>
            ) : books.length > 0 ? (
              books.map((b: any, i: number) => (
                <TableRow key={b.id || i}>
                  <TableCell>{i + 1}</TableCell>
                  <TableCell>{b.author ?? <EmptyText />}</TableCell>
                  <TableCell>{b.title}</TableCell>
                  <TableCell>{b.publisher ?? <EmptyText />}</TableCell>
                  <TableCell>{b.year ?? <EmptyText />}</TableCell>
                  <TableCell>{b.call_number ?? <EmptyText />}</TableCell>
                  <TableCell>1</TableCell>
                </TableRow>
              ))
            ) : (
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