import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  variant: 'primary' | 'success' | 'warning' | 'danger';
  delay?: number;
}

const variantStyles = {
  primary: 'gradient-primary',
  success: 'gradient-success',
  warning: 'gradient-warning',
  danger: 'gradient-danger',
};

const iconBgStyles = {
  primary: 'bg-white/20',
  success: 'bg-white/20',
  warning: 'bg-white/20',
  danger: 'bg-white/20',
};

export function StatCard({ title, value, icon: Icon, variant, delay = 0 }: StatCardProps) {
  return (
    <div 
      className={cn(
        "rounded-xl p-6 text-white shadow-card-hover transition-all duration-300 hover:scale-[1.02] hover:shadow-xl animate-slide-up",
        variantStyles[variant]
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-white/80 text-sm font-medium mb-1">{title}</p>
          <p className="text-4xl font-bold animate-count-up">{value}</p>
        </div>
        <div className={cn("p-3 rounded-lg", iconBgStyles[variant])}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}
