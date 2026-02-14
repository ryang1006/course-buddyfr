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
import { useAuth } from '@/contexts/AuthContext';

export default function UserManagementPage() {
  const [dbUsers, setDbUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

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


  const handleAddUser = async () => {
    // In a real app, you'd get these from a Modal form
    const email = prompt("Enter Email:");
    const password = prompt("Enter Temporary Password (min 6 chars):");
    const fullName = prompt("Enter Full Name:");
    const role = prompt("Enter Role (admin/librarian):") || 'librarian';

    if (!email || !password || !fullName) return;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: role
        }
      }
    });

    if (error) {
      toast.error("Error creating user: " + error.message);
    } else {
      toast.success("User created! They will appear in the list once they confirm their email.");
      // The trigger we wrote in Step 1 handles the insertion into the table!
    }
  };

  const handleDelete = async (userId: string) => {
    if (window.confirm("Are you sure you want to delete this user? This cannot be undone.")) {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (error) {
        toast.error('Error deleting user: ' + error.message);
      } else {
        setDbUsers(dbUsers.filter(u => u.id !== userId));
        toast.success('User removed from system');
      }
    }
  };

  const toggleRole = async (userId: string, currentRole: string) => {
    
    if (userId === user?.id) {
    toast.error("Security Risk: You cannot change your own administrative role.");
    return;
    }

    const newRole = currentRole === 'admin' ? 'librarian' : 'admin';

  const { error: profileError } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId);

    if (profileError) {
      toast.error("Error updating profile: " + profileError.message);
      return;
    }

    // Update local state so the UI changes immediately
    setDbUsers(dbUsers.map(u => u.id === userId ? { ...u, role: newRole } : u));
    toast.success(`${newRole.toUpperCase()} role granted. User must re-login to update permissions.`);

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
          <Button className="gradient-primary text-white" onClick={handleAddUser}>
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
            {dbUsers.map((u) => (
              <TableRow key={u.id} className="hover:bg-muted/50">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">
                        {(u.name || 'User').split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{u.name}</p>
                      <p className="text-sm text-muted-foreground">Active</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="font-mono">{u.username}</TableCell>
                <TableCell>
                  <Badge 
                    variant="outline"
                    className={cn(
                      u.role === 'admin'
                        ? 'bg-primary/10 text-primary border-primary/20'
                        : 'bg-success/10 text-success border-success/20'
                    )}
                  >
                    {u.role === 'admin' ? (
                      <Shield className="w-3 h-3 mr-1" />
                    ) : (
                      <UserCog className="w-3 h-3 mr-1" />
                    )}
                    {u.role === 'admin' ? 'Administrator' : 'Librarian'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {u.role === 'admin' ? (
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
                      onClick={() => toggleRole(u.id, u.role)}
                      // Disable the button if this row belongs to the currently logged-in admin
                      disabled={u.id === user?.id}
                      className={u.id === user?.id ? "opacity-50 cursor-not-allowed" : ""}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-danger hover:text-danger"
                      onClick={() => handleDelete(u.id)}
                      disabled={u.role === 'admin' || u.id === user?.id }
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

    </MainLayout>
  );
}
