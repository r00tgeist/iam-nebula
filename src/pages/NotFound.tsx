import { useNavigate } from "react-router-dom";
import { ShieldX, ArrowLeft } from "lucide-react";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 page-enter">
      {/* Background icon */}
      <div className="relative">
        <ShieldX
          size={120}
          className="text-muted-foreground/[0.04] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          strokeWidth={1}
        />
        <h1 className="font-display text-8xl sm:text-9xl font-extrabold text-gradient-primary relative z-10">
          404
        </h1>
      </div>

      <p className="mt-4 text-lg text-muted-foreground text-center">
        This concept doesn't exist yet.
      </p>
      <p className="mt-1 text-sm text-muted-foreground/50 text-center">
        Or maybe it's just waiting to be discovered.
      </p>

      <button
        onClick={() => navigate("/")}
        className="mt-8 flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-6 py-2.5 text-sm font-semibold text-primary hover:bg-primary/15 transition-colors"
      >
        <ArrowLeft size={14} />
        Back to Gallery
      </button>
    </div>
  );
};

export default NotFound;
