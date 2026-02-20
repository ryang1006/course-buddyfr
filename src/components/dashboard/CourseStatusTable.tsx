import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { Course } from '@/contexts/DataContext'; // Import the new centralized type

interface CourseStatusTableProps {
  courses: Course[];
}

export function CourseStatusTable({ courses }: CourseStatusTableProps) {
  const navigate = useNavigate();

  const getStatusColor = (assignedIds: string[]) => {
    if (assignedIds.length > 0) return 'bg-green-100 text-green-700 border-green-200';
    return 'bg-amber-100 text-amber-700 border-amber-200';
  };

  const getDeptColor = (dept: string) => {
    // Check if the dept string contains a certain code
    if (dept.includes('CS')) return 'bg-blue-100 text-blue-700';
    if (dept.includes('IT')) return 'bg-purple-100 text-purple-700';
    if (dept.includes('IS')) return 'bg-orange-100 text-orange-700';
    return 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Course Code</TableHead>
            <TableHead>Course Name</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {courses.map((course) => (
            <TableRow 
              key={course.id} 
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => navigate(`/courses/${course.id}`)}
            >
              <TableCell className="font-medium">{course.code}</TableCell>
              <TableCell>{course.name}</TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {course.department.map((dept) => (
                    <Badge key={dept} variant="secondary" className={getDeptColor(dept)}>
                      {dept}
                    </Badge>
                  ))}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className={getStatusColor(course.assignedBookIds)}>
                  {course.assignedBookIds.length > 0 ? 'Compliant' : 'Pending'}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}