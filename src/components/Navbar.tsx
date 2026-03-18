import { KeyRound } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Navbar = () => {
  const navigate = useNavigate();

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-[rgba(255,255,255,0.03)] bg-background/95">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2.5 group"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/8 text-primary/70 group-hover:bg-primary/12 group-hover:text-primary transition-colors">
            <KeyRound size={14} />
          </div>
          <span className="font-display text-sm font-bold text-gradient-primary">
            IAM Decoded
          </span>
        </button>

        <div />
      </div>
    </nav>
  );
};

export default Navbar;
