
import { ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="border-t border-gray-200 bg-white py-6 mt-12">
      <div className="container mx-auto flex justify-center items-center px-4">
        <p className="text-sm text-gray-500 flex items-center gap-1">
          Benchcraft by{" "}
          <a 
            href="https://x.com/emilahlback" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-500 hover:text-blue-600 transition-colors inline-flex items-center gap-0.5"
          >
            @emilahlback
            <ExternalLink className="h-3 w-3" />
          </a>{" "}
          @{" "}
          <a 
            href="https://lovable.dev" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-purple-500 hover:text-purple-600 transition-colors"
          >
            lovable.dev
          </a>
        </p>
      </div>
    </footer>
  );
};

export default Footer;
