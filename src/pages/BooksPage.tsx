import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import Select from 'react-select'; //
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
/*helpers */
const EmptyText = () => (
  <span className="text-gray-400 italic select-none">empty</span>
);

const TruncatedCell = ({
  value,
  maxWidth = 'max-w-[8rem]',
}: {
  value?: string;
  maxWidth?: string;
}) => {
  if (!value) return <EmptyText />;

  return (
    <span
      title={value}
      className={`block truncate ${maxWidth} cursor-help`}
    >
      {value}
    </span>
  );
};

export default function BooksPage() {
  const [books, setBooks] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]); // New: for the dropdown
  const [selectedCourses, setSelectedCourses] = useState<any[]>([]); // New: for the form
  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [sortColumn, setSortColumn] = useState('created_at');
  const [sortAsc, setSortAsc] = useState(false);

  const [mode, setMode] = useState<'view' | 'add' | 'edit' | null>(null);
  const [form, setForm] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false); // New: for loading states

  // Fetch Books and Courses
  const fetchData = async () => {
    // Fetch Books
    let bookQuery = supabase.from('books').select('*').order(sortColumn, { ascending: sortAsc });
    if (search) {
      bookQuery = bookQuery.or(`title.ilike.%${search}%,author.ilike.%${search}%,isbn.ilike.%${search}%`);
    }
    const { data: bData } = await bookQuery;
    setBooks(bData || []);

    // Fetch Courses for the dropdown
    const { data: cData } = await supabase.from('courses').select('official_code, title').order('official_code');
    if (cData) {
      setCourses(cData.map(c => ({
        value: c.official_code,
        label: `${c.official_code} - ${c.title}`
      })));
    }
  };
  useEffect(() => {
    fetchData();
  }, [search, sortColumn, sortAsc]);

  /* Helpr*/
  const toggleSelect = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSort = (col: string) => {
    if (sortColumn === col) setSortAsc(!sortAsc);
    else {
      setSortColumn(col);
      setSortAsc(true);
    }
  };

  /* CRUD */
  const openView = () => {
    setForm(books.find((b) => b.id === selected[0]));
    setMode('view');
  };

  const openEdit = async () => {
      const book = books.find((b) => b.id === selected[0]);
      setForm(book);
      
      // Fetch existing links for this book
      const { data } = await supabase.from('course_books').select('course_id').eq('book_id', book.id);
      if (data) {
        const existing = data.map(link => courses.find(opt => opt.value === link.course_id)).filter(Boolean);
        setSelectedCourses(existing);
      }
      setMode('edit');
    };

  const openAdd = () => {
      setForm({});
      setSelectedCourses([]); // Clear selection
      setMode('add');
    };

  const saveBook = async () => {
      setIsSaving(true);
      try {
        // 1. Save or Update the Book
        const action = mode === 'add'
          ? supabase.from('books').insert([form]).select().single()
          : supabase.from('books').update(form).eq('id', form.id).select().single();

        const { data: bookData, error: bookError } = await action;
        if (bookError) throw bookError;

        // 2. Sync Course Links (Delete old, insert new)
        const bookId = bookData.id;
        
        // Clear old links if editing
        if (mode === 'edit') {
          await supabase.from('course_books').delete().eq('book_id', bookId);
        }

        // Insert selected links
        if (selectedCourses.length > 0) {
          const links = selectedCourses.map(c => ({
            course_id: c.value,
            book_id: bookId
          }));
          const { error: linkError } = await supabase.from('course_books').insert(links);
          if (linkError) throw linkError;
        }

        toast.success('Saved successfully');
        setMode(null);
        fetchData();
      } catch (err: any) {
        toast.error(err.message || 'Save failed');
      } finally {
        setIsSaving(false);
      }
    };

