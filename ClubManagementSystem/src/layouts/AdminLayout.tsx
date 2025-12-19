import { Outlet, NavLink, useLocation, Link } from "react-router-dom";
import { LayoutDashboard, Users, Tent, LogOut, Menu, Settings, Bell, ChevronRight, Shield } from "lucide-react";
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
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { logout } from "@/store/slices/authSlice";
import { useState, Fragment } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

const AdminLayout = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const isMobile = useIsMobile();
  const location = useLocation();

  const handleLogout = () => {
    dispatch(logout());
    window.location.href = "/login";
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const NavItem = ({ to, icon: Icon, label, badge }: { to: string; icon: any; label: string; badge?: number }) => (
    <NavLink
      to={to}
      onClick={() => isMobile && setIsMobileOpen(false)}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group relative",
          isActive
            ? "bg-primary/10 text-primary border-l-4 border-primary"
            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
        )
      }
    >
      <div className={cn(
        "flex items-center justify-center w-9 h-9 rounded-lg transition-all",
        "group-hover:bg-primary/10"
      )}>
        <Icon className="h-5 w-5" />
      </div>
      <span className="flex-1">{label}</span>
      {badge && badge > 0 && (
        <Badge className="bg-primary text-white text-xs px-2 py-0.5">{badge}</Badge>
      )}
      <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
    </NavLink>
  );

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800">
      {/* Logo Section */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary to-orange-400 flex items-center justify-center shadow-lg shadow-primary/30">
            <span className="text-2xl">🎓</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">ClubHub</h1>
            <p className="text-xs text-slate-400">Admin Portal</p>
          </div>
        </div>
      </div>

      {/* User Profile Section */}
      <div className="p-4 mx-4 mt-4 rounded-2xl bg-white/5 backdrop-blur border border-white/10">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12 border-2 border-primary/50">
            <AvatarImage src={user?.avatarUrl} />
            <AvatarFallback className="bg-gradient-to-br from-primary to-orange-400 text-white font-bold">
              {user?.fullName ? getInitials(user.fullName) : 'AD'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">
              {user?.fullName || 'Admin User'}
            </p>
            <p className="text-xs text-slate-400 truncate">{user?.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-3">
          <Badge className="bg-primary/20 text-primary border-0 text-xs">
            <Shield className="h-3 w-3 mr-1" />
            {user?.role || 'ADMIN'}
          </Badge>
          <Badge variant="outline" className="text-emerald-400 border-emerald-400/30 text-xs">
            ● Online
          </Badge>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 mb-3 mt-2">
          Quản lý
        </p>
        <NavItem to="/admin/dashboard" icon={LayoutDashboard} label="Tổng quan" />
        <NavItem to="/admin/clubs" icon={Tent} label="Câu lạc bộ" />
        <NavItem to="/admin/users" icon={Users} label="Người dùng" />

        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 mb-3 mt-6">
          Hệ thống
        </p>
        <NavItem to="/admin/notifications" icon={Bell} label="Thông báo" badge={3} />
        <NavItem to="/admin/settings" icon={Settings} label="Cài đặt" />
      </nav>

      {/* Logout Section */}
      <div className="p-4 border-t border-white/10">
        <Button
          variant="ghost"
          className="w-full justify-start text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-xl h-12"
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5 mr-3" />
          Đăng xuất
        </Button>
        <p className="text-xs text-slate-500 text-center mt-3">
          ClubHub Admin v1.0
        </p>
      </div>
    </div>
  );

  // Breadcrumb Logic
  const pathnames = location.pathname.split("/").filter((x) => x);
  const breadcrumbNameMap: { [key: string]: string } = {
    admin: "Admin",
    dashboard: "Tổng quan",
    clubs: "Câu lạc bộ",
    create: "Tạo mới",
    users: "Người dùng",
    finance: "Tài chính",
    requests: "Yêu cầu chi",
    audit: "Nhật ký",
    settings: "Cài đặt",
    notifications: "Thông báo",
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Desktop Sidebar */}
      {!isMobile && (
        <aside className="w-72 fixed h-full z-20 shadow-2xl">
          <SidebarContent />
        </aside>
      )}

      {/* Main Content Wrapper */}
      <div className={cn("flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out", !isMobile ? "ml-72" : "")}>
        {/* Top Header Bar */}
        <header className="h-16 bg-white border-b flex items-center px-6 justify-between sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-4">
            {isMobile && (
              <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-xl">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-72">
                  <SheetHeader className="sr-only">
                    <SheetTitle>Menu</SheetTitle>
                  </SheetHeader>
                  <SidebarContent />
                </SheetContent>
              </Sheet>
            )}

            {/* Breadcrumbs */}
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to="/admin/dashboard" className="text-primary font-medium">
                      🏠 Admin
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                {pathnames.map((value, index) => {
                  if (value === 'admin') return null;

                  const to = `/${pathnames.slice(0, index + 1).join("/")}`;
                  const isLast = index === pathnames.length - 1;
                  const name = breadcrumbNameMap[value] || value;
                  const isNonNavigable = value === 'finance';

                  return (
                    <Fragment key={to}>
                      <BreadcrumbSeparator />
                      <BreadcrumbItem>
                        {isLast || isNonNavigable ? (
                          <BreadcrumbPage className="font-medium">{name}</BreadcrumbPage>
                        ) : (
                          <BreadcrumbLink asChild>
                            <Link to={to}>{name}</Link>
                          </BreadcrumbLink>
                        )}
                      </BreadcrumbItem>
                    </Fragment>
                  );
                })}
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          {/* Right side of header */}
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="rounded-xl relative">
              <Bell className="h-5 w-5 text-slate-500" />
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-primary rounded-full text-[10px] text-white flex items-center justify-center">
                3
              </span>
            </Button>
            <div className="h-8 w-px bg-slate-200" />
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.avatarUrl} />
                <AvatarFallback className="bg-primary text-white text-xs">
                  {user?.fullName ? getInitials(user.fullName) : 'AD'}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium text-slate-700 hidden md:block">
                {user?.fullName || 'Admin'}
              </span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-auto bg-slate-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;

