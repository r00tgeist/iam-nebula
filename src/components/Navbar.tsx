import { Link } from "react-router-dom";
import { Github } from "lucide-react";

const Navbar = () => (
  <nav className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-[rgba(255,255,255,0.04)] bg-background/95 px-4 sm:px-6">
    <Link to="/" className="font-display text-sm font-bold text-gradient-primary">
      IAM Decoded
    </Link>
    <a
      href="https://github.com/rootgeist"
      target="_blank"
      rel="noopener noreferrer"
      className="text-muted-foreground transition-colors hover:text-foreground"
    >
      <Github size={18} />
    </a>
  </nav>
);

export default Navbar;
