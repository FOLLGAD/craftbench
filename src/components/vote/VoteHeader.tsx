
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

const VoteHeader = () => {
  return (
    <div className="flex justify-between items-center mb-8">
      <h1 className="text-3xl font-bold">Model Comparisons</h1>
      <div className="flex gap-2">
        <Button variant="outline" asChild>
          <Link to="/">
            <Home className="mr-2 h-4 w-4" /> Back to Compare
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default VoteHeader;
