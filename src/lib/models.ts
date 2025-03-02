import { supabase } from "@/integrations/supabase/client";
import type { Comparison } from "@/types/comparison";

export const getComparison = async (comparisonId: string) => {
	const { data, error } = await supabase
		.from("mc-comparisons")
		.select(`*,
      generation_a:"mc-generations"!generation_a_id(*),
      generation_b:"mc-generations"!generation_b_id(*)
    `)
		.eq("id", comparisonId);
	if (error) {
		throw new Error(error.message);
	}
	return data[0];
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

	return data.reduce(
		(acc, model) => {
			acc[model.model_name] = model.elo;
			return acc;
		},
		{} as Record<string, number>,
	);
};
export const getComparisonVotes = async (comparisonId: string) => {
	const { data, error } = await supabase
		.from("mc-votes")
		.select("generation_id")
		.eq("comparison_id", comparisonId);
	if (error) {
		throw new Error(error.message);
	}
	const votes = data.reduce(
		(acc, vote) => {
			acc[vote.generation_id] = (acc[vote.generation_id] || 0) + 1;
			return acc;
		},
		{} as Record<string, number>,
	);
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
