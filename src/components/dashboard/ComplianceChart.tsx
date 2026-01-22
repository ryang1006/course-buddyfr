import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface ComplianceChartProps {
  complete: number;
  incomplete: number;
  outdated: number;
}

const COLORS = {
  complete: 'hsl(160, 84%, 39%)',
  incomplete: 'hsl(38, 92%, 50%)',
  outdated: 'hsl(350, 89%, 60%)',
};

export function ComplianceChart({ complete, incomplete, outdated }: ComplianceChartProps) {
  const data = [
    { name: 'Compliant', value: complete, color: COLORS.complete },
    { name: 'Incomplete', value: incomplete, color: COLORS.incomplete },
    { name: 'Outdated', value: outdated, color: COLORS.outdated },
  ];

  const total = complete + incomplete + outdated;

  return (
    <div className="bg-card rounded-xl p-6 shadow-card animate-slide-up" style={{ animationDelay: '200ms' }}>
      <h3 className="text-lg font-semibold text-foreground mb-4">Compliance Distribution</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: number) => [`${value} courses (${((value / total) * 100).toFixed(1)}%)`, '']}
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
            />
            <Legend 
              verticalAlign="bottom" 
              height={36}
              formatter={(value) => <span className="text-sm text-foreground">{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="grid grid-cols-3 gap-4 mt-4">
        <div className="text-center">
          <div className="w-3 h-3 rounded-full bg-success mx-auto mb-1" />
          <p className="text-2xl font-bold text-foreground">{complete}</p>
          <p className="text-xs text-muted-foreground">Compliant</p>
        </div>
        <div className="text-center">
          <div className="w-3 h-3 rounded-full bg-warning mx-auto mb-1" />
          <p className="text-2xl font-bold text-foreground">{incomplete}</p>
          <p className="text-xs text-muted-foreground">Incomplete</p>
        </div>
        <div className="text-center">
          <div className="w-3 h-3 rounded-full bg-danger mx-auto mb-1" />
          <p className="text-2xl font-bold text-foreground">{outdated}</p>
          <p className="text-xs text-muted-foreground">Outdated</p>
        </div>
      </div>
    </div>
  );
}