const deleteBooks = async () => {
  try {
    for (let id of selected) {
      const book = books.find((b) => b.id === id);
      if (!book) continue;

const { error: insertError } = await supabase
  .from('recycle_bin')
  .insert([
    {
      original_id: book.id, 
      title: book.title,
      author: book.author,
      publisher: book.publisher,
      year: book.year,
      isbn: book.isbn,
      call_number: book.call_number,
      accession_number: book.accession_number,
      source_type: book.source_type,
      created_at: book.created_at,
      deleted_at: new Date().toISOString(),
    },
  ]);


      if (insertError) {
        console.error(insertError);
        toast.error(insertError.message);
        return;
      }

      const { error: deleteError } = await supabase
        .from('books')
        .delete()
        .eq('id', id);

      if (deleteError) {
        toast.error(deleteError.message);
        return;
      }
    }

    toast.success('Deleted successfully');
    setSelected([]);
    fetchData(); // Changed from fetchBooks()
  } catch (err) {
    toast.error('Unexpected error');
  }
};



  /* UI */
  return (
    <MainLayout title="Book Master" subtitle="Manage your book collection">
      <div className="relative h-[calc(100vh-180px)] overflow-y-auto">

        <div
        className="sticky top-4 z-30
            bg-white/95 backdrop-blur
            border rounded-xl shadow-lg
            px-4 py-3 mb-3
            flex flex-wrap gap-3 items-center"
        >
          <div className="flex flex-col">
            <input
              placeholder="Search title, author, ISBN"
              className="border rounded px-3 py-1 text-sm w-64"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {/* Record count indicator */}
            <span className="text-[10px] text-muted-foreground mt-1 ml-1">
              Showing {books.length} records
            </span>
          </div>
      <div className="ml-auto flex gap-2"></div>
          <div className="ml-auto flex gap-2">
            <button
              onClick={openView}
              disabled={selected.length !== 1}
              className="px-3 py-1 rounded text-sm
                bg-blue-500 text-white hover:bg-blue-600
                disabled:opacity-50"
            >
              View
            </button>

            <button
              onClick={openAdd}
              className="px-3 py-1 rounded text-sm
                bg-green-500 text-white hover:bg-green-600"
            >
              Add
            </button>

            <button
              onClick={openEdit}
              disabled={selected.length !== 1}
              className="px-3 py-1 rounded text-sm
                bg-yellow-400 text-black hover:bg-yellow-500
                disabled:opacity-50"
            >
              Edit
            </button>

            <button
              onClick={deleteBooks}
              disabled={!selected.length}
              className="px-3 py-1 rounded text-sm
                bg-red-500 text-white hover:bg-red-600
                disabled:opacity-50"
            >
              Delete
            </button>
          </div>
        </div>

        <div className="bg-card rounded-xl shadow-card overflow-x-auto pt-[30px]">
          <Table className="table-fixed text-sm w-full">
  <TableHeader className="bg-purple-100">
    <TableRow>
      <TableHead className="w-8" />
      {['title', 'author', 'publisher', 'year'].map((c) => (
        <TableHead
          key={c}
          className="cursor-pointer text-purple-800"
          onClick={() => handleSort(c)}
        >
          {c.toUpperCase()}
        </TableHead>
      ))}
      <TableHead>ISBN</TableHead>
      <TableHead>Call No.</TableHead>
      <TableHead>Acc. No.</TableHead>
      <TableHead>Source</TableHead>
      <TableHead>Created</TableHead>
    </TableRow>
  </TableHeader>

  <TableBody>
    {books.map((b) => (
      <TableRow key={b.id} className="hover:bg-muted/50">
        <TableCell>
          <input
            type="checkbox"
            checked={selected.includes(b.id)}
            onChange={() => toggleSelect(b.id)}
          />
        </TableCell>
        <TableCell><TruncatedCell value={b.title} /></TableCell>
        <TableCell><TruncatedCell value={b.author} /></TableCell>
        <TableCell><TruncatedCell value={b.publisher} /></TableCell>
        <TableCell>{b.year ?? <EmptyText />}</TableCell>
        <TableCell><TruncatedCell value={b.isbn} maxWidth="max-w-[7rem]" /></TableCell>
        <TableCell><TruncatedCell value={b.call_number} maxWidth="max-w-[6rem]" /></TableCell>
        <TableCell><TruncatedCell value={b.accession_number} maxWidth="max-w-[6rem]" /></TableCell>
        <TableCell><TruncatedCell value={b.source_type} maxWidth="max-w-[6rem]" /></TableCell>
        <TableCell>{b.created_at ? new Date(b.created_at).toLocaleDateString() : <EmptyText />}</TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>

        </div>
      </div>

    {/* MODAL */}
{mode && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-[550px] max-h-[90vh] overflow-y-auto space-y-4">
            <h2 className="text-lg font-semibold capitalize">{mode} Book</h2>

            {/* Standard Form Fields */}
            <div className="grid grid-cols-2 gap-3">
               {['title', 'author', 'publisher', 'isbn', 'call_number', 'source_type', 'year', 'accession_number'].map((f) => (
                <div key={f} className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-gray-400">{f.replace('_', ' ')}</label>
                  <input
                    type={f === 'year' ? 'number' : 'text'}
                    disabled={mode === 'view'}
                    className="border rounded px-3 py-1 w-full text-sm"
                    value={form[f] ?? ''}
                    onChange={(e) => setForm({ ...form, [f]: f === 'year' ? parseInt(e.target.value) || '' : e.target.value })}
                  />
                </div>
              ))}
            </div>

            {/* NEW: Course Linker */}
            <div className="pt-2 border-t">
              <label className="block text-sm font-bold text-blue-600 mb-1">
                Link to Courses {selectedCourses.length > 0 && `(${selectedCourses.length})`}
              </label>
              <Select
                isMulti
                options={courses}
                value={selectedCourses}
                onChange={(val) => setSelectedCourses(val as any)}
                placeholder="Search courses (e.g. IT101)..."
                isDisabled={mode === 'view'}
                className="text-sm"
              />
              <p className="text-[10px] text-gray-500 mt-1">Links this book to curriculum compliance reports.</p>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <button onClick={() => setMode(null)} className="px-4 py-1.5 rounded border text-sm">Close</button>
              {mode !== 'view' && (
                <button 
                  onClick={saveBook} 
                  disabled={isSaving}
                  className="px-4 py-1.5 rounded bg-purple-600 text-white text-sm flex items-center gap-2"
                >
                  {isSaving ? 'Saving...' : 'Save Book & Links'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
