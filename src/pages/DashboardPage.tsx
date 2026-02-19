import { useState, useMemo } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { ComplianceChart } from '@/components/dashboard/ComplianceChart';
import { DepartmentChart } from '@/components/dashboard/DepartmentChart';
import { CourseStatusTable } from '@/components/dashboard/CourseStatusTable';
import { useData } from '@/contexts/DataContext';
import { BookOpen, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function DashboardPage() {
  const { courses, getStats, getDepartmentStats, getCourseStatusFn } = useData();

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'complete' | 'incomplete' | 'outdated'>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');

  // Departments
  const departments = useMemo(() => {
    const depts = new Set(courses.map(c => c.department));
    return Array.from(depts);
  }, [courses]);

  // Filtered courses (logic from CoursesPage)
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

  const stats = getStats();
  const departmentStats = getDepartmentStats();

  return (
    <MainLayout title="Dashboard" subtitle="Overview of course coding compliance and book allocation">

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total Courses" value={stats.total} icon={BookOpen} variant='primary'/>
        <StatCard title="Compliant" value={stats.complete} icon={CheckCircle} variant="success" />
        <StatCard title="Incomplete" value={stats.incomplete} icon={AlertTriangle} variant="warning" />
        <StatCard title="Outdated" value={stats.outdated} icon={XCircle} variant="danger" />
      </div>

      {/* Filters (same as CoursesPage) */}
      <div className="bg-card rounded-xl p-4 shadow-card mb-6 animate-slide-up flex flex-col md:flex-row gap-4 items-start md:items-center">
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

      {/* Course Status Table */}
      <div className="bg-card rounded-xl shadow-card p-6">
        <CourseStatusTable courses={filteredCourses} />
      </div>

      {filteredCourses.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No courses found</p>
        </div>
      )}
    </MainLayout>
  );
}
