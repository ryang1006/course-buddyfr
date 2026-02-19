import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
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
  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [sortColumn, setSortColumn] = useState('created_at');
  const [sortAsc, setSortAsc] = useState(false);

  const [mode, setMode] = useState<'view' | 'add' | 'edit' | null>(null);
  const [form, setForm] = useState<any>({});

  /*fetch*/
  const fetchBooks = async () => {
    let query = supabase
      .from('books')
      .select('*')
      .order(sortColumn, { ascending: sortAsc });

    if (search) {
      query = query.or(
        `title.ilike.%${search}%,author.ilike.%${search}%,isbn.ilike.%${search}%`
      );
    }

    const { data, error } = await query;

    if (error) {
      toast.error('Failed to load books');
      return;
    }

    setBooks(data || []);
  };

  useEffect(() => {
    fetchBooks();
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

  const openEdit = () => {
    setForm(books.find((b) => b.id === selected[0]));
    setMode('edit');
  };

  const openAdd = () => {
    setForm({});
    setMode('add');
  };

  const saveBook = async () => {
    const action =
      mode === 'add'
        ? supabase.from('books').insert([form])
        : supabase.from('books').update(form).eq('id', form.id);

    const { error } = await action;

    if (error) {
      toast.error('Save failed');
      return;
    }

    toast.success('Saved successfully');
    setMode(null);
    fetchBooks();
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
    fetchBooks();
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
          <input
            placeholder="Search title, author, ISBN"
            className="border rounded px-3 py-1 text-sm w-64"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

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
  <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
    <div className="bg-white rounded-xl p-6 w-[500px] space-y-3">
      <h2 className="text-lg font-semibold capitalize">{mode} Book</h2>

      {[
        'title',
        'author',
        'publisher',
        'isbn',
        'call_number',
        'source_type',
        'year',
        'accession_number',
      ].map((f) => (
        <input
          key={f}
          type={f === 'year' ? 'number' : 'text'} // number input for year
          disabled={mode === 'view'}
          placeholder={f.replace('_', ' ')}
          className="border rounded px-3 py-1 w-full"
          value={form[f] ?? ''}
          onChange={(e) =>
            setForm({
              ...form,
              [f]:
                f === 'year' ? parseInt(e.target.value) || '' : e.target.value,
            })
          }
        />
      ))}

      <div className="flex justify-end gap-2 pt-2">
        <button
          onClick={() => setMode(null)}
          className="px-3 py-1 rounded border"
        >
          Close
        </button>

        {mode !== 'view' && (
          <button
            onClick={saveBook}
            className="px-3 py-1 rounded bg-purple-600 text-white"
          >
            Save
          </button>
        )}
      </div>
    </div>
  </div>
)}
    </MainLayout>
  );
}
