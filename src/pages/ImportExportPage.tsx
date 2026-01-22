import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Upload, 
  Download, 
  FileSpreadsheet, 
  FileText, 
  CheckCircle, 
  XCircle,
  FileDown,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { isBookRecent } from '@/lib/mockData';

interface ImportRecord {
  title: string;
  author: string;
  isbn: string;
  publicationYear: number;
  subjectCode: string;
  isValid: boolean;
  error?: string;
}

const mockImportData: ImportRecord[] = [
  { title: 'Modern Web Development', author: 'Jane Smith', isbn: '978-1234567890', publicationYear: 2024, subjectCode: 'IT101', isValid: true },
  { title: 'Advanced Algorithms', author: 'John Doe', isbn: '978-2345678901', publicationYear: 2023, subjectCode: 'IT102', isValid: true },
  { title: 'Database Design', author: 'Maria Garcia', isbn: '978-3456789012', publicationYear: 2024, subjectCode: 'IT103', isValid: true },
  { title: '', author: 'Missing Title', isbn: '978-4567890123', publicationYear: 2024, subjectCode: 'IT104', isValid: false, error: 'Title is required' },
  { title: 'Cloud Computing', author: 'David Lee', isbn: 'invalid-isbn', publicationYear: 2023, subjectCode: 'IT105', isValid: false, error: 'Invalid ISBN format' },
  { title: 'Machine Learning Basics', author: 'Sarah Johnson', isbn: '978-5678901234', publicationYear: 2025, subjectCode: 'IT201', isValid: true },
  { title: 'Cybersecurity Essentials', author: 'Mike Brown', isbn: '978-6789012345', publicationYear: 2024, subjectCode: 'IT202', isValid: true },
];

