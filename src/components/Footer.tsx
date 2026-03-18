import { Send, KeyRound } from "lucide-react";

const LINKS = [
  { label: "All Concepts", href: "/" },
];

const Footer = () => {
  return (
    <footer className="relative z-10 mt-auto border-t border-[rgba(255,255,255,0.04)]">
      {/* Newsletter banner */}
      <div className="border-b border-[rgba(255,255,255,0.04)]">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:py-12">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="font-display text-lg font-bold text-foreground">
                Stay ahead in IAM
              </h3>
              <p className="mt-1 text-sm text-muted-foreground max-w-md">
                Weekly deep-dives on identity security, zero trust patterns, and architecture guides. Free, no spam.
              </p>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const input = e.currentTarget.querySelector("input");
                if (input) {
                  input.value = "";
                  input.placeholder = "Subscribed ✓";
                }
              }}
              className="flex w-full sm:w-auto"
            >
              <input
                type="email"
                required
                placeholder="your@email.com"
                className="h-11 flex-1 sm:w-64 rounded-l-xl border border-[rgba(255,255,255,0.08)] border-r-0 bg-[rgba(0,0,0,0.3)] px-4 text-sm text-foreground placeholder:text-muted-foreground/40 outline-none focus:border-primary/30 transition-colors font-mono"
              />
              <button
                type="submit"
                className="flex h-11 items-center gap-2 rounded-r-xl bg-primary/15 border border-primary/20 px-5 text-sm font-semibold text-primary hover:bg-primary/25 transition-colors"
              >
                <Send size={14} />
                <span className="hidden sm:inline">Subscribe</span>
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Main footer */}
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <KeyRound size={16} />
            </div>
            <div>
              <p className="font-display text-sm font-bold text-gradient-primary">
                IAM Decoded
              </p>
            </div>
          </div>

          {/* Quick links */}
          <div className="flex items-center gap-6">
            {LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="flex items-center gap-1 text-xs text-muted-foreground/60 hover:text-foreground transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>

        {/* Bottom line */}
        <div className="mt-6 pt-5 border-t border-[rgba(255,255,255,0.03)] flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-[10px] text-muted-foreground/30 font-mono">
            © {new Date().getFullYear()} IAM Decoded. All rights reserved.
          </p>
          <p className="text-[10px] text-muted-foreground/20 font-mono">
            Built with React + TypeScript + Framer Motion
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
