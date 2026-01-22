import { useState, useMemo } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { BookModal } from '@/components/books/BookModal';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Book, isBookRecent } from '@/lib/mockData';
import { Plus, Search, Edit, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type SortField = 'title' | 'author' | 'publicationYear' | 'subjectCode';
type SortOrder = 'asc' | 'desc';

export default function BooksPage() {
  const { books, deleteBook } = useData();
  const { user } = useAuth();
  
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'recent' | 'outdated'>('all');
  const [sortField, setSortField] = useState<SortField>('title');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bookToDelete, setBookToDelete] = useState<Book | null>(null);

  const currentYear = new Date().getFullYear();

  const filteredBooks = useMemo(() => {
    let result = [...books];

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(
        b =>
          b.title.toLowerCase().includes(searchLower) ||
          b.author.toLowerCase().includes(searchLower) ||
          b.isbn.toLowerCase().includes(searchLower) ||
          b.subjectCode.toLowerCase().includes(searchLower)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter(b => {
        const isRecent = isBookRecent(b.publicationYear);
        return statusFilter === 'recent' ? isRecent : !isRecent;
      });
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      if (sortField === 'title') {
        comparison = a.title.localeCompare(b.title);
      } else if (sortField === 'author') {
        comparison = a.author.localeCompare(b.author);
      } else if (sortField === 'publicationYear') {
        comparison = a.publicationYear - b.publicationYear;
      } else if (sortField === 'subjectCode') {
        comparison = a.subjectCode.localeCompare(b.subjectCode);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [books, search, statusFilter, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleEdit = (book: Book) => {
    setSelectedBook(book);
    setModalOpen(true);
  };

  const handleDelete = (book: Book) => {
    setBookToDelete(book);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (bookToDelete && user) {
      deleteBook(bookToDelete.id, user.name);
      toast.success('Book moved to recycle bin');
    }
    setDeleteDialogOpen(false);
    setBookToDelete(null);
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortOrder === 'asc' ? (
      <ChevronUp className="w-4 h-4 inline ml-1" />
    ) : (
      <ChevronDown className="w-4 h-4 inline ml-1" />
    );
  };

  return (
    <MainLayout title="Book Master" subtitle="Manage your book collection">
      {/* Toolbar */}
      <div className="bg-card rounded-xl p-4 shadow-card mb-6 animate-slide-up">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search books..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v: 'all' | 'recent' | 'outdated') => setStatusFilter(v)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Books</SelectItem>
                <SelectItem value="recent">Recent (≤5 yrs)</SelectItem>
                <SelectItem value="outdated">Outdated (&gt;5 yrs)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button 
            onClick={() => { setSelectedBook(null); setModalOpen(true); }}
            className="gradient-primary text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Book
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl shadow-card overflow-hidden animate-slide-up" style={{ animationDelay: '100ms' }}>
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead 
                className="cursor-pointer hover:text-foreground"
                onClick={() => handleSort('title')}
              >
                Title <SortIcon field="title" />
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:text-foreground"
                onClick={() => handleSort('author')}
              >
                Author <SortIcon field="author" />
              </TableHead>
              <TableHead>ISBN</TableHead>
              <TableHead 
                className="cursor-pointer hover:text-foreground"
                onClick={() => handleSort('publicationYear')}
              >
                Year <SortIcon field="publicationYear" />
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:text-foreground"
                onClick={() => handleSort('subjectCode')}
              >
                Subject <SortIcon field="subjectCode" />
              </TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredBooks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                  No books found
                </TableCell>
              </TableRow>
            ) : (
              filteredBooks.map((book) => {
                const isRecent = isBookRecent(book.publicationYear);
                return (
                  <TableRow key={book.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium max-w-xs truncate">
                      {book.title}
                    </TableCell>
                    <TableCell>{book.author}</TableCell>
                    <TableCell className="font-mono text-sm">{book.isbn}</TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline"
                        className={cn(
                          isRecent 
                            ? 'bg-success/10 text-success border-success/20' 
                            : "bg-danger/10 text-danger border-danger/20"
                        )}
                      >
                        {book.publicationYear}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{book.subjectCode}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline"
                        className={cn(
                          book.status === 'assigned'
                            ? 'bg-primary/10 text-primary border-primary/20'
                            : 'bg-muted text-muted-foreground'
                        )}
                      >
                        {book.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleEdit(book)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="text-danger hover:text-danger"
                          onClick={() => handleDelete(book)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
        
        {filteredBooks.length > 0 && (
          <div className="p-4 border-t border-border text-sm text-muted-foreground">
            Showing {filteredBooks.length} of {books.length} books
          </div>
        )}
      </div>

      {/* Modals */}
      <BookModal 
        open={modalOpen} 
        onOpenChange={setModalOpen} 
        book={selectedBook}
      />
      
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Book"
        description={`Are you sure you want to delete "${bookToDelete?.title}"? This will move it to the recycle bin.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={confirmDelete}
      />
    </MainLayout>
  );
}
