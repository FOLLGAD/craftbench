
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Header = () => {
	const navigate = useNavigate();
	return (
		<header className="bg-white shadow-sm border-b border-gray-200 py-4 px-6">
			<div className="container mx-auto flex items-center justify-between">
				<div className="flex items-center">
					<h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">
						McLovin ❤️
					</h1>
					<span className="hidden md:inline-block text-sm text-gray-500 ml-4">
						Compare AI voxel generators
					</span>
				</div>
				<div className="flex items-center gap-4">
					<Button
						variant="outline"
						className="text-sm"
						onClick={() => navigate("/vote")}
					>
						View All Comparisons
					</Button>
				</div>
			</div>
		</header>
	);
};

export default Header;
