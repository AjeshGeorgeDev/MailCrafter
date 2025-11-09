import { Users, Mail, Zap, TrendingUp } from "lucide-react";

const stats = [
  {
    icon: Users,
    value: "10K+",
    label: "Active Users",
    description: "Trusted by teams worldwide",
  },
  {
    icon: Mail,
    value: "1M+",
    label: "Emails Sent",
    description: "Successfully delivered",
  },
  {
    icon: Zap,
    value: "99.9%",
    label: "Uptime",
    description: "Reliable infrastructure",
  },
  {
    icon: TrendingUp,
    value: "40%",
    label: "Avg. Open Rate",
    description: "Industry leading results",
  },
];

export function Stats() {
  return (
    <section className="py-20 bg-gradient-to-b from-white to-gray-50">
      <div className="container">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="text-center space-y-2"
              >
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-500">
                  <Icon className="h-8 w-8 text-white" />
                </div>
                <div className="text-4xl font-bold text-gray-900">
                  {stat.value}
                </div>
                <div className="text-lg font-semibold text-gray-700">
                  {stat.label}
                </div>
                <div className="text-sm text-gray-500">{stat.description}</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

