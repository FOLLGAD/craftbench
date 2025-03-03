
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ComparisonType } from "@/types/comparison";

export const useComparison = (comparisonId: string) => {
  const [comparison, setComparison] = useState<ComparisonType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!comparisonId) {
      setIsLoading(false);
      return;
    }

    const fetchComparison = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from("comparisons")
          .select("*")
          .eq("id", comparisonId)
          .single();

        if (error) throw error;
        setComparison(data as ComparisonType);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch comparison");
        console.error("Error fetching comparison:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchComparison();
  }, [comparisonId]);

  return { comparison, isLoading, error };
};
