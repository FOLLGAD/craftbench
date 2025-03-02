import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useGenerate = () => {
	const generateCode = async (prompt: string) => {
		if (!prompt) {
			toast.error("Please enter a prompt");
			return;
		}

		try {
			// Use supabase's functions.invoke instead of fetch for better error handling
			const { data, error: functionError } = await supabase.functions.invoke(
				"compare-models",
				{
					body: { prompt },
				},
			);

			if (functionError) {
				throw new Error(functionError.message || "Failed to generate code");
			}

			if (!data) {
				throw new Error("Invalid response from server");
			}

			console.log("Received data:", data);

			// If there's no comparison in the response, we can't proceed properly
			if (!data.comparison) {
				throw new Error(
					"No comparison ID received from server. Please try again.",
				);
			}

			return data.comparison;
		} catch (error) {
			console.error("Generation error:", error);
			const errorMessage =
				error instanceof Error ? error.message : "An error occurred";
			toast.error(errorMessage);
			return null;
		}
	};

	return { generate: generateCode };
};
