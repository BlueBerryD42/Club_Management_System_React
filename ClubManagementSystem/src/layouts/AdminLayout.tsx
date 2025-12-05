import { Outlet, NavLink } from "react-router-dom";
import { LayoutDashboard, Users, Tent, LogOut, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useAppDispatch } from "@/store/hooks";
import { logout } from "@/store/slices/authSlice";
import { useState } from "react";

const AdminLayout = () => {
  const dispatch = useAppDispatch();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleLogout = () => {
    dispatch(logout());
    window.location.href = "/login";
  };

  const NavItem = ({ to, icon: Icon, label }: { to: string; icon: any; label: string }) => (
    <NavLink
      to={to}
      onClick={() => setIsMobileOpen(false)}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors",
          isActive
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
        )
      }
    >
      <Icon className="h-5 w-5" />
      {label}
    </NavLink>
  );

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b">
        <h1 className="text-xl font-bold text-primary">Admin Portal</h1>
        <p className="text-xs text-muted-foreground mt-1">Hệ thống quản lý CLB</p>
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        <NavItem to="/admin/dashboard" icon={LayoutDashboard} label="Tổng quan" />
        <NavItem to="/admin/clubs" icon={Tent} label="Quản lý CLB" />
        <NavItem to="/admin/users" icon={Users} label="Quản lý Người dùng" />
      </nav>

      <div className="p-4 border-t">
        <Button variant="ghost" className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10" onClick={handleLogout}>
          <LogOut className="h-5 w-5 mr-3" />
          Đăng xuất
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-muted/10 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-64 border-r bg-white fixed h-full">
        <SidebarContent />
      </aside>

      {/* Main Content Wrapper */}
      <div className="flex-1 md:ml-64 flex flex-col">
        {/* Mobile Header */}
        <header className="md:hidden h-16 border-b bg-white flex items-center px-4 justify-between sticky top-0 z-30">
          <div className="flex items-center gap-2">
             <h1 className="font-bold text-lg text-primary">Admin Portal</h1>
          </div>
          
          <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64">
                <SheetHeader className="sr-only">
                    <SheetTitle>Menu</SheetTitle>
                </SheetHeader>
              <SidebarContent />
            </SheetContent>
          </Sheet>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
