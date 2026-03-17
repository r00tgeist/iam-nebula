import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { ShieldX } from "lucide-react";
import Navbar from "@/components/Navbar";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="page-enter flex min-h-screen flex-col">
      <Navbar />
      <div className="flex flex-1 flex-col items-center justify-center px-4">
        <div className="relative flex flex-col items-center text-center">
          {/* Decorative background icon */}
          <ShieldX
            size={80}
            className="absolute -top-4 text-muted-foreground/[0.06]"
            strokeWidth={1}
          />

          <h1 className="font-display text-7xl font-extrabold text-gradient-primary sm:text-8xl relative z-10">
            404
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            This concept doesn't exist yet.
          </p>
          <Link
            to="/"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-shadow hover:shadow-[0_0_30px_rgba(0,229,255,0.15)]"
          >
            ← Back to Gallery
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
