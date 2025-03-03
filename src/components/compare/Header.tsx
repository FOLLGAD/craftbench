import { Link, useNavigate } from "react-router-dom";
import { Button } from "../ui/button";
import { Trophy } from "lucide-react";
const Header = () => {
  const navigate = useNavigate();
  return <header className="bg-white shadow-sm border-b border-gray-200 py-4 px-6">
			<div className="flex items-center justify-between">
				<div className="flex items-center">
					<Link to="/">
						<h1 className="text-2xl font-bold text-green-900">Benchcraft</h1>
					</Link>
					<span className="hidden md:inline-block text-sm text-gray-500 ml-4">Best AI benchmark – compare LLMs on spatiovisual tasks</span>
				</div>

				<Button onClick={() => navigate("/leaderboard")}>
					<Trophy className="mr-2 h-4 w-4" />
					Leaderboard
				</Button>
			</div>
		</header>;
};
export default Header;