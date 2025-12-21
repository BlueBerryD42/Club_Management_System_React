import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { QrCode, Home, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollToTop } from "@/components/layout/ScrollToTop";

const StaffLayout = () => {
  const navigate = useNavigate();

  const handleBackToUserPage = () => {
    navigate("/events");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Desktop Header - Hidden on Mobile */}
      <header className="hidden md:flex items-center justify-between px-6 py-4 bg-white border-b border-border">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-primary">Cổng Nhân Sự</h1>
        </div>
        <div className="flex items-center gap-4">
          <nav className="flex items-center gap-6">
            <NavLink 
              to="/staff/dashboard" 
              className={({ isActive }) => cn("text-sm font-medium transition-colors hover:text-primary", isActive ? "text-primary" : "text-muted-foreground")}
            >
              Tổng quan
            </NavLink>
            <NavLink 
              to="/staff/scan" 
              className={({ isActive }) => cn("text-sm font-medium transition-colors hover:text-primary", isActive ? "text-primary" : "text-muted-foreground")}
            >
              Check-in
            </NavLink>
            {/* <NavLink 
              to="/staff/requests" 
              className={({ isActive }) => cn("text-sm font-medium transition-colors hover:text-primary", isActive ? "text-primary" : "text-muted-foreground")}
            >
              Yêu cầu chi
            </NavLink> */}
          </nav>
          <Button variant="ghost" size="sm" onClick={handleBackToUserPage}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Về trang chủ
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto pb-16 md:pb-0" data-scroll-root>
        <ScrollToTop />
        <div className="container mx-auto p-4 max-w-5xl">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Navigation - Visible only on Mobile */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-border py-2 px-6 z-50 pb-safe">
        <div className="flex justify-around items-center">
          <NavLink 
            to="/staff/dashboard" 
            className={({ isActive }) => cn("flex flex-col items-center gap-1 p-2 rounded-lg transition-colors", isActive ? "text-primary" : "text-muted-foreground")}
          >
            <Home className="h-6 w-6" />
            <span className="text-[10px] font-medium">Trang chủ</span>
          </NavLink>
          
          <NavLink 
            to="/staff/scan" 
            className={({ isActive }) => cn("flex flex-col items-center gap-1 p-2 rounded-lg transition-colors", isActive ? "text-primary" : "text-muted-foreground")}
          >
            <QrCode className="h-6 w-6" />
            <span className="text-[10px] font-medium">Check-in</span>
          </NavLink>

          {/* <NavLink 
            to="/staff/requests" 
            className={({ isActive }) => cn("flex flex-col items-center gap-1 p-2 rounded-lg transition-colors", isActive ? "text-primary" : "text-muted-foreground")}
          >
            <FileText className="h-6 w-6" />
            <span className="text-[10px] font-medium">Đề xuất</span>
          </NavLink> */}

          <button 
            onClick={handleBackToUserPage}
            className="flex flex-col items-center gap-1 p-2 rounded-lg text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-6 w-6" />
            <span className="text-[10px] font-medium">Về trang chủ</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default StaffLayout;

