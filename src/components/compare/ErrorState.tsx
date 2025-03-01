
import { Button } from "@/components/ui/button";

interface ErrorStateProps {
  error: string;
  onReset: () => void;
}

const ErrorState = ({ error, onReset }: ErrorStateProps) => {
  return (
    <div className="bg-white rounded-lg shadow-lg border border-red-200 p-6">
      <h3 className="text-xl font-medium text-red-600 mb-4">Error</h3>
      <p className="text-gray-700 mb-4">{error}</p>
      <Button onClick={onReset} variant="outline" className="mr-2">
        Try Again
      </Button>
    </div>
  );
};

export default ErrorState;
