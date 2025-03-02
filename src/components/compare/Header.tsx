import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
const Header = () => {
  const navigate = useNavigate();
  return <header className="text-white p-4 shadow-md z-10 flex items-center justify-between bg-green-800">
      <h1 className="text-2xl font-bold">McLovin ❤️</h1>
      <div className="flex items-center gap-4">
        <p className="text-sm text-gray-300 hidden md:block">Compare AI voxel generators</p>
        <Button variant="outline" className="bg-transparent text-white border-white hover:bg-white/10" onClick={() => navigate("/playground")}>
          Voxel Playground
        </Button>
      </div>
    </header>;
};
export default Header;