import { useState, useEffect } from 'react';
import { Book } from '@/lib/mockData';
import { useData } from '@/contexts/DataContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface BookModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  book?: Book | null;
}

export function BookModal({ open, onOpenChange, book }: BookModalProps) {
  const { addBook, updateBook } = useData();
  const currentYear = new Date().getFullYear();
  
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    isbn: '',
    publicationYear: currentYear,
    subjectCode: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (book) {
      setFormData({
        title: book.title,
        author: book.author,
        isbn: book.isbn,
        publicationYear: book.publicationYear,
        subjectCode: book.subjectCode,
      });
    } else {
      setFormData({
        title: '',
        author: '',
        isbn: '',
        publicationYear: currentYear,
        subjectCode: '',
      });
    }
    setErrors({});
  }, [book, open, currentYear]);

  const isOutdated = formData.publicationYear < currentYear - 5;

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.author.trim()) newErrors.author = 'Author is required';
    if (!formData.isbn.trim()) newErrors.isbn = 'ISBN is required';
    if (!formData.subjectCode.trim()) newErrors.subjectCode = 'Subject code is required';
    if (formData.publicationYear < 1900 || formData.publicationYear > currentYear + 1) {
      newErrors.publicationYear = 'Invalid publication year';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    
    if (book) {
      updateBook(book.id, formData);
      toast.success('Book updated successfully');
    } else {
      addBook(formData);
      toast.success('Book added successfully');
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{book ? 'Edit Book' : 'Add New Book'}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter book title"
              className={errors.title ? 'border-danger' : ''}
            />
            {errors.title && <p className="text-xs text-danger">{errors.title}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="author">Author *</Label>
            <Input
              id="author"
              value={formData.author}
              onChange={(e) => setFormData(prev => ({ ...prev, author: e.target.value }))}
              placeholder="Enter author name"
              className={errors.author ? 'border-danger' : ''}
            />
            {errors.author && <p className="text-xs text-danger">{errors.author}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="isbn">ISBN *</Label>
              <Input
                id="isbn"
                value={formData.isbn}
                onChange={(e) => setFormData(prev => ({ ...prev, isbn: e.target.value }))}
                placeholder="978-0000000000"
                className={errors.isbn ? 'border-danger' : ''}
              />
              {errors.isbn && <p className="text-xs text-danger">{errors.isbn}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="subjectCode">Subject Code *</Label>
              <Input
                id="subjectCode"
                value={formData.subjectCode}
                onChange={(e) => setFormData(prev => ({ ...prev, subjectCode: e.target.value }))}
                placeholder="IT101"
                className={errors.subjectCode ? 'border-danger' : ''}
              />
              {errors.subjectCode && <p className="text-xs text-danger">{errors.subjectCode}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="publicationYear">Publication Year *</Label>
            <Input
              id="publicationYear"
              type="number"
              value={formData.publicationYear}
              onChange={(e) => setFormData(prev => ({ ...prev, publicationYear: parseInt(e.target.value) || currentYear }))}
              min={1900}
              max={currentYear + 1}
              className={errors.publicationYear ? 'border-danger' : ''}
            />
            {errors.publicationYear && <p className="text-xs text-danger">{errors.publicationYear}</p>}
            
            {isOutdated && (
              <div className="flex items-center gap-2 p-3 bg-warning/10 border border-warning/20 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0" />
                <p className="text-xs text-warning">
                  This book is older than 5 years and may affect course compliance.
                </p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} className="gradient-primary text-white">
            {book ? 'Update Book' : 'Add Book'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
