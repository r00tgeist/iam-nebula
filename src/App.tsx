import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import MouseFollower from "./components/MouseFollower";
import GalleryPage from "./pages/GalleryPage";
import NotFound from "./pages/NotFound";

const ConceptPage = lazy(() => import("./pages/ConceptPage"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <MouseFollower />
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
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
