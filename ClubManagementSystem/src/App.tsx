import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/HomePage";
import Clubs from "./pages/mainlayout/Clubs";
import ClubDetail from "./pages/mainlayout/ClubDetail";
import Events from "./pages/mainlayout/Events";
import Login from "./pages/auth/LoginPage";
import Register from "./pages/auth/RegisterPage";
import About from "./pages/mainlayout/About";
import Dashboard from "./pages/student/Dashboard";
import Profile from "./pages/student/Profile";
import MyClubs from "./pages/student/MyClubs";
import MyEvents from "./pages/student/MyEvents";
import Fees from "./pages/student/Fees";
import NotFound from "./pages/mainlayout/NotFound";
import StaffRoutes from "./routes/StaffRoutes";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/clubs" element={<Clubs />} />
            <Route path="/clubs/:id" element={<ClubDetail />} />
            <Route path="/events" element={<Events />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/about" element={<About />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/my-clubs" element={<MyClubs />} />
            <Route path="/my-events" element={<MyEvents />} />
            <Route path="/fees" element={<Fees />} />
            
            {/* Staff Routes */}
            <Route path="/staff/*" element={<StaffRoutes />} />

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
  </QueryClientProvider>
);

export default App;
