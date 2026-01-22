import { 
  LayoutDashboard, 
  BookOpen, 
  GraduationCap, 
  Upload, 
  Download, 
  Trash2, 
  Users,
  ChevronLeft,
  ChevronRight,
  Library
} from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

const navItems = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
  { title: 'Books', url: '/books', icon: BookOpen },
  { title: 'Courses', url: '/courses', icon: GraduationCap },
  { title: 'Import/Export', url: '/import-export', icon: Upload },
  { title: 'Recycle Bin', url: '/recycle-bin', icon: Trash2 },
];

const adminOnlyItems = [
  { title: 'User Management', url: '/users', icon: Users },
];

export function AppSidebar() {
  const { user } = useAuth();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const allNavItems = user?.role === 'admin' 
    ? [...navItems, ...adminOnlyItems] 
    : navItems;

  return (
    <aside 
      className={cn(
        "h-screen gradient-primary flex flex-col transition-all duration-300 ease-in-out relative",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className={cn(
        "flex items-center gap-3 p-4 border-b border-white/10",
        collapsed && "justify-center"
      )}>
        <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
          <Library className="w-6 h-6 text-white" />
        </div>
        {!collapsed && (
          <div className="animate-fade-in">
            <h1 className="text-white font-bold text-lg leading-tight">MCCLRS</h1>
            <p className="text-white/60 text-xs">Mapúa Library System</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {allNavItems.map((item) => {
          const isActive = location.pathname === item.url;
          return (
            <NavLink
              key={item.url}
              to={item.url}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                isActive 
                  ? "bg-white/20 text-white shadow-lg" 
                  : "text-white/70 hover:bg-white/10 hover:text-white",
                collapsed && "justify-center px-2"
              )}
            >
              <item.icon className={cn("w-5 h-5 flex-shrink-0", isActive && "text-white")} />
              {!collapsed && (
                <span className="font-medium text-sm animate-fade-in">{item.title}</span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Collapse Toggle */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-white shadow-md hover:bg-white/90 text-primary"
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </Button>

      {/* User Info at Bottom */}
      {user && (
        <div className={cn(
          "p-4 border-t border-white/10",
          collapsed && "p-2"
        )}>
          <div className={cn(
            "flex items-center gap-3",
            collapsed && "justify-center"
          )}>
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <span className="text-white font-semibold text-sm">
                {user.name.split(' ').map(n => n[0]).join('')}
              </span>
            </div>
            {!collapsed && (
              <div className="animate-fade-in overflow-hidden">
                <p className="text-white font-medium text-sm truncate">{user.name}</p>
                <p className="text-white/60 text-xs capitalize">{user.role}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </aside>
  );
}
