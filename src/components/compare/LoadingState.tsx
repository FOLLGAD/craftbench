
import { Loader2 } from "lucide-react";

const LoadingState = () => {
  return (
    <div className="bg-card rounded-lg shadow-lg border border-border p-12 text-center">
      <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
      <h3 className="text-xl font-medium text-foreground mb-2">Generating your voxel scenes...</h3>
      <p className="text-muted-foreground">This may take a few moments</p>
    </div>
  );
};

export default LoadingState;
