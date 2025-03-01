
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Header = () => {
  const navigate = useNavigate();
  
  return (
    <header className="bg-black text-white p-4 shadow-md z-10 flex items-center justify-between">
      <h1 className="text-2xl font-bold">Voxel Sculptor</h1>
      <div className="flex items-center gap-4">
        <p className="text-sm text-gray-300 hidden md:block">Build your blocky world with AI</p>
        <Button 
          variant="outline" 
          className="bg-transparent text-white border-white hover:bg-white/10"
          onClick={() => navigate("/")}
        >
          Back to Editor
        </Button>
      </div>
    </header>
  );
};

export default Header;
