
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useGenerate = () => {
	const generateCode = async (prompt: string) => {
		if (!prompt) {
			toast.error("Please enter a prompt");
			return;
		}

		try {
			const startTime = performance.now();
			console.log(`Generation started at ${new Date().toISOString()}`);
			
			// Use supabase's functions.invoke instead of fetch for better error handling
			const { data, error: functionError } = await supabase.functions.invoke(
				"compare-models",
				{
					body: { prompt },
				},
			);

			const endTime = performance.now();
			const elapsedSeconds = ((endTime - startTime) / 1000).toFixed(2);
			console.log(`Generation completed in ${elapsedSeconds}s`);

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
