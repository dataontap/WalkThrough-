import { useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PlayCircle, MoreHorizontal, Edit, Trash, Copy, Play } from "lucide-react";
import { VideoPlayer } from "./video-player";
import { MoodTracker, type MoodRating } from "./mood-tracker";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { WalkthroughWithSteps, WalkthroughRating } from "@shared/schema";

interface WalkthroughCardProps {
  walkthrough: WalkthroughWithSteps;
  showActions?: boolean;
}

export function WalkthroughCard({ walkthrough, showActions = false }: WalkthroughCardProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user's existing rating for this walkthrough
  const { data: userRating } = useQuery<WalkthroughRating | null>({
    queryKey: ['/api/walkthroughs', walkthrough.id, 'user-rating'],
    enabled: dialogOpen // Only fetch when dialog is open
  });

  // Mutation to submit rating
  const ratingMutation = useMutation({
    mutationFn: (rating: MoodRating) => 
      apiRequest(`/api/walkthroughs/${walkthrough.id}/ratings`, {
        method: 'POST',
        body: JSON.stringify(rating)
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/walkthroughs', walkthrough.id, 'user-rating'] });
      toast({
        title: "Rating submitted!",
        description: "Thank you for your feedback on this walkthrough."
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit rating. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleRatingSubmit = (rating: MoodRating) => {
    ratingMutation.mutate(rating);
  };
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-700";
      case "draft":
        return "bg-orange-100 text-orange-600";
      case "archived":
        return "bg-neutral-100 text-neutral-600";
      default:
        return "bg-neutral-100 text-neutral-600";
    }
  };

  const getIconColor = (status: string) => {
    switch (status) {
      case "active":
        return "text-green-500";
      case "draft":
        return "text-orange-500";
      case "archived":
        return "text-neutral-500";
      default:
        return "text-primary";
    }
  };

  return (
    <div className="flex items-center justify-between p-4 rounded-lg border border-neutral-100 hover:border-neutral-200 transition-colors">
      <div className="flex items-center space-x-4">
        <div className={`w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center`}>
          <PlayCircle className={`h-5 w-5 ${getIconColor(walkthrough.status)}`} />
        </div>
        <div>
          <h4 className="font-medium text-neutral-800">{walkthrough.title}</h4>
          <p className="text-sm text-neutral-500">
            {walkthrough.targetApp} • {walkthrough.createdByUser?.username || 'Unknown'} • 
            {walkthrough.updatedAt ? new Date(walkthrough.updatedAt).toLocaleDateString() : 'Unknown date'}
          </p>
          {walkthrough.description && (
            <p className="text-sm text-neutral-400 mt-1 line-clamp-2">{walkthrough.description}</p>
          )}
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <Badge className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(walkthrough.status)}`}>
          {walkthrough.status}
        </Badge>
        
        {walkthrough.videoUrl && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Play className="h-4 w-4 mr-2" />
                View Recording
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>{walkthrough.title}</DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                <VideoPlayer 
                  videoUrl={walkthrough.videoUrl} 
                  title={walkthrough.title}
                  isDemo={walkthrough.videoUrl?.includes('cdn.shookla.ai')}
                />
                {walkthrough.scriptContent && (
                  <div className="p-4 bg-neutral-50 rounded-lg">
                    <h4 className="font-medium mb-2">Script Content:</h4>
                    <p className="text-sm text-neutral-600">{walkthrough.scriptContent}</p>
                  </div>
                )}
                <MoodTracker
                  onSubmit={handleRatingSubmit}
                  isLoading={ratingMutation.isPending}
                  initialRating={userRating ? {
                    difficulty: userRating.difficulty,
                    satisfaction: userRating.satisfaction,
                    comment: userRating.comment || ''
                  } : undefined}
                />
              </div>
            </DialogContent>
          </Dialog>
        )}
        
        {showActions && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="text-neutral-400 hover:text-neutral-600">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Copy className="h-4 w-4 mr-2" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem className="text-red-600">
                <Trash className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}
