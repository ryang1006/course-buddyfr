import { useState, useMemo } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { ComplianceChart } from '@/components/dashboard/ComplianceChart';
import { DepartmentChart } from '@/components/dashboard/DepartmentChart';
import { CourseStatusTable } from '@/components/dashboard/CourseStatusTable';
import { useData } from '@/contexts/DataContext';
import { BookOpen, CheckCircle, AlertTriangle, Library, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

export default function DashboardPage() {
  // Destructured 'books' to fix the "Cannot find name 'books'" error
  const { courses, books, loading, getStats, getDepartmentStats } = useData();
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');

  const statsData = getStats();
  const deptStats = getDepartmentStats();

  const uniqueDepts = useMemo(() => {
    const depts = new Set<string>();
    courses.forEach(c => {
      if (Array.isArray(c.department)) {
        c.department.forEach(d => depts.add(d));
      }
    });
    return Array.from(depts).sort();
  }, [courses]);

  const filteredCourses = useMemo(() => {
    return courses.filter(course => {
      const matchesSearch = 
        course.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.name.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesDept = deptFilter === 'all' || course.department.includes(deptFilter);
      
      return matchesSearch && matchesDept;
    });
  }, [courses, searchQuery, deptFilter]);

  // Fixed: Replaced invalid variants with allowed values ('primary', 'success', 'warning')
  const statCards = [
    { 
      title: 'Total Courses', 
      value: statsData.total, 
      icon: BookOpen, 
      variant: 'primary' as const,
      description: 'Total curriculum entries'
    },
    { 
      title: 'Compliant', 
      value: statsData.complete, 
      icon: CheckCircle, 
      variant: 'success' as const,
      description: 'With assigned resources'
    },
    { 
      title: 'Pending Resources', 
      value: statsData.incomplete, 
      icon: AlertTriangle, 
      variant: 'warning' as const,
      description: 'Missing book links'
    },
    { 
      title: 'Library Assets', 
      value: books.length, 
      icon: Library, 
      variant: 'primary' as const,
      description: 'Total unique titles'
    },
  ];

  // Fixed: Mapped 'total' to 'count' to satisfy DepartmentChart requirements
  const chartDeptData = deptStats.map(d => ({
    name: d.name,
    count: d.total
  }));

  if (loading) {
    return (
      <MainLayout title="Dashboard" subtitle="Loading library analytics...">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout 
      title="Library Dashboard" 
      subtitle="Monitoring curriculum resource compliance and asset distribution"
    >
      {/* Stat Cards Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat) => (
          // Fixed: Changed key from stat.label to stat.title
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <ComplianceChart 
          complete={statsData.complete} 
          incomplete={statsData.incomplete} 
          outdated={0} // Fixed: Added missing required outdated prop
        />
        <DepartmentChart data={chartDeptData} />
      </div>

      {/* Course List Section */}
      <div className="bg-card rounded-xl shadow-card border border-border overflow-hidden">
        <div className="p-6 border-b border-border">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h3 className="text-lg font-semibold">Course Compliance Status</h3>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search code or title..."
                  className="pl-9 w-full sm:w-64"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <Select value={deptFilter} onValueChange={setDeptFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {uniqueDepts.map(dept => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="p-0">
          <CourseStatusTable courses={filteredCourses} />
        </div>
      </div>
    </MainLayout>
  );
}