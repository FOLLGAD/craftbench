import { Link, useNavigate } from "react-router-dom";
import { Button } from "../ui/button";

const Header = () => {
	const navigate = useNavigate();
	return (
		<header className="bg-white shadow-sm border-b border-gray-200 py-4 px-6">
			<div className="container mx-auto flex items-center justify-between">
				<div className="flex items-center">
					<Link to="/">
						<h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">
							McLovin ❤️
						</h1>
					</Link>
					<span className="hidden md:inline-block text-sm text-gray-500 ml-4">
						Best AI benchmark
					</span>
				</div>

				<Button variant="outline" onClick={() => navigate("/leaderboard")}>
					Leaderboard
				</Button>
			</div>
		</header>
	);
};

export default Header;
