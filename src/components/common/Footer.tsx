
import { ExternalLink } from "lucide-react";

const Footer = () => {
  return (
    <footer className="border-t border-border bg-card py-6 mt-4">
      <div className="container mx-auto flex justify-center items-center px-4">
        <p className="text-base md:text-lg text-muted-foreground flex items-center gap-1">
          <span className="">Benchcraft</span> by{" "}
          <a 
            href="https://x.com/emilahlback" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-primary hover:opacity-80 transition-colors inline-flex items-center gap-0.5"
          >
            @emilahlback
          </a>{" "}
          @{" "}
          <a 
            href="https://lovable.dev" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-primary hover:opacity-80 transition-colors"
          >
            lovable.dev
          </a>
        </p>
      </div>
    </footer>
  );
};

export default Footer;
