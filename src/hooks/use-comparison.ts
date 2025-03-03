
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Comparison } from "@/types/comparison";

export const useComparison = (id: string) => {
  const [loading, setLoading] = useState(true);
  const [comparison, setComparison] = useState<Comparison | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchComparison = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("mc-comparisons")
          .select(`
            id,
            prompt,
            generation_a_id,
            generation_b_id,
            created_at,
            generation_a:mc-generations!generation_a_id(*),
            generation_b:mc-generations!generation_b_id(*)
          `)
          .eq("id", id)
          .single();

        if (error) throw new Error(error.message);
        if (!data) throw new Error("Comparison not found");

        setComparison(data as unknown as Comparison);
      } catch (err) {
        console.error("Error fetching comparison:", err);
        const message = err instanceof Error ? err.message : "Failed to fetch comparison";
        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    fetchComparison();
  }, [id]);

  return { comparison, loading, error };
};
