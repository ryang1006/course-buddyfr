import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface DepartmentChartProps {
  data: { name: string; count: number }[];
}

const GRADIENT_COLORS = [
  'hsl(226, 71%, 40%)',
  'hsl(262, 83%, 58%)',
  'hsl(226, 71%, 50%)',
  'hsl(262, 83%, 68%)',
  'hsl(226, 71%, 60%)',
  'hsl(262, 83%, 78%)',
];

export function DepartmentChart({ data }: DepartmentChartProps) {
  return (
    <div className="bg-card rounded-xl p-6 shadow-card animate-slide-up" style={{ animationDelay: '300ms' }}>
      <h3 className="text-lg font-semibold text-foreground mb-4">Books by Department</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 20, right: 20 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="hsl(var(--border))" />
            <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
            <YAxis 
              type="category" 
              dataKey="name" 
              width={120}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
            />
            <Tooltip 
              formatter={(value: number) => [`${value} books`, 'Count']}
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
            />
            <Bar dataKey="count" radius={[0, 4, 4, 0]}>
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={GRADIENT_COLORS[index % GRADIENT_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
