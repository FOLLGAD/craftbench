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
