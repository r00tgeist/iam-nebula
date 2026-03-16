const Footer = () => (
  <footer className="relative z-10 w-full border-t border-border/40 py-6 mt-auto">
    <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-center gap-1 text-[11px] text-muted-foreground/50 tracking-wide select-none">
      <span>Developed by</span>
      <span className="font-display font-semibold text-muted-foreground/70">rootgeist</span>
      <span className="hidden sm:inline mx-1">·</span>
      <span>All rights reserved © {new Date().getFullYear()}</span>
    </div>
  </footer>
);

export default Footer;
