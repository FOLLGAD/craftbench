import posthog from "posthog-js";
import { useEffect } from "react";

const PostHogProvider = ({ children }: { children: React.ReactNode }) => {
	useEffect(() => {
		// Initialize PostHog with your specific key and host
		posthog.init("phc_FTO98o8i8IpbVwq7yfTBlC6dnF6s6vG130q9keHhSwe", {
			api_host: "https://us.i.posthog.com",
		});
	}, []);

	return <>{children}</>;
};

export default PostHogProvider;
