import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Trash2, RotateCcw, BookOpen, GraduationCap, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function RecycleBinPage() {
  const { deletedItems, restoreItem, permanentlyDeleteItem, emptyRecycleBin } = useData();
  const { user } = useAuth();
  
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [emptyDialogOpen, setEmptyDialogOpen] = useState(false);

  const handleRestore = (id: string) => {
    restoreItem(id);
    toast.success('Item restored successfully');
  };

  const handleDelete = (id: string) => {
    setItemToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      permanentlyDeleteItem(itemToDelete);
      toast.success('Item permanently deleted');
    }
    setDeleteDialogOpen(false);
    setItemToDelete(null);
  };

  const handleEmptyBin = () => {
    setEmptyDialogOpen(true);
  };

  const confirmEmptyBin = () => {
    emptyRecycleBin();
    toast.success('Recycle bin emptied');
    setEmptyDialogOpen(false);
  };

  return (
    <MainLayout title="Recycle Bin" subtitle="Manage deleted items">
      {/* Header Actions */}
      {deletedItems.length > 0 && user?.role === 'admin' && (
        <div className="flex justify-end mb-6 animate-slide-up">
          <Button 
            variant="outline" 
            className="text-danger border-danger hover:bg-danger hover:text-white"
            onClick={handleEmptyBin}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Empty Recycle Bin
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="bg-card rounded-xl shadow-card overflow-hidden animate-slide-up" style={{ animationDelay: '100ms' }}>
        {deletedItems.length === 0 ? (
          <div className="p-12 text-center">
            <Trash2 className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">Recycle Bin is Empty</h3>
            <p className="text-muted-foreground">Deleted items will appear here</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Type</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Deleted Date</TableHead>
                <TableHead>Deleted By</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deletedItems.map((item) => (
                <TableRow key={item.id} className="hover:bg-muted/50">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {item.type === 'book' ? (
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <BookOpen className="w-4 h-4 text-primary" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
                          <GraduationCap className="w-4 h-4 text-success" />
                        </div>
                      )}
                      <Badge variant="secondary" className="capitalize">
                        {item.type}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(new Date(item.deletedAt), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell>{item.deletedBy}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-success hover:text-success hover:bg-success/10"
                        onClick={() => handleRestore(item.id)}
                      >
                        <RotateCcw className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-danger hover:text-danger hover:bg-danger/10"
                        onClick={() => handleDelete(item.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Permanently Delete"
        description="This action cannot be undone. The item will be permanently removed from the system."
        confirmLabel="Delete Forever"
        variant="destructive"
        onConfirm={confirmDelete}
      />

      {/* Empty Bin Confirmation Dialog */}
      <ConfirmDialog
        open={emptyDialogOpen}
        onOpenChange={setEmptyDialogOpen}
        title="Empty Recycle Bin"
        description={`Are you sure you want to permanently delete all ${deletedItems.length} items? This action cannot be undone.`}
        confirmLabel="Empty Bin"
        variant="destructive"
        onConfirm={confirmEmptyBin}
      />
    </MainLayout>
  );
}
