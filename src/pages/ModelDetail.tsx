
import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import Header from "@/components/compare/Header";
import Footer from "@/components/common/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { useQuery } from "@tanstack/react-query";
import { getModelComparisons } from "@/lib/models";
import { formatDistance } from "date-fns";

const PAGE_SIZE = 10;

const ModelDetail = () => {
  const [searchParams] = useSearchParams();
  const modelName = searchParams.get("model_name") || "";
  const [page, setPage] = useState(1);

  useEffect(() => {
    // Reset to page 1 when model changes
    setPage(1);
  }, [modelName]);

  const {
    data: comparisonData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["model-comparisons", modelName, page],
    queryFn: () => getModelComparisons(modelName, page, PAGE_SIZE),
    enabled: !!modelName,
  });

  const comparisons = comparisonData?.data || [];
  const totalComparisons = comparisonData?.count || 0;
  const totalPages = Math.max(1, Math.ceil(totalComparisons / PAGE_SIZE));

  if (!modelName) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col">
        <Header />
        <div className="container mx-auto py-10 flex-grow">
          <h1 className="text-3xl font-bold mb-6">Model Not Found</h1>
          <p>No model name was specified. Please select a model from the leaderboard.</p>
          <Button className="mt-4" asChild>
            <Link to="/leaderboard">Return to Leaderboard</Link>
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col">
        <Header />
        <div className="container mx-auto py-10 flex-grow">
          <h1 className="text-3xl font-bold mb-6">Model: {modelName}</h1>
          <p>Loading comparisons...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col">
        <Header />
        <div className="container mx-auto py-10 flex-grow">
          <h1 className="text-3xl font-bold mb-6">Model: {modelName}</h1>
          <p className="text-red-500">Error loading comparisons: {(error as Error).message}</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <Header />
      <div className="container mx-auto py-10 flex-grow">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Model: {modelName}</h1>
          <Button asChild variant="outline">
            <Link to="/leaderboard">Back to Leaderboard</Link>
          </Button>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Comparisons</CardTitle>
            <CardDescription>
              Showing {comparisons.length} of {totalComparisons} comparisons where {modelName} participated
            </CardDescription>
          </CardHeader>
          <CardContent>
            {comparisons.length === 0 ? (
              <p>No comparisons found for this model.</p>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Prompt</TableHead>
                      <TableHead>Model A</TableHead>
                      <TableHead>Model B</TableHead>
                      <TableHead>View</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {comparisons.map((comparison) => {
                      const modelA = comparison.generation_a?.model_name;
                      const modelB = comparison.generation_b?.model_name;
                      const isModelA = modelA === modelName;
                      const isModelB = modelB === modelName;
                      
                      return (
                        <TableRow key={comparison.id}>
                          <TableCell>
                            {formatDistance(new Date(comparison.created_at), new Date(), {
                              addSuffix: true,
                            })}
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            {comparison.prompt}
                          </TableCell>
                          <TableCell className={isModelA ? "font-bold text-primary" : ""}>
                            {modelA}
                          </TableCell>
                          <TableCell className={isModelB ? "font-bold text-primary" : ""}>
                            {modelB}
                          </TableCell>
                          <TableCell>
                            <Button size="sm" asChild>
                              <Link to={`/compare/${comparison.id}`}>View</Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
                
                {totalPages > 1 && (
                  <div className="mt-4">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious 
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            className={page <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          />
                        </PaginationItem>
                        
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          // Show pages around current page
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (page <= 3) {
                            pageNum = i + 1;
                          } else if (page >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = page - 2 + i;
                          }
                          
                          return (
                            <PaginationItem key={pageNum}>
                              <PaginationLink
                                onClick={() => setPage(pageNum)}
                                isActive={pageNum === page}
                              >
                                {pageNum}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        })}
                        
                        <PaginationItem>
                          <PaginationNext 
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            className={page >= totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
};

export default ModelDetail;
