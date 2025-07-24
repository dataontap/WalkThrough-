import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend: {
    value: string;
    isUp: boolean;
  };
  iconBg: string;
}

export function StatsCard({ title, value, icon, trend, iconBg }: StatsCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-neutral-600">{title}</p>
            <p className="text-2xl font-semibold text-neutral-800 mt-1">{value}</p>
          </div>
          <div className={`w-12 h-12 ${iconBg} rounded-lg flex items-center justify-center`}>
            {icon}
          </div>
        </div>
        <div className="flex items-center mt-4 text-sm">
          <span className={trend.isUp ? "text-green-500" : "text-red-500"}>
            {trend.isUp ? (
              <TrendingUp className="h-3 w-3 mr-1 inline" />
            ) : (
              <TrendingDown className="h-3 w-3 mr-1 inline" />
            )}
            {trend.value}
          </span>
          <span className="text-neutral-500 ml-2">vs last month</span>
        </div>
      </CardContent>
    </Card>
  );
}
