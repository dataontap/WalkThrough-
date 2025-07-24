import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { WalkthroughCard } from "@/components/walkthrough/walkthrough-card";
import { CreateWalkthroughModal } from "@/components/walkthrough/create-walkthrough-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Filter, PlayCircle } from "lucide-react";
import { useState } from "react";
import type { WalkthroughWithSteps } from "@shared/schema";

export default function Walkthroughs() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: walkthroughs, isLoading } = useQuery<WalkthroughWithSteps[]>({
    queryKey: ['/api/walkthroughs']
  });

  const filteredWalkthroughs = walkthroughs?.filter((walkthrough) => {
    const matchesSearch = walkthrough.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         walkthrough.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         walkthrough.targetApp.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || walkthrough.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  }) || [];

  const handleCreateWalkthrough = () => {
    setIsCreateModalOpen(true);
  };

  return (
    <div className="min-h-screen flex bg-neutral-50">
      <Sidebar />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title="Walkthroughs" 
          subtitle="Create and manage your automated tutorials"
          actions={
            <Button onClick={handleCreateWalkthrough} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              New Walkthrough
            </Button>
          }
        />

        <div className="flex-1 overflow-y-auto p-6">
          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
                  <Input
                    placeholder="Search walkthroughs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-48">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Walkthroughs Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="w-10 h-10 bg-neutral-200 rounded-lg"></div>
                      <div className="flex-1 space-y-2">
                        <div className="w-3/4 h-4 bg-neutral-200 rounded"></div>
                        <div className="w-1/2 h-3 bg-neutral-200 rounded"></div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="w-full h-3 bg-neutral-200 rounded"></div>
                      <div className="w-2/3 h-3 bg-neutral-200 rounded"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredWalkthroughs.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredWalkthroughs.map((walkthrough) => (
                <Card key={walkthrough.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <WalkthroughCard walkthrough={walkthrough} showActions />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <PlayCircle className="h-16 w-16 text-neutral-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-neutral-600 mb-2">
                  {searchQuery || statusFilter !== "all" ? "No walkthroughs found" : "No walkthroughs yet"}
                </h3>
                <p className="text-neutral-500 mb-6 max-w-md mx-auto">
                  {searchQuery || statusFilter !== "all" 
                    ? "Try adjusting your search criteria or filters" 
                    : "Create your first walkthrough to help users navigate applications with ease"}
                </p>
                <Button onClick={handleCreateWalkthrough}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Walkthrough
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <CreateWalkthroughModal 
        open={isCreateModalOpen} 
        onOpenChange={setIsCreateModalOpen} 
      />
    </div>
  );
}
