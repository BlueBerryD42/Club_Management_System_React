import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
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
import AdminRoutes from "./routes/AdminRoutes";

const queryClient = new QueryClient();

const router = createBrowserRouter([
  {
    path: "/",
    element: <Index />,
  },
  {
    path: "/clubs",
    element: <Clubs />,
  },
  {
    path: "/clubs/:id",
    element: <ClubDetail />,
  },
  {
    path: "/events",
    element: <Events />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/register",
    element: <Register />,
  },
  {
    path: "/about",
    element: <About />,
  },
  {
    path: "/dashboard",
    element: <Dashboard />,
  },
  {
    path: "/profile",
    element: <Profile />,
  },
  {
    path: "/my-clubs",
    element: <MyClubs />,
  },
  {
    path: "/my-events",
    element: <MyEvents />,
  },
  {
    path: "/fees",
    element: <Fees />,
  },
  StaffRoutes,
  AdminRoutes,
  {
    path: "*",
    element: <NotFound />,
  },
]);

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
