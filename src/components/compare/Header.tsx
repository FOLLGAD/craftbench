
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../ui/button";
import { Trophy } from "lucide-react";
import { ThemeToggle } from "../theme-toggle";
const Header = () => {
  const navigate = useNavigate();
  return <header className="bg-card border-b border-border py-4 px-[17px] font-light">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Link to="/">
            <h1 className="text-2xl font-thin text-white">Benchcraft</h1>
          </Link>
          <span className="hidden md:inline-block text-sm text-muted-foreground ml-4">
            Best AI benchmark – compare LLMs on spatiovisual tasks
          </span>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button variant="default" onClick={() => navigate("/leaderboard")}>
            <Trophy className="mr-2 h-4 w-4" />
            Leaderboard
          </Button>
        </div>
      </div>
    </header>;
};
export default Header;
