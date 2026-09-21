import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import MouseFollower from "./components/MouseFollower";
import GalleryPage from "./pages/GalleryPage";
import NotFound from "./pages/NotFound";

const ConceptPage = lazy(() => import("./pages/ConceptPage"));
const LizaQuest = lazy(() => import("./pages/liza/LizaQuest"));
const LizaPrint = lazy(() => import("./pages/liza/LizaPrint"));

const isLiza = typeof window !== "undefined" && window.location.pathname.startsWith("/liza");

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      {!isLiza && <MouseFollower />}
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<GalleryPage />} />
          <Route
            path="/concept/:id"
            element={
              <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><div className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin" /></div>}>
                <ConceptPage />
              </Suspense>
            }
          />
          <Route path="/liza" element={<Suspense fallback={null}><LizaQuest /></Suspense>} />
          <Route path="/liza/print" element={<Suspense fallback={null}><LizaPrint /></Suspense>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
