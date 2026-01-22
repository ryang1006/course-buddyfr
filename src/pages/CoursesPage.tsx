import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, CheckCircle, AlertTriangle, XCircle, ChevronRight, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

const statusConfig = {
  complete: {
    label: 'Compliant',
    icon: CheckCircle,
    className: 'bg-success/10 text-success border-success/20',
    progressClass: 'bg-success',
  },
  incomplete: {
    label: 'Incomplete',
    icon: AlertTriangle,
    className: 'bg-warning/10 text-warning border-warning/20',
    progressClass: 'bg-warning',
  },
  outdated: {
    label: 'Outdated',
    icon: XCircle,
    className: 'bg-danger/10 text-danger border-danger/20',
    progressClass: 'bg-danger',
  },
};

export default function CoursesPage() {
  const navigate = useNavigate();
  const { courses, getCourseStatusFn } = useData();
  
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'complete' | 'incomplete' | 'outdated'>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');

  const departments = useMemo(() => {
    const depts = new Set(courses.map(c => c.department));
    return Array.from(depts);
  }, [courses]);

  const filteredCourses = useMemo(() => {
    let result = [...courses];

    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(
        c =>
          c.code.toLowerCase().includes(searchLower) ||
          c.name.toLowerCase().includes(searchLower) ||
          c.program.toLowerCase().includes(searchLower)
      );
    }

    if (statusFilter !== 'all') {
      result = result.filter(c => getCourseStatusFn(c) === statusFilter);
    }

    if (departmentFilter !== 'all') {
      result = result.filter(c => c.department === departmentFilter);
    }

    return result;
  }, [courses, search, statusFilter, departmentFilter, getCourseStatusFn]);

  return (
    <MainLayout title="Course Coding" subtitle="Manage course book allocations">
      {/* Filters */}
      <div className="bg-card rounded-xl p-4 shadow-card mb-6 animate-slide-up">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search courses..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="complete">Compliant</SelectItem>
              <SelectItem value="incomplete">Incomplete</SelectItem>
              <SelectItem value="outdated">Outdated</SelectItem>
            </SelectContent>
          </Select>
          <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map(dept => (
                <SelectItem key={dept} value={dept}>{dept}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Course Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourses.map((course, index) => {
          const status = getCourseStatusFn(course);
          const config = statusConfig[status];
          const StatusIcon = config.icon;
          const bookCount = course.assignedBookIds.length;
          const progress = Math.min((bookCount / 5) * 100, 100);

          return (
            <div
              key={course.id}
              onClick={() => navigate(`/courses/${course.id}`)}
              className="bg-card rounded-xl shadow-card hover:shadow-card-hover transition-all duration-300 cursor-pointer group animate-slide-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <Badge variant="outline" className="mb-2">{course.program}</Badge>
                    <h3 className="font-bold text-lg text-foreground">{course.code}</h3>
                    <p className="text-muted-foreground text-sm">{course.name}</p>
                  </div>
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center",
                    status === 'complete' && "bg-success/10",
                    status === 'incomplete' && "bg-warning/10",
                    status === 'outdated' && "bg-danger/10"
                  )}>
                    <StatusIcon className={cn(
                      "w-5 h-5",
                      status === 'complete' && "text-success",
                      status === 'incomplete' && "text-warning",
                      status === 'outdated' && "text-danger"
                    )} />
                  </div>
                </div>

                <p className="text-xs text-muted-foreground mb-3">{course.department}</p>

                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{bookCount}/5 books</span>
                    </div>
                    <Badge variant="outline" className={config.className}>
                      {config.label}
                    </Badge>
                  </div>
                  <Progress 
                    value={progress} 
                    className="h-2"
                  />
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <span className="text-sm text-muted-foreground">View details</span>
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredCourses.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No courses found</p>
        </div>
      )}
    </MainLayout>
  );
}
