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

export const getAllModelStats = async () => {
	// Get all models with their Elo ratings
	const { data: models, error: modelsError } = await supabase
		.from("mc-models")
		.select("model_name, elo")
		.order("elo", { ascending: false });

	if (modelsError) {
		throw new Error(modelsError.message);
	}

	// Get all votes to calculate wins and losses
	const { data: votes, error: votesError } = await supabase
		.from("mc-votes")
		.select("generation_id")
		.returns<{ generation_id: string }[]>();

	if (votesError) {
		throw new Error(votesError.message);
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

	// Count votes per model (wins)
	const modelWins: Record<string, number> = {};
	for (const vote of votes) {
		const modelName = generationToModel[vote.generation_id];
		if (modelName) {
			modelWins[modelName] = (modelWins[modelName] || 0) + 1;
		}
	}

	// Get all comparisons to calculate total matches and losses
	const { data: comparisons, error: comparisonsError } = await supabase
		.from("mc-comparisons")
		.select("generation_a_id, generation_b_id");

	if (comparisonsError) {
		throw new Error(comparisonsError.message);
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
