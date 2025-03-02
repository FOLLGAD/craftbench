import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Auth } from "./components/Auth";
import Compare from "./pages/Compare";
import NotFound from "./pages/NotFound";
import Playground from "./pages/Playground";
import Vote from "./pages/Vote";
import { Toaster } from "sonner";

const queryClient = new QueryClient();

const App = () => (
	<QueryClientProvider client={queryClient}>
		<TooltipProvider>
			<Toaster />
			<Auth />
			<Sonner />
			<BrowserRouter>
				<Routes>
					<Route path="/" element={<Compare />} />
					<Route path="/playground" element={<Playground />} />
					<Route path="/vote" element={<Vote />} />
					{/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
					<Route path="*" element={<NotFound />} />
				</Routes>
			</BrowserRouter>
		</TooltipProvider>
	</QueryClientProvider>
);

export default App;
