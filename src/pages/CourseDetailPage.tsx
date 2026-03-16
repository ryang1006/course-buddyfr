import { useEffect, useState, useCallback } from 'react';
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
import { Button } from '@/components/ui/button';
import { Edit } from 'lucide-react';
import CourseEditModal from '@/components/courses/CourseEditModal';

/* ---------------- Helpers ---------------- */

const EmptyText = () => (
  <span className="text-gray-400 italic">empty</span>
);

/* ---------------- Component ---------------- */

export default function CourseDetailPage() {
  const { id } = useParams<{ id: string }>(); 
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // State for the Edit Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Extracted fetch logic so we can call it after closing the edit modal
  const fetchCourse = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      console.log("Starting Supabase request for UUID:", id);

      // CRITICAL UPDATE: Added aliases and manually_edited to the select query
      const { data, error } = await supabase
        .from('courses')
        .select(`
          id,
          official_code,
          title,
          department,
          aliases,
          manually_edited,
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
  }, [id]);

  useEffect(() => {
    fetchCourse();
  }, [fetchCourse]);

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
      {/* Action Bar */}
      <div className="flex justify-end mb-4">
        <Button 
          onClick={() => setIsEditModalOpen(true)}
          disabled={!course || loading}
          className="flex items-center gap-2"
        >
          <Edit className="w-4 h-4" />
          Edit Course
        </Button>
      </div>

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
                  <TableCell>{b.volume_count ?? 1}</TableCell>
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

      {/* Render Modal */}
      {course && (
        <CourseEditModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            fetchCourse(); // Refresh the page data automatically after saving!
          }}
          course={course}
        />
      )}
    </MainLayout>
  );
}