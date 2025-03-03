
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";
import { Auth } from "./components/Auth";
import PostHogProvider from "./components/PostHogProvider";
import Compare from "./pages/Compare";
import Home from "./pages/Home";
import Leaderboard from "./pages/Leaderboard";
import ModelDetail from "./pages/ModelDetail";
import NotFound from "./pages/NotFound";
import Playground from "./pages/Playground";
import { ThemeProvider } from "./components/theme-provider";

const queryClient = new QueryClient();

const App = () => (
	<QueryClientProvider client={queryClient}>
		<TooltipProvider>
			<ThemeProvider defaultTheme="dark" forcedMode={true}>
				<Toaster />
				<PostHogProvider>
					<Auth />
					<Sonner />
					<BrowserRouter>
						<Routes>
							<Route path="/" element={<Home />} />
							<Route
								path="/compare/:comparisonId/:prompt?"
								element={<Compare />}
							/>
							<Route path="/leaderboard" element={<Leaderboard />} />
							<Route path="/models" element={<ModelDetail />} />
							<Route path="/playground" element={<Playground />} />
							{/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
							<Route path="*" element={<NotFound />} />
						</Routes>
					</BrowserRouter>
				</PostHogProvider>
			</ThemeProvider>
		</TooltipProvider>
	</QueryClientProvider>
);

export default App;
