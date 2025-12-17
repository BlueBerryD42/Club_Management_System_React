import { Outlet, NavLink, useLocation, Link } from "react-router-dom";
import { LayoutDashboard, Users, Tent, LogOut, Menu, FileText, History } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useAppDispatch } from "@/store/hooks";
import { logout } from "@/store/slices/authSlice";
import { useState, Fragment } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

const AdminLayout = () => {
  const dispatch = useAppDispatch();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const isMobile = useIsMobile();
  const location = useLocation();

  const handleLogout = () => {
    dispatch(logout());
    window.location.href = "/login";
  };

  const NavItem = ({ to, icon: Icon, label }: { to: string; icon: any; label: string }) => (
    <NavLink
      to={to}
      onClick={() => isMobile && setIsMobileOpen(false)}
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
        {/* <NavItem to="/admin/finance/requests" icon={FileText} label="Yêu cầu chi" /> */}
        {/* <NavItem to="/admin/audit" icon={History} label="Nhật ký hệ thống" /> */}
      </nav>

      <div className="p-4 border-t">
        <Button variant="ghost" className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10" onClick={handleLogout}>
          <LogOut className="h-5 w-5 mr-3" />
          Đăng xuất
        </Button>
      </div>
    </div>
  );

  // Breadcrumb Logic
  const pathnames = location.pathname.split("/").filter((x) => x);
  const breadcrumbNameMap: { [key: string]: string } = {
    admin: "Admin",
    dashboard: "Tổng quan",
    clubs: "Quản lý CLB",
    create: "Tạo mới",
    users: "Người dùng",
    finance: "Tài chính",
    requests: "Yêu cầu chi",
    audit: "Nhật ký",
  };

  return (
    <div className="min-h-screen bg-muted/10 flex">
      {/* Desktop Sidebar */}
      {!isMobile && (
        <aside className="w-64 border-r bg-white fixed h-full z-20">
          <SidebarContent />
        </aside>
      )}

      {/* Main Content Wrapper */}
      <div className={cn("flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out", !isMobile ? "ml-64" : "")}>
        {/* Mobile Header */}
        {isMobile && (
          <header className="h-16 border-b bg-white flex items-center px-4 justify-between sticky top-0 z-30">
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
        )}

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-auto">
          {/* Breadcrumbs */}
          <div className="mb-6">
            <Breadcrumb>
              <BreadcrumbList>
                {pathnames.map((value, index) => {
                  if (value === 'admin') return null;

                  const to = `/${pathnames.slice(0, index + 1).join("/")}`;
                  const isLast = index === pathnames.length - 1;
                  const name = breadcrumbNameMap[value] || value;
                  
                  // Disable navigation for 'finance' as it's just a category
                  const isNonNavigable = value === 'finance';

                  return (
                    <Fragment key={to}>
                      <BreadcrumbItem>
                        {isLast || isNonNavigable ? (
                          <BreadcrumbPage>{name}</BreadcrumbPage>
                        ) : (
                          <BreadcrumbLink asChild>
                            <Link to={to}>{name}</Link>
                          </BreadcrumbLink>
                        )}
                      </BreadcrumbItem>
                      {!isLast && <BreadcrumbSeparator />}
                    </Fragment>
                  );
                })}
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
