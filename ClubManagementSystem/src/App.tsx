import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router-dom";
import router from "./routes";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Faster freshness for 10s auto-update
      staleTime: 10 * 1000, // 10 seconds
      gcTime: 10 * 60 * 1000, // 10 minutes
      // Auto update behaviors
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      refetchOnMount: true,
      // Poll globally every ~10s (override per-query as needed)
      refetchInterval: 10 * 1000,
      refetchIntervalInBackground: true,
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
