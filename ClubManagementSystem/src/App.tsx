import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router-dom";
import router from "./routes";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes - data is considered fresh for 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes - cache is kept for 10 minutes (formerly cacheTime)
      refetchOnWindowFocus: false, // Don't refetch when window regains focus
      refetchOnMount: false, // Don't refetch on mount if data is fresh
      retry: 1,
    },
  },
});



const App = () => (
  <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <RouterProvider router={router} />
      </TooltipProvider>
  </QueryClientProvider>
);

export default App;
