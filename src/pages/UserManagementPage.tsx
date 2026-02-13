import { MainLayout } from '@/components/layout/MainLayout';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { User, Shield, UserCog, Edit, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function UserManagementPage() {
  const [dbUsers, setDbUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUsers() {
      const { data, error } = await supabase
        .from('profiles')
        .select('*');
      
      if (!error && data) {
        setDbUsers(data);
      }
      setLoading(false);
    }
    fetchUsers();
  }, []);

  const handleEdit = (userId: string) => {
    toast.info('User editing is a demo feature');
  };

  const handleDelete = (userId: string) => {
    toast.info('User deletion is a demo feature');
  };

  return (
    <MainLayout title="User Management" subtitle="Manage system users and permissions">
      <div className="bg-card rounded-xl shadow-card overflow-hidden animate-slide-up">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-lg">System Users</h3>
            <p className="text-sm text-muted-foreground">
              Manage user accounts and access levels
            </p>
          </div>
          <Button className="gradient-primary text-white">
            <User className="w-4 h-4 mr-2" />
            Add User
          </Button>
        </div>
        
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>User</TableHead>
              <TableHead>Username</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Permissions</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {dbUsers.map((user) => (
              <TableRow key={user.id} className="hover:bg-muted/50">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">
                        {user.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{user.name}</p>
                      <p className="text-sm text-muted-foreground">Active</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="font-mono">{user.username}</TableCell>
                <TableCell>
                  <Badge 
                    variant="outline"
                    className={cn(
                      user.role === 'admin'
                        ? 'bg-primary/10 text-primary border-primary/20'
                        : 'bg-success/10 text-success border-success/20'
                    )}
                  >
                    {user.role === 'admin' ? (
                      <Shield className="w-3 h-3 mr-1" />
                    ) : (
                      <UserCog className="w-3 h-3 mr-1" />
                    )}
                    {user.role === 'admin' ? 'Administrator' : 'Librarian'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {user.role === 'admin' ? (
                      <>
                        <Badge variant="secondary" className="text-xs">All Access</Badge>
                      </>
                    ) : (
                      <>
                        <Badge variant="secondary" className="text-xs">Books</Badge>
                        <Badge variant="secondary" className="text-xs">Courses</Badge>
                        <Badge variant="secondary" className="text-xs">Import/Export</Badge>
                      </>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(user.id)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-danger hover:text-danger"
                      onClick={() => handleDelete(user.id)}
                      disabled={user.role === 'admin'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Info Card */}
      <div className="mt-6 bg-muted/50 rounded-xl p-6 animate-slide-up" style={{ animationDelay: '100ms' }}>
        <h4 className="font-medium text-foreground mb-2">Demo Note</h4>
        <p className="text-sm text-muted-foreground">
          User management features are for demonstration purposes. In a production environment, 
          this would integrate with your authentication system to manage real user accounts and permissions.
        </p>
      </div>
    </MainLayout>
  );
}
