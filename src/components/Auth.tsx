import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";
import { toast } from "sonner";

export const Auth = () => {
	// Perform anonymous sign-in when the component loads
	useEffect(() => {
		const signInAnonymously = async () => {
			const { data: sessionData } = await supabase.auth.getSession();

			if (!sessionData.session) {
				try {
					const { data, error } = await supabase.auth.signInAnonymously();

					if (error) {
						console.error("Anonymous sign-in error:", error.message);
						toast.error(
							"Failed to create anonymous session. Some features may not work.",
							{
								description: error.message,
							},
						);
					} else {
						console.log(
							"Anonymous sign-in successful. User ID:",
							data.user?.id,
						);
						console.log("Session:", data.session);
					}
				} catch (e) {
					console.error("Unexpected error during anonymous sign-in:", e);
				}
			}
			// Log current user regardless of path
			const { data: currentUser } = await supabase.auth.getUser();
			console.log("Current authenticated user ID:", currentUser.user?.id);
		};

		signInAnonymously();
	}, []);

	return null;
};
