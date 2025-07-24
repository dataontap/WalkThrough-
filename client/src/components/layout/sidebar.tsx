import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { LayoutDashboard, PlayCircle, Users, Settings, BarChart3, LogOut, Route } from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Walkthroughs", href: "/walkthroughs", icon: PlayCircle },
  { name: "User Management", href: "/users", icon: Users },
  { name: "API Test", href: "/api-test", icon: Route },
  { name: "Settings", href: "/settings", icon: Settings },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
];

export function Sidebar() {
  const [location] = useLocation();

  return (
    <aside className="w-64 bg-white border-r border-neutral-200 flex flex-col">
      {/* Logo Section */}
      <div className="p-6 border-b border-neutral-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
            <Route className="text-white text-sm" />
          </div>
          <h1 className="text-xl font-semibold text-neutral-800">Walkthroughs</h1>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            
            return (
              <li key={item.name}>
                <Link href={item.href}>
                  <a
                    className={cn(
                      "flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors",
                      isActive
                        ? "bg-primary text-white"
                        : "text-neutral-600 hover:bg-neutral-100"
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </a>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-neutral-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-neutral-300 rounded-full flex items-center justify-center">
            <Users className="text-neutral-600 text-sm" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-neutral-800">Admin User</p>
            <p className="text-xs text-neutral-500">Administrator</p>
          </div>
          <button className="text-neutral-400 hover:text-neutral-600 transition-colors">
            <LogOut className="text-sm" />
          </button>
        </div>
      </div>
    </aside>
  );
}
