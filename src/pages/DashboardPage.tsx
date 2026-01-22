import { MainLayout } from '@/components/layout/MainLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { ComplianceChart } from '@/components/dashboard/ComplianceChart';
import { DepartmentChart } from '@/components/dashboard/DepartmentChart';
import { CourseStatusTable } from '@/components/dashboard/CourseStatusTable';
import { useData } from '@/contexts/DataContext';
import { BookOpen, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

export default function DashboardPage() {
  const { courses, getStats, getDepartmentStats } = useData();
  const stats = getStats();
  const departmentStats = getDepartmentStats();

  return (
    <MainLayout 
      title="Dashboard" 
      subtitle="Overview of course coding compliance and book allocation"
    >
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Courses"
          value={stats.total}
          icon={BookOpen}
          variant="primary"
          delay={0}
        />
        <StatCard
          title="Compliant Courses"
          value={stats.complete}
          icon={CheckCircle}
          variant="success"
          delay={100}
        />
        <StatCard
          title="Incomplete Courses"
          value={stats.incomplete}
          icon={AlertTriangle}
          variant="warning"
          delay={200}
        />
        <StatCard
          title="Outdated Courses"
          value={stats.outdated}
          icon={XCircle}
          variant="danger"
          delay={300}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <ComplianceChart 
          complete={stats.complete} 
          incomplete={stats.incomplete} 
          outdated={stats.outdated} 
        />
        <DepartmentChart data={departmentStats} />
      </div>

      {/* Course Status Table */}
      <CourseStatusTable courses={courses} />
    </MainLayout>
  );
}
