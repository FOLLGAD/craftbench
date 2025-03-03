import { VisibleScreenRenderer } from "@/components/SceneRenderer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useVote } from "@/hooks/use-vote";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistance } from "date-fns";
import { Crown, ShareIcon, ThumbsUp } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { getComparison, getComparisonVotes, getModelRatings, getVote } from "../../lib/models";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Textarea } from "../ui/textarea";
import { Skeleton } from "../ui/skeleton";
import { Link } from "react-router-dom";
interface VoteComparisonProps {
  comparisonId: string;
  isVoting?: boolean;
}
const VoteComparison = ({
  comparisonId,
  isVoting: externalIsVoting = false
}: VoteComparisonProps) => {
  const queryClient = useQueryClient();
  const [isVoting, setIsVoting] = useState(externalIsVoting);
  const {
    handleVote
  } = useVote();
  const {
    data: voteData
  } = useQuery({
    queryKey: ["vote", comparisonId],
    queryFn: async () => {
      const {
        data
      } = await supabase.auth.getUser();
      if (!data?.user?.id) return {
        generationId: null
      };
      return getVote(comparisonId, data.user.id);
    },
    enabled: true
  });
  const myVote = voteData?.generationId;
  const hasVoted = !!myVote;
  const onVote = async (comparisonId: string, generationId: string) => {
    try {
      setIsVoting(true);
      await handleVote(comparisonId, generationId);
      queryClient.invalidateQueries({
        queryKey: ["vote", comparisonId]
      });
      queryClient.invalidateQueries({
        queryKey: ["comparison-votes", comparisonId]
      });
      toast.success("Vote submitted");
    } catch (error) {
      console.error("Error voting:", error);
      toast.error("Failed to submit vote");
    } finally {
      setIsVoting(false);
    }
  };

  // Format the model name to be more readable
  const formatModelName = (modelName: string) => {
    return modelName;
  };
  const comparison = useQuery({
    queryKey: ["comparison", comparisonId],
    queryFn: () => getComparison(comparisonId)
  });
  const comparisonVotes = useQuery({
    queryKey: ["comparison-votes", comparisonId],
    queryFn: () => getComparisonVotes(comparisonId)
  });
  const generations = useMemo(() => [comparison.data?.generation_a, comparison.data?.generation_b].filter(Boolean).sort(() => Math.random() - 0.5), [comparison.data]);
  const modelNames = generations.map(gen => gen.model_name);
  const modelRatings = useQuery({
    queryKey: ["model-ratings", ...modelNames],
    queryFn: () => getModelRatings(modelNames),
    enabled: !!modelNames.length && !!myVote
  });
  const totalVotes = Object.values(comparisonVotes.data || {}).reduce((sum, count) => sum + count, 0);
  const getVotePercentage = (genId: string) => {
    const voteCount = comparisonVotes.data?.[genId] || 0;
    if (totalVotes === 0) return 0;
    return Math.round(voteCount / totalVotes * 100);
  };
  const adminCode = localStorage.getItem("admin_code") === "true";
  const winner: string | "tie" | null = useMemo(() => {
    const genAid = generations[0]?.id;
    const genBid = generations[1]?.id;
    if (!genAid || !genBid) return null;
    const aVotes = comparisonVotes.data?.[genAid] || 0;
    const bVotes = comparisonVotes.data?.[genBid] || 0;
    if (aVotes === bVotes) return "tie";
    return aVotes > bVotes ? genAid : genBid;
  }, [comparisonVotes.data, generations]);

  // Format the timestamp to show "x time ago"
  const formatTimeAgo = (timestamp: string | null | undefined) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return formatDistance(date, new Date(), {
      addSuffix: true
    });
  };

  // Get full formatted date for title attribute
  const formatFullDate = (timestamp: string | null | undefined) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return date.toLocaleString();
  };
  return (
    <div className="mb-8 shadow-lg rounded-lg p-4 border border-border bg-card">
      {comparison.data ? (
        <>
          <div className="py-0 text-center flex items-center justify-center">
            <p className="text-card-foreground text-2xl font-semibold">
              <Link to={`/compare/${comparison.data.id}/${encodeURIComponent(comparison.data.prompt.replace(/ /g, "-"))}`} className="hover:underline text-white">
                "{comparison.data?.prompt.trim()}"
              </Link>
            </p>
            <ShareIcon 
              className="w-4 h-4 ml-2 inline-block cursor-pointer text-muted-foreground hover:text-card-foreground hover:underline" 
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/compare/${comparison.data.id}/${encodeURIComponent(comparison.data.prompt.replace(/ /g, "-"))}`);
                toast.success("Copied to clipboard");
              }} 
            />
          </div>

          {/* Timestamp display */}
          <div className="text-center mb-3">
            <span className="text-sm text-muted-foreground" title={formatFullDate(comparison.data.created_at)}>
              {formatTimeAgo(comparison.data.created_at)}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {generations.map((generation, index) => (
              <div 
                key={generation.id} 
                className={`border rounded-lg p-4 ${
                  hasVoted && myVote === generation.id 
                    ? "border-primary/50" 
                    : "border-border"
                }`}
              >
                <div className="flex flex-col justify-between items-center mb-4 w-full">
                  <div className="w-full flex items-center gap-2 justify-between">
                    <h3 className="truncate text-lg font-semibold text-card-foreground">
                      {hasVoted ? formatModelName(generation.model_name) : `Model ${index + 1}`}
                    </h3>

                    {winner === generation.id && myVote && 
                      <Crown className="h-5 w-5 text-yellow-500" />
                    }

                    {winner === "tie" && myVote && <Badge variant="secondary">Tie</Badge>}

                    {!!adminCode && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline">Code</Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Code</DialogTitle>
                          </DialogHeader>
                          <DialogDescription>
                            <Textarea className="w-full resize-none" value={generation.generated_code} readOnly />
                          </DialogDescription>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                  
                  {hasVoted && modelRatings.data?.[generation.model_name] && (
                    <div className="flex items-center gap-2 justify-between w-full min-h-[24px]">
                      <p className="text-sm text-muted-foreground">
                        Elo: {modelRatings.data[generation.model_name]}
                      </p>

                      <Badge variant={comparisonVotes.data?.[generation.id] > 0 ? "default" : "outline"} className="flex-shrink-0">
                        {getVotePercentage(generation.id)}% (
                        {comparisonVotes.data?.[generation.id] || 0} votes)
                      </Badge>
                    </div>
                  )}
                </div>

                <div className="bg-gray-900 rounded-md mb-6 overflow-hidden">
                  <VisibleScreenRenderer code={generation.generated_code} generationId={generation.id} />
                </div>

                <Button 
                  onClick={() => onVote(comparisonId, generation.id)} 
                  disabled={hasVoted || isVoting} 
                  variant={myVote === generation.id ? "default" : "outline"} 
                  className={`w-full ${myVote === generation.id ? "bg-primary hover:bg-primary/90" : ""}`}
                >
                  {isVoting ? "Voting..." : myVote === generation.id ? (
                    <>
                      <ThumbsUp className="mr-2 h-5 w-5" /> Voted!
                    </>
                  ) : "Vote for this generation"}
                </Button>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="flex flex-col gap-4">
          <Skeleton className="w-96 h-12 rounded-md mx-auto" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Skeleton className="w-full h-8 rounded-md" />
              <Skeleton className="w-full h-[300px] rounded-md" />
            </div>

            <div className="flex flex-col gap-2">
              <Skeleton className="w-full h-8 rounded-md" />
              <Skeleton className="w-full h-[300px] rounded-md" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoteComparison;
