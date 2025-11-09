import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Mail, Send, Users, TrendingUp } from "lucide-react";

const stats = [
  {
    title: "Total Templates",
    value: "12",
    description: "+2 from last month",
    icon: Mail,
    trend: "up",
  },
  {
    title: "Active Campaigns",
    value: "8",
    description: "3 scheduled",
    icon: Send,
    trend: "neutral",
  },
  {
    title: "Total Contacts",
    value: "1,234",
    description: "+156 this month",
    icon: Users,
    trend: "up",
  },
  {
    title: "Open Rate",
    value: "42.5%",
    description: "+5.2% from last month",
    icon: TrendingUp,
    trend: "up",
  },
];

export function DashboardStats() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

