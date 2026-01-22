import { useNavigate } from 'react-router-dom';
import { Course } from '@/lib/mockData';
import { useData } from '@/contexts/DataContext';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ChevronRight, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

interface CourseStatusTableProps {
  courses: Course[];
}

const statusConfig = {
  complete: {
    label: 'Compliant',
    icon: CheckCircle,
    className: 'bg-success/10 text-success border-success/20',
  },
  incomplete: {
    label: 'Incomplete',
    icon: AlertTriangle,
    className: 'bg-warning/10 text-warning border-warning/20',
  },
  outdated: {
    label: 'Outdated',
    icon: XCircle,
    className: 'bg-danger/10 text-danger border-danger/20',
  },
};

export function CourseStatusTable({ courses }: CourseStatusTableProps) {
  const navigate = useNavigate();
  const { getCourseStatusFn } = useData();

  return (
    <div className="bg-card rounded-xl shadow-card animate-slide-up" style={{ animationDelay: '400ms' }}>
      <div className="p-6 border-b border-border">
        <h3 className="text-lg font-semibold text-foreground">Course Status Overview</h3>
        <p className="text-sm text-muted-foreground mt-1">Click on a course to view details</p>
      </div>
      <div className="divide-y divide-border">
        {courses.slice(0, 8).map((course) => {
          const status = getCourseStatusFn(course);
          const config = statusConfig[status];
          const StatusIcon = config.icon;
          
          return (
            <div
              key={course.id}
              onClick={() => navigate(`/courses/${course.id}`)}
              className="flex items-center justify-between p-4 hover:bg-muted/50 cursor-pointer transition-colors group"
            >
              <div className="flex items-center gap-4">
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
                <div>
                  <p className="font-medium text-foreground">{course.code}</p>
                  <p className="text-sm text-muted-foreground">{course.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm font-medium text-foreground">
                    {course.assignedBookIds.length}/5 books
                  </p>
                  <Badge variant="outline" className={config.className}>
                    {config.label}
                  </Badge>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
              </div>
            </div>
          );
        })}
      </div>
      {courses.length > 8 && (
        <div className="p-4 border-t border-border">
          <button 
            onClick={() => navigate('/courses')}
            className="text-sm text-primary hover:text-primary/80 font-medium"
          >
            View all {courses.length} courses →
          </button>
        </div>
      )}
    </div>
  );
}
