
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/compare/Header";
import Footer from "@/components/common/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

const MyGenerations = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const { data: generations, isLoading, error } = useQuery({
    queryKey: ['my-generations', page],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      
      if (!userData.user) {
        throw new Error("User must be logged in");
      }

      // Get comparisons where the user created them
      const { data: comparisons, error: comparisonsError, count } = await supabase
        .from("mc-comparisons")
        .select(`
          *,
          generation_a:mc-generations!generation_a_id(*),
          generation_b:mc-generations!generation_b_id(*)
        `, { count: 'exact' })
        .eq("user_id", userData.user.id)
        .order('created_at', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1);

      if (comparisonsError) {
        throw new Error(comparisonsError.message);
      }

      return { data: comparisons || [], count: count || 0 };
    },
  });

  const totalPages = generations ? Math.ceil(generations.count / pageSize) : 0;

  const handleViewComparison = (comparisonId: string) => {
    navigate(`/compare/${comparisonId}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading your generations...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8">
          <div className="text-center py-8">
            <p className="text-red-400">Error loading generations: {error.message}</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">My Generations</h1>
          
          {generations?.data.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground mb-4">You haven't created any generations yet.</p>
                <Button onClick={() => navigate("/")}>
                  Create Your First Generation
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {generations?.data.map((comparison) => (
                <Card key={comparison.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="truncate">{comparison.prompt}</span>
                      <Badge variant="outline">
                        {new Date(comparison.created_at).toLocaleDateString()}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      <div className="space-y-2">
                        <h4 className="font-medium">Model A: {comparison.generation_a?.model_name}</h4>
                        <div className="bg-slate-800 p-3 rounded text-sm text-slate-300 max-h-32 overflow-hidden">
                          {comparison.generation_a?.generated_code.substring(0, 200)}
                          {comparison.generation_a?.generated_code.length > 200 && "..."}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-medium">Model B: {comparison.generation_b?.model_name}</h4>
                        <div className="bg-slate-800 p-3 rounded text-sm text-slate-300 max-h-32 overflow-hidden">
                          {comparison.generation_b?.generated_code.substring(0, 200)}
                          {comparison.generation_b?.generated_code.length > 200 && "..."}
                        </div>
                      </div>
                    </div>
                    <Button 
                      onClick={() => handleViewComparison(comparison.id)}
                      className="w-full"
                    >
                      View Full Comparison
                    </Button>
                  </CardContent>
                </Card>
              ))}

              {totalPages > 1 && (
                <Pagination className="mt-8">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => setPage(Math.max(1, page - 1))}
                        className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                    
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pageNum = i + 1;
                      return (
                        <PaginationItem key={pageNum}>
                          <PaginationLink
                            onClick={() => setPage(pageNum)}
                            isActive={page === pageNum}
                            className="cursor-pointer"
                          >
                            {pageNum}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    })}
                    
                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => setPage(Math.min(totalPages, page + 1))}
                        className={page === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default MyGenerations;
