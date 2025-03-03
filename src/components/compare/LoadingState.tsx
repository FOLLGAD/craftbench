
import { Loader2 } from "lucide-react";
import { useState, useEffect } from "react";

const LoadingState = () => {
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsElapsed(prev => prev + 1);
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="bg-card rounded-lg shadow-lg border border-border p-12 text-center">
      <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
      <h3 className="text-xl font-medium text-card-foreground mb-2">
        Generating your voxel scenes... ({secondsElapsed}s)
      </h3>
      <p className="text-muted-foreground">This may take a few moments</p>
    </div>
  );
};

export default LoadingState;
