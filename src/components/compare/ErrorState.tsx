
import { Button } from "@/components/ui/button";

interface ErrorStateProps {
  error: string;
  onReset: () => void;
}

const ErrorState = ({ error, onReset }: ErrorStateProps) => {
  return (
    <div className="bg-card rounded-lg shadow-lg border border-destructive/20 p-6">
      <h3 className="text-xl font-medium text-destructive mb-4">Error</h3>
      <p className="text-card-foreground mb-4">{error}</p>
      <Button onClick={onReset} variant="outline" className="mr-2">
        Try Again
      </Button>
    </div>
  );
};

export default ErrorState;
