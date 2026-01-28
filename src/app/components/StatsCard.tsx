import { Card } from "@/app/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
  isClickable?: boolean;
}

export function StatsCard({ title, value, icon: Icon, trend, trendUp, isClickable }: StatsCardProps) {
  return (
    <Card className={`p-6 transition-shadow ${isClickable ? "hover:shadow-lg cursor-pointer hover:bg-gray-50" : "hover:shadow-lg"}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <p className="text-sm text-gray-600 mb-2">{title}</p>
          <p className="text-4xl font-bold">{value}</p>
        </div>
        <div className="bg-blue-100 p-3 rounded-lg">
          <Icon className="h-6 w-6 text-blue-600" />
        </div>
      </div>
    </Card>
  );
}
