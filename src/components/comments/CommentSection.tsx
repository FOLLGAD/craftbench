
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistance } from "date-fns";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { 
  Comment, 
  addComment, 
  deleteComment, 
  getComparisonComments 
} from "@/lib/models";

interface CommentSectionProps {
  comparisonId: string;
}

const CommentSection: React.FC<CommentSectionProps> = ({ comparisonId }) => {
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();
  
  // Get current user
  const { data: authData } = useQuery({
    queryKey: ["current-user"],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      return data.user;
    }
  });
  
  // Fetch comments
  const { data: comments, isLoading } = useQuery({
    queryKey: ["comparison-comments", comparisonId],
    queryFn: () => getComparisonComments(comparisonId),
    refetchOnWindowFocus: false,
  });
  
  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: (content: string) => addComment(comparisonId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comparison-comments", comparisonId] });
      setNewComment("");
      toast.success("Comment added successfully");
    },
    onError: (error) => {
      toast.error(`Failed to add comment: ${error instanceof Error ? error.message : "Unknown error"}`);
    },
  });
  
  // Delete comment mutation
  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: string) => deleteComment(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comparison-comments", comparisonId] });
      toast.success("Comment deleted");
    },
    onError: (error) => {
      toast.error(`Failed to delete comment: ${error instanceof Error ? error.message : "Unknown error"}`);
    },
  });
  
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    if (!authData) {
      toast.error("You must be logged in to comment");
      return;
    }
    
    setIsSubmitting(true);
    try {
      await addCommentMutation.mutateAsync(newComment);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDeleteComment = async (commentId: string) => {
    if (confirm("Are you sure you want to delete this comment?")) {
      await deleteCommentMutation.mutateAsync(commentId);
    }
  };
  
  const formatTimeAgo = (timestamp: string) => {
    return formatDistance(new Date(timestamp), new Date(), { addSuffix: true });
  };
  
  if (isLoading) {
    return (
      <div className="mt-8 space-y-4">
        <h2 className="text-xl font-semibold mb-4">Comments</h2>
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }
  
  return (
    <div className="mt-8 space-y-4">
      <h2 className="text-xl font-semibold mb-4">Comments ({comments?.length || 0})</h2>
      
      {/* Comment form */}
      <form onSubmit={handleSubmitComment} className="mb-6">
        <Textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder={authData ? "Add your comment..." : "Sign in to comment"}
          disabled={!authData || isSubmitting}
          className="min-h-24 mb-2"
        />
        <Button 
          type="submit" 
          disabled={!authData || isSubmitting || !newComment.trim()}
          className="w-full sm:w-auto"
        >
          {isSubmitting ? "Posting..." : "Post Comment"}
        </Button>
        {!authData && (
          <p className="text-sm text-muted-foreground mt-2">
            You need to sign in to post comments.
          </p>
        )}
      </form>
      
      {/* Comments list */}
      {comments && comments.length > 0 ? (
        <div className="space-y-4">
          {comments.map((comment: Comment) => (
            <div 
              key={comment.id} 
              className="p-4 border border-border rounded-lg bg-card"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">{comment.user_name || "Anonymous User"}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatTimeAgo(comment.created_at)}
                  </p>
                </div>
                {authData && authData.id === comment.user_id && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteComment(comment.id)}
                    title="Delete comment"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
              <p className="mt-2 whitespace-pre-wrap">{comment.content}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6 text-muted-foreground">
          No comments yet. Be the first to share your thoughts!
        </div>
      )}
    </div>
  );
};

export default CommentSection;
