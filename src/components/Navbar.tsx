import { KeyRound, Github } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === "/";

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-[rgba(255,255,255,0.04)] bg-background/95">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        {/* Brand */}
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2.5 group"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
            <KeyRound size={14} />
          </div>
          <span className="font-display text-sm font-bold text-gradient-primary">
            IAM Decoded
          </span>
        </button>

        {/* Right side */}
        <div className="flex items-center gap-1">
          <a
            href="https://github.com/rootgeist"
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground/50 hover:text-foreground hover:bg-[rgba(255,255,255,0.04)] transition-all"
            aria-label="GitHub"
          >
            <Github size={16} />
          </a>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
