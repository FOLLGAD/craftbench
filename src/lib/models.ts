
import { supabase } from "@/integrations/supabase/client";
import type { Comparison } from "@/types/comparison";

export const getComparison = async (comparisonId: string) => {
  const { data, error } = await supabase
    .from("mc-comparisons")
    .select(`
      *,
      generation_a:mc_generations!generation_a_id(*),
      generation_b:mc_generations!generation_b_id(*)
    `)
    .eq("id", comparisonId)
    .single();
  if (error) {
    throw new Error(error.message);
  }
  return data;
};

export const getModelRatings = async (modelNames: string[]) => {
  if (!modelNames.length) return {};

  const { data, error } = await supabase
    .from("mc-models")
    .select("model_name, elo")
    .in("model_name", modelNames);

  if (error) {
    throw new Error(error.message);
  }

  return data.reduce<Record<string, number>>((acc, model) => {
    acc[model.model_name] = model.elo;
    return acc;
  }, {});
};

export const getComparisonVotes = async (comparisonId: string) => {
  const { data, error } = await supabase
    .from("mc-votes")
    .select("generation_id")
    .eq("comparison_id", comparisonId);
  if (error) {
    throw new Error(error.message);
  }
  const votes = data.reduce((acc, vote) => {
    acc[vote.generation_id] = (acc[vote.generation_id] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  return votes;
};

export const getVote = async (comparisonId: string, userId: string) => {
  const { data, error } = await supabase
    .from("mc-votes")
    .select("generation_id")
    .eq("comparison_id", comparisonId)
    .eq("user_id", userId);
  if (error) {
    throw new Error(error.message);
  }
  return {
    generationId: data[0]?.generation_id,
  };
};

export const getAllModelStats = async () => {
  // Get all models with their Elo ratings
  const { data: models, error: modelsError } = await supabase
    .from("mc-models")
    .select("model_name, elo")
    .order("elo", { ascending: false });

  if (modelsError) {
    throw new Error(modelsError.message);
  }

  // Get all generations to map generation_id to model_name
  const { data: generations, error: generationsError } = await supabase
    .from("mc-generations")
    .select("id, model_name");

  if (generationsError) {
    throw new Error(generationsError.message);
  }

  // Create a map of generation_id to model_name
  const generationToModel: Record<string, string> = {};
  for (const gen of generations) {
    generationToModel[gen.id] = gen.model_name;
  }

  // Get all comparisons
  const { data: comparisons, error: comparisonsError } = await supabase
    .from("mc-comparisons")
    .select("id, generation_a_id, generation_b_id");

  if (comparisonsError) {
    throw new Error(comparisonsError.message);
  }

  // Get all votes with comparison_id to determine which model won each comparison
  const { data: votes, error: votesError } = await supabase
    .from("mc-votes")
    .select("comparison_id, generation_id");

  if (votesError) {
    throw new Error(votesError.message);
  }

  // Group votes by comparison_id
  const votesByComparison: Record<string, Record<string, number>> = {};
  for (const vote of votes) {
    if (!votesByComparison[vote.comparison_id]) {
      votesByComparison[vote.comparison_id] = {};
    }
    votesByComparison[vote.comparison_id][vote.generation_id] =
      (votesByComparison[vote.comparison_id][vote.generation_id] || 0) + 1;
  }

  // Count wins per model (a win is when a model's generation gets more votes in a comparison)
  const modelWins: Record<string, number> = {};
  for (const comparison of comparisons) {
    const comparisonVotes = votesByComparison[comparison.id] || {};
    const votesForA = comparisonVotes[comparison.generation_a_id] || 0;
    const votesForB = comparisonVotes[comparison.generation_b_id] || 0;

    // Skip comparisons with no votes or ties
    if (votesForA === 0 && votesForB === 0) continue;
    if (votesForA === votesForB) continue;

    // Determine the winning generation and model
    const winningGenId =
      votesForA > votesForB
        ? comparison.generation_a_id
        : comparison.generation_b_id;
    const winningModel = generationToModel[winningGenId];

    if (winningModel) {
      modelWins[winningModel] = (modelWins[winningModel] || 0) + 1;
    }
  }

  // Calculate total matches per model
  const modelMatches: Record<string, number> = {};
  for (const comparison of comparisons) {
    const modelA = generationToModel[comparison.generation_a_id];
    const modelB = generationToModel[comparison.generation_b_id];

    if (modelA) {
      modelMatches[modelA] = (modelMatches[modelA] || 0) + 1;
    }

    if (modelB) {
      modelMatches[modelB] = (modelMatches[modelB] || 0) + 1;
    }
  }

  // Combine all stats
  const modelStats = models.map((model) => {
    const wins = modelWins[model.model_name] || 0;
    const matches = modelMatches[model.model_name] || 0;
    const losses = matches - wins;
    const winRate = matches > 0 ? (wins / matches) * 100 : 0;

    return {
      modelName: model.model_name,
      elo: model.elo,
      wins,
      losses,
      matches,
      winRate: Math.round(winRate * 10) / 10, // Round to 1 decimal place
    };
  });

  return modelStats;
};

export const getModelComparisons = async (modelName: string, page = 1, pageSize = 5) => {
  // First, get generation IDs for the specified model
  const { data: generations, error: generationsError } = await supabase
    .from("mc-generations")
    .select("id")
    .eq("model_name", modelName);

  if (generationsError) {
    throw new Error(generationsError.message);
  }

  if (!generations.length) {
    return { data: [], count: 0 };
  }

  const generationIds = generations.map(gen => gen.id);

  // Get comparisons where this model was either generation_a or generation_b
  const { data: comparisons, error: comparisonsError, count } = await supabase
    .from("mc-comparisons")
    .select(`
      *,
      generation_a:mc_generations!generation_a_id(*),
      generation_b:mc_generations!generation_b_id(*)
    `, { count: 'exact' })
    .or(`generation_a_id.in.(${generationIds.join(',')}),generation_b_id.in.(${generationIds.join(',')})`)
    .order('created_at', { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (comparisonsError) {
    throw new Error(comparisonsError.message);
  }

  return { data: comparisons, count: count || 0 };
};

export interface Comment {
  id: string;
  comparison_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user_name?: string; // Will be populated when fetching comments
}

export const getComparisonComments = async (comparisonId: string) => {
  const { data, error } = await supabase
    .from("mc-comments")
    .select("*")
    .eq("comparison_id", comparisonId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  // Fetch user information for all comments
  const userIds = data.map(comment => comment.user_id);
  const uniqueUserIds = [...new Set(userIds)];

  if (uniqueUserIds.length > 0) {
    const { data: userData, error: userError } = await supabase
      .from("user")
      .select("user_id, name")
      .in("user_id", uniqueUserIds);

    if (!userError && userData) {
      // Create a map of user_id to name
      const userMap = userData.reduce((acc, user) => {
        acc[user.user_id] = user.name || "Anonymous User";
        return acc;
      }, {} as Record<string, string>);

      // Add user_name to each comment
      return data.map(comment => ({
        ...comment,
        user_name: userMap[comment.user_id] || "Anonymous User"
      }));
    }
  }

  return data;
};

export const addComment = async (comparisonId: string, content: string) => {
  const { data: userData } = await supabase.auth.getUser();
  
  if (!userData.user) {
    throw new Error("User must be logged in to comment");
  }
  
  const { data, error } = await supabase
    .from("mc-comments")
    .insert({
      comparison_id: comparisonId,
      content
    })
    .select();

  if (error) {
    throw new Error(error.message);
  }

  return data[0];
};

export const deleteComment = async (commentId: string) => {
  const { data: userData } = await supabase.auth.getUser();
  
  if (!userData.user) {
    throw new Error("User must be logged in to delete a comment");
  }
  
  const { error } = await supabase
    .from("mc-comments")
    .delete()
    .eq("id", commentId)
    .eq("user_id", userData.user.id);

  if (error) {
    throw new Error(error.message);
  }

  return true;
};
