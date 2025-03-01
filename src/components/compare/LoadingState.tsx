
import { Loader2 } from "lucide-react";

const LoadingState = () => {
  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-12 text-center">
      <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-purple-600" />
      <h3 className="text-xl font-medium text-gray-700 mb-2">Generating your voxel scenes...</h3>
      <p className="text-gray-500">This may take a few moments</p>
    </div>
  );
};

export default LoadingState;