export default function ImportExportPage() {
  const { books, courses, importBooks, getCourseStatusFn } = useData();
  const [isDragging, setIsDragging] = useState(false);
  const [showImportPreview, setShowImportPreview] = useState(false);
  const [importData, setImportData] = useState<ImportRecord[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [showExportPreview, setShowExportPreview] = useState(false);
  const [exportType, setExportType] = useState<'books' | 'courses' | 'compliance'>('books');

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    // Simulate file processing
    setImportData(mockImportData);
    setShowImportPreview(true);
  };

  const handleFileSelect = () => {
    // Simulate file selection
    setImportData(mockImportData);
    setShowImportPreview(true);
  };

  const handleConfirmImport = async () => {
    setIsImporting(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const validRecords = importData.filter(r => r.isValid);
    importBooks(validRecords);
    
    setIsImporting(false);
    setShowImportPreview(false);
    toast.success(`Successfully imported ${validRecords.length} books`);
  };

  const handleExport = (type: 'books' | 'courses' | 'compliance') => {
    setExportType(type);
    setShowExportPreview(true);
  };

  const handleDownload = () => {
    toast.success(`${exportType === 'books' ? 'Book Master' : exportType === 'courses' ? 'Course Coding' : 'Compliance Report'} exported successfully`);
    setShowExportPreview(false);
  };

  const validCount = importData.filter(r => r.isValid).length;
  const invalidCount = importData.filter(r => !r.isValid).length;

  return (
    <MainLayout title="Import/Export" subtitle="Manage data import and export operations">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Import Section */}
        <div className="bg-card rounded-xl shadow-card animate-slide-up">
          <div className="p-6 border-b border-border">
            <div className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-lg">Import Data</h3>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Upload Excel files to import books into the system
            </p>
          </div>
          <div className="p-6">
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={handleFileSelect}
              className={cn(
                "border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all",
                isDragging 
                  ? "border-primary bg-primary/5" 
                  : "border-border hover:border-primary/50 hover:bg-muted/50"
              )}
            >
              <FileSpreadsheet className={cn(
                "w-16 h-16 mx-auto mb-4",
                isDragging ? "text-primary" : "text-muted-foreground"
              )} />
              <p className="font-medium text-foreground mb-1">
                Drag and drop your Excel file here
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                or click to browse
              </p>
              <Badge variant="secondary">.xlsx, .xls files supported</Badge>
            </div>
          </div>
        </div>

        {/* Export Section */}
        <div className="bg-card rounded-xl shadow-card animate-slide-up" style={{ animationDelay: '100ms' }}>
          <div className="p-6 border-b border-border">
            <div className="flex items-center gap-2">
              <Download className="w-5 h-5 text-success" />
              <h3 className="font-semibold text-lg">Export Data</h3>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Download data in various formats
            </p>
          </div>
          <div className="p-6 space-y-4">
            <div
              onClick={() => handleExport('books')}
              className="p-4 border border-border rounded-lg hover:border-primary/50 hover:bg-muted/50 cursor-pointer transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <FileSpreadsheet className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">Export Book Master</p>
                  <p className="text-sm text-muted-foreground">Download all books as Excel</p>
                </div>
                <FileDown className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </div>

            <div
              onClick={() => handleExport('courses')}
              className="p-4 border border-border rounded-lg hover:border-primary/50 hover:bg-muted/50 cursor-pointer transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center group-hover:bg-success/20 transition-colors">
                  <FileSpreadsheet className="w-6 h-6 text-success" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">Export Course Coding Template</p>
                  <p className="text-sm text-muted-foreground">Download course assignments as Excel</p>
                </div>
                <FileDown className="w-5 h-5 text-muted-foreground group-hover:text-success transition-colors" />
              </div>
            </div>

            <div
              onClick={() => handleExport('compliance')}
              className="p-4 border border-border rounded-lg hover:border-primary/50 hover:bg-muted/50 cursor-pointer transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-danger/10 flex items-center justify-center group-hover:bg-danger/20 transition-colors">
                  <FileText className="w-6 h-6 text-danger" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">Export Compliance Report</p>
                  <p className="text-sm text-muted-foreground">Generate PDF compliance report</p>
                </div>
                <FileDown className="w-5 h-5 text-muted-foreground group-hover:text-danger transition-colors" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Import Preview Dialog */}
      <Dialog open={showImportPreview} onOpenChange={setShowImportPreview}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Import Preview</DialogTitle>
          </DialogHeader>
          
          <div className="flex items-center gap-4 py-4">
            <Badge className="bg-success/10 text-success border-success/20">
              <CheckCircle className="w-3 h-3 mr-1" />
              {validCount} valid
            </Badge>
            <Badge className="bg-danger/10 text-danger border-danger/20">
              <XCircle className="w-3 h-3 mr-1" />
              {invalidCount} invalid
            </Badge>
          </div>

          <div className="flex-1 overflow-auto border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-12">Status</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>ISBN</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead>Subject</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {importData.map((record, index) => (
                  <TableRow key={index} className={cn(!record.isValid && "bg-danger/5")}>
                    <TableCell>
                      {record.isValid ? (
                        <CheckCircle className="w-5 h-5 text-success" />
                      ) : (
                        <XCircle className="w-5 h-5 text-danger" />
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      {record.title || <span className="text-danger italic">Missing</span>}
                    </TableCell>
                    <TableCell>{record.author}</TableCell>
                    <TableCell className="font-mono text-sm">
                      {record.isValid ? record.isbn : (
                        <span className="text-danger">{record.isbn}</span>
                      )}
                    </TableCell>
                    <TableCell>{record.publicationYear}</TableCell>
                    <TableCell>{record.subjectCode}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowImportPreview(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmImport}
              disabled={isImporting || validCount === 0}
              className="gradient-primary text-white"
            >
              {isImporting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Import {validCount} Records
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Export Preview Dialog */}
      <Dialog open={showExportPreview} onOpenChange={setShowExportPreview}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {exportType === 'books' && 'Book Master Export Preview'}
              {exportType === 'courses' && 'Course Coding Export Preview'}
              {exportType === 'compliance' && 'Compliance Report Preview'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-auto border rounded-lg">
            {exportType === 'books' && (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Title</TableHead>
                    <TableHead>Author</TableHead>
                    <TableHead>ISBN</TableHead>
                    <TableHead>Year</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {books.slice(0, 10).map((book) => (
                    <TableRow key={book.id}>
                      <TableCell className="font-medium">{book.title}</TableCell>
                      <TableCell>{book.author}</TableCell>
                      <TableCell className="font-mono text-sm">{book.isbn}</TableCell>
                      <TableCell>{book.publicationYear}</TableCell>
                      <TableCell>{book.subjectCode}</TableCell>
                      <TableCell>{book.status}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            
            {exportType === 'courses' && (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Program</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Books</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {courses.map((course) => (
                    <TableRow key={course.id}>
                      <TableCell className="font-medium">{course.code}</TableCell>
                      <TableCell>{course.name}</TableCell>
                      <TableCell>{course.program}</TableCell>
                      <TableCell>{course.department}</TableCell>
                      <TableCell>{course.assignedBookIds.length}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {exportType === 'compliance' && (
              <div className="p-6 space-y-6">
                <div className="text-center border-b pb-6">
                  <h2 className="text-2xl font-bold">MCCLRS Compliance Report</h2>
                  <p className="text-muted-foreground">Generated on {new Date().toLocaleDateString()}</p>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-success/10 rounded-lg text-center">
                    <p className="text-3xl font-bold text-success">{courses.filter(c => getCourseStatusFn(c) === 'complete').length}</p>
                    <p className="text-sm text-success">Compliant</p>
                  </div>
                  <div className="p-4 bg-warning/10 rounded-lg text-center">
                    <p className="text-3xl font-bold text-warning">{courses.filter(c => getCourseStatusFn(c) === 'incomplete').length}</p>
                    <p className="text-sm text-warning">Incomplete</p>
                  </div>
                  <div className="p-4 bg-danger/10 rounded-lg text-center">
                    <p className="text-3xl font-bold text-danger">{courses.filter(c => getCourseStatusFn(c) === 'outdated').length}</p>
                    <p className="text-sm text-danger">Outdated</p>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground text-center">
                  ... preview truncated. Download for full report.
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowExportPreview(false)}>
              Cancel
            </Button>
            <Button onClick={handleDownload} className="gradient-primary text-white">
              <Download className="w-4 h-4 mr-2" />
              Download {exportType === 'compliance' ? 'PDF' : 'Excel'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
