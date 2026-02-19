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
import { Trash2, RotateCcw, BookOpen, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { format } from 'date-fns';

/* ---------------- Helpers ---------------- */
const EmptyText = () => (
  <span className="text-gray-400 italic select-none">empty</span>
);

const TruncatedCell = ({
  value,
  maxWidth = 'max-w-[10rem]',
}: {
  value?: string;
  maxWidth?: string;
}) => {
  if (!value) return <EmptyText />;
  return (
    <span title={value} className={`block truncate ${maxWidth} cursor-help`}>
      {value}
    </span>
  );
};

const SafeDate = ({ date }: { date?: string }) => {
  if (!date) return <EmptyText />;
  const d = new Date(date);
  return isNaN(d.getTime()) ? <EmptyText /> : <span>{format(d, 'MMM d, yyyy')}</span>;
};

/* ---------------- Recycle Bin Page ---------------- */
interface DeletedItem {
  original_id: string; // required
  type: 'book' | 'course';
  title?: string;
  author?: string;
  publisher?: string;
  year?: string;
  isbn?: string;
  call_number?: string;
  accession_number?: string;
  source_type?: string;
  created_at?: string;
  deleted_at?: string;
  deleted_by?: string;
}

export default function RecycleBinPage() {
  const [items, setItems] = useState<DeletedItem[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [sortColumn, setSortColumn] = useState('deleted_at');
  const [sortAsc, setSortAsc] = useState(false);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [emptyDialogOpen, setEmptyDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  /* ---------------- Fetch ---------------- */
  const fetchDeletedItems = async () => {
    let query = supabase
      .from('recycle_bin')
      .select('*')
      .order(sortColumn, { ascending: sortAsc });

    if (search) query = query.ilike('title', `%${search}%`);

    const { data, error } = await query;
    if (error) {
      toast.error(`Failed to load deleted items: ${error.message}`);
      return;
    }

    setItems(data || []);
  };

  useEffect(() => {
    fetchDeletedItems();
  }, [search, sortColumn, sortAsc]);

  /* ---------------- Helpers ---------------- */
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

  /* ---------------- Restore ---------------- */
  const handleRestore = async (original_id: string) => {
    const item = items.find((i) => i.original_id === original_id);
    if (!item) return;

    try {
      if (item.type === 'book') {
        const { error } = await supabase
          .from('books')
          .upsert([{
            id: original_id,
            title: item.title,
            author: item.author,
            publisher: item.publisher,
            year: item.year,
            isbn: item.isbn,
            call_number: item.call_number,
            accession_number: item.accession_number,
            source_type: item.source_type,
            created_at: item.created_at,
          }], { onConflict: 'id' });
        if (error) throw error;
      } else if (item.type === 'course') {
        const { error } = await supabase
          .from('courses')
          .upsert([{
            id: original_id,
            title: item.title,
            author: item.author,
            created_at: item.created_at,
          }], { onConflict: 'id' });
        if (error) throw error;
      }

      // Remove from recycle_bin
      const { error: delError } = await supabase
        .from('recycle_bin')
        .delete()
        .eq('original_id', original_id);

      if (delError) throw delError;

      toast.success('Item restored successfully');
      fetchDeletedItems();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to restore item');
    }
  };

  /* ---------------- Permanent Delete ---------------- */
  const confirmDelete = async () => {
    if (!itemToDelete) return;

    const { error } = await supabase
      .from('recycle_bin')
      .delete()
      .eq('original_id', itemToDelete);

    if (error) {
      toast.error('Failed to delete item');
      return;
    }

    toast.success('Item permanently deleted');
    setItemToDelete(null);
    setDeleteDialogOpen(false);
    fetchDeletedItems();
  };

  /* ---------------- Empty Bin ---------------- */
  const confirmEmptyBin = async () => {
    if (!items.length) return;

    const ids = items.map(i => i.original_id);
    const { error } = await supabase
      .from('recycle_bin')
      .delete()
      .in('original_id', ids);

    if (error) {
      console.error(error);
      toast.error('Failed to empty recycle bin');
      return;
    }

    toast.success('Recycle bin emptied');
    setEmptyDialogOpen(false);
    setItems([]);
    setSelected([]);
  };

  /* ---------------- UI ---------------- */
  return (
    <MainLayout title="Recycle Bin" subtitle="Manage deleted items">
      {/* Action Bar */}
      {items.length > 0 && (
        <div className="flex justify-end mb-4">
          <Button
            variant="outline"
            className="text-danger border-danger hover:bg-danger hover:text-white"
            onClick={() => setEmptyDialogOpen(true)}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Empty Recycle Bin
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="bg-card rounded-xl shadow-card overflow-x-auto">
        {items.length === 0 ? (
          <div className="p-12 text-center">
            <Trash2 className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">Recycle Bin is Empty</h3>
            <p className="text-muted-foreground">Deleted items will appear here</p>
          </div>
        ) : (
          <Table className="table-fixed text-sm w-full">
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-8" />
                <TableHead>Type</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Publisher</TableHead>
                <TableHead>Year</TableHead>
                <TableHead>ISBN</TableHead>
                <TableHead>Call No.</TableHead>
                <TableHead>Acc. No.</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Deleted By</TableHead>
                <TableHead>Deleted Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow
                  key={item.original_id}
                  className="hover:bg-muted/50"
                >
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selected.includes(item.original_id)}
                      onChange={() => toggleSelect(item.original_id)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {item.type === 'book' ? (
                        <BookOpen className="w-4 h-4 text-primary" />
                      ) : (
                        <GraduationCap className="w-4 h-4 text-success" />
                      )}
                      <Badge variant="secondary" className="capitalize">
                        {item.type}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell><TruncatedCell value={item.title} /></TableCell>
                  <TableCell><TruncatedCell value={item.author} /></TableCell>
                  <TableCell><TruncatedCell value={item.publisher} /></TableCell>
                  <TableCell>{item.year ?? <EmptyText />}</TableCell>
                  <TableCell><TruncatedCell value={item.isbn} /></TableCell>
                  <TableCell><TruncatedCell value={item.call_number} /></TableCell>
                  <TableCell><TruncatedCell value={item.accession_number} /></TableCell>
                  <TableCell><TruncatedCell value={item.source_type} /></TableCell>
                  <TableCell>{item.deleted_by ?? <EmptyText />}</TableCell>
                  <TableCell><SafeDate date={item.deleted_at} /></TableCell>
                  <TableCell className="text-right flex gap-2 justify-end">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-success hover:bg-success/10"
                      onClick={() => handleRestore(item.original_id)}
                    >
                      <RotateCcw className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-danger hover:bg-danger/10"
                      onClick={() => { setItemToDelete(item.original_id); setDeleteDialogOpen(true); }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Dialogs */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Permanently Delete"
        description="This action cannot be undone. The item will be permanently removed from the system."
        confirmLabel="Delete Forever"
        variant="destructive"
        onConfirm={confirmDelete}
      />

      <ConfirmDialog
        open={emptyDialogOpen}
        onOpenChange={setEmptyDialogOpen}
        title="Empty Recycle Bin"
        description={`Are you sure you want to permanently delete all ${items.length} items? This action cannot be undone.`}
        confirmLabel="Empty Bin"
        variant="destructive"
        onConfirm={confirmEmptyBin}
      />
    </MainLayout>
  );
}
