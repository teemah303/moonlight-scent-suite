import { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  onClick?: () => void;
}

export function StatCard({ title, value, icon: Icon, trend, onClick }: StatCardProps) {
  return (
    <Card 
      className={`bg-card border-border hover:border-primary transition-all duration-300 ${onClick ? 'cursor-pointer hover:shadow-[0_0_20px_rgba(255,215,0,0.3)]' : ''}`}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-5 w-5 text-primary" />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-foreground">{value}</div>
        {trend && <p className="text-xs text-primary mt-1">{trend}</p>}
      </CardContent>
    </Card>
  );
}
