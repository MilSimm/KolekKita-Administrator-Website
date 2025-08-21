import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  change: number;
  icon: LucideIcon;
  iconColor: string;
  iconBgColor: string;
}

export const StatsCard = ({ 
  title, 
  value, 
  change, 
  icon: Icon, 
  iconColor, 
  iconBgColor 
}: StatsCardProps) => {
  const isPositive = change > 0;
  const isNegative = change < 0;

  return (
    <Card className="border-gray-100 dark:border-gray-800" data-testid={`card-stats-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400" data-testid={`text-${title.toLowerCase().replace(/\s+/g, '-')}-title`}>
              {title}
            </p>
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1" data-testid={`text-${title.toLowerCase().replace(/\s+/g, '-')}-value`}>
              {value}
            </p>
            <div className="flex items-center mt-2">
              {isPositive && <TrendingUp className="h-4 w-4 text-green-500 mr-1" />}
              {isNegative && <TrendingDown className="h-4 w-4 text-red-500 mr-1" />}
              <span 
                className={cn(
                  "text-sm",
                  isPositive && "text-green-500",
                  isNegative && "text-red-500",
                  !isPositive && !isNegative && "text-gray-500"
                )}
                data-testid={`text-${title.toLowerCase().replace(/\s+/g, '-')}-change`}
              >
                {change > 0 && "+"}
                {Math.abs(change)}
                {title === "Revenue Today" ? "%" : title === "Customer Rating" ? " improvement" : 
                 title === "Active Bookings" ? "% from last week" : " from yesterday"}
              </span>
            </div>
          </div>
          <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center", iconBgColor)}>
            <Icon className={cn("h-6 w-6", iconColor)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
