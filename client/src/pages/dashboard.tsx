import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { StatsCard } from "@/components/walkthrough/stats-card";
import { WalkthroughCard } from "@/components/walkthrough/walkthrough-card";
import { CreateWalkthroughModal } from "@/components/walkthrough/create-walkthrough-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Upload, Users, TrendingUp, TrendingDown, Clock, CheckCircle, PlayCircle } from "lucide-react";
import { useState } from "react";
import type { DashboardStats, WalkthroughWithSteps } from "@shared/schema";

export default function Dashboard() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ['/api/dashboard/stats']
  });

  const { data: walkthroughs, isLoading: walkthroughsLoading } = useQuery<WalkthroughWithSteps[]>({
    queryKey: ['/api/walkthroughs']
  });

  const recentWalkthroughs = walkthroughs?.slice(0, 3) || [];

  const handleCreateWalkthrough = () => {
    setIsCreateModalOpen(true);
  };

  return (
    <div className="min-h-screen flex bg-neutral-50">
      <Sidebar />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title="Dashboard" 
          subtitle="Manage your walkthroughs and automation projects"
          actions={
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button onClick={handleCreateWalkthrough} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Walkthrough
              </Button>
            </div>
          }
        />

        <div className="flex-1 overflow-y-auto p-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatsCard
              title="Total Walkthroughs"
              value={statsLoading ? "..." : stats?.totalWalkthroughs.toString() || "0"}
              icon={<PlayCircle className="h-5 w-5 text-primary" />}
              trend={{ value: "12%", isUp: true }}
              iconBg="bg-primary/10"
            />
            <StatsCard
              title="Active Users"
              value={statsLoading ? "..." : stats?.activeUsers.toString() || "0"}
              icon={<Users className="h-5 w-5 text-purple-500" />}
              trend={{ value: "8%", isUp: true }}
              iconBg="bg-purple-100"
            />
            <StatsCard
              title="Completion Rate"
              value={statsLoading ? "..." : stats?.completionRate || "0%"}
              icon={<CheckCircle className="h-5 w-5 text-green-500" />}
              trend={{ value: "3%", isUp: true }}
              iconBg="bg-green-100"
            />
            <StatsCard
              title="Avg. Duration"
              value={statsLoading ? "..." : stats?.avgDuration || "0s"}
              icon={<Clock className="h-5 w-5 text-orange-500" />}
              trend={{ value: "2%", isUp: false }}
              iconBg="bg-orange-100"
            />
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Walkthroughs */}
            <div className="lg:col-span-2">
              <Card>
                <div className="p-6 border-b border-neutral-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-neutral-800">Recent Walkthroughs</h3>
                    <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                      View All
                    </Button>
                  </div>
                </div>
                <CardContent className="p-6">
                  {walkthroughsLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center space-x-4 p-4 border border-neutral-100 rounded-lg animate-pulse">
                          <div className="w-10 h-10 bg-neutral-200 rounded-lg"></div>
                          <div className="flex-1 space-y-2">
                            <div className="w-48 h-4 bg-neutral-200 rounded"></div>
                            <div className="w-32 h-3 bg-neutral-200 rounded"></div>
                          </div>
                          <div className="w-16 h-6 bg-neutral-200 rounded-full"></div>
                        </div>
                      ))}
                    </div>
                  ) : recentWalkthroughs.length > 0 ? (
                    <div className="space-y-4">
                      {recentWalkthroughs.map((walkthrough) => (
                        <WalkthroughCard key={walkthrough.id} walkthrough={walkthrough} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <PlayCircle className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
                      <h4 className="text-lg font-medium text-neutral-600 mb-2">No walkthroughs yet</h4>
                      <p className="text-neutral-500 mb-4">Create your first walkthrough to get started</p>
                      <Button onClick={handleCreateWalkthrough}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Walkthrough
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions & Activity */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-neutral-800 mb-4">Quick Actions</h3>
                  <div className="space-y-3">
                    <Button
                      variant="outline"
                      className="w-full justify-start h-auto p-3 border-neutral-200 hover:border-primary hover:bg-primary/5"
                      onClick={handleCreateWalkthrough}
                    >
                      <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center mr-3">
                        <Plus className="h-4 w-4 text-primary" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-neutral-800">Create Walkthrough</p>
                        <p className="text-sm text-neutral-500">Start a new tutorial</p>
                      </div>
                    </Button>
                    
                    <Button
                      variant="outline"
                      className="w-full justify-start h-auto p-3 border-neutral-200 hover:border-purple-500 hover:bg-purple-50"
                    >
                      <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                        <Upload className="h-4 w-4 text-purple-500" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-neutral-800">Import Template</p>
                        <p className="text-sm text-neutral-500">Use existing patterns</p>
                      </div>
                    </Button>
                    
                    <Button
                      variant="outline"
                      className="w-full justify-start h-auto p-3 border-neutral-200 hover:border-green-500 hover:bg-green-50"
                    >
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                        <Users className="h-4 w-4 text-green-500" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-neutral-800">Manage Users</p>
                        <p className="text-sm text-neutral-500">Add credentials & roles</p>
                      </div>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-neutral-800 mb-4">Recent Activity</h3>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                      <div className="flex-1">
                        <p className="text-sm text-neutral-800">Welcome to Shookla.ai!</p>
                        <p className="text-xs text-neutral-500">Get started by creating your first walkthrough</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <CreateWalkthroughModal 
        open={isCreateModalOpen} 
        onOpenChange={setIsCreateModalOpen} 
      />
    </div>
  );
}
