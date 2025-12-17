import { Outlet, NavLink, useLocation, Link, Navigate, useParams, useNavigate } from "react-router-dom";
import { LayoutDashboard, FileText, BookOpen, CreditCard, FileBarChart, Menu, Wallet, ArrowLeft } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppSelector } from "@/store/hooks";
import { useState, Fragment, useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useQuery } from "@tanstack/react-query";
import { clubApi } from "@/services/club.service";

const TreasurerLayout = () => {
  const { clubId } = useParams<{ clubId: string }>();
  const navigate = useNavigate();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const isMobile = useIsMobile();
  const location = useLocation();
  const { isAuthenticated, user } = useAppSelector((s) => s.auth);

  // Get treasurer clubs
  const treasurerClubs = user?.memberships?.filter(
    (m) => m.role === 'TREASURER' && m.status === 'ACTIVE'
  ) || [];

  // Fetch club details for current club
  const { data: clubData } = useQuery({
    queryKey: ['treasurer-club', clubId],
    queryFn: async () => {
      if (!clubId) return null;
      const res = await clubApi.getById(clubId);
      return res.data;
    },
    enabled: !!clubId,
  });

  // Check if user is treasurer of current club
  const isTreasurerOfClub = !!user?.memberships?.some(
    (m) => m.clubId === clubId && m.role === 'TREASURER' && m.status === 'ACTIVE'
  );

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Redirect if not treasurer of this club
  if (clubId && !isTreasurerOfClub) {
    return <Navigate to="/unauthorized" replace />;
  }

  // If no club selected but user has treasurer clubs, redirect to first one
  if (!clubId && treasurerClubs.length > 0) {
    return <Navigate to={`/treasurer/${treasurerClubs[0].clubId}/dashboard`} replace />;
  }

  // If no treasurer clubs, redirect to unauthorized
  if (treasurerClubs.length === 0) {
    return <Navigate to="/unauthorized" replace />;
  }


  const handleClubChange = (newClubId: string) => {
    const currentPath = location.pathname;
    const pathWithoutClubId = currentPath.replace(`/treasurer/${clubId}`, '');
    navigate(`/treasurer/${newClubId}${pathWithoutClubId || '/dashboard'}`);
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
        <h1 className="text-xl font-bold text-primary">Thủ quỹ</h1>
        <p className="text-xs text-muted-foreground mt-1">
          {clubData?.name || 'Quản lý tài chính CLB'}
        </p>
        {clubId && (
          <div className="mt-3">
            <Select value={clubId} onValueChange={handleClubChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Chọn CLB" />
              </SelectTrigger>
              <SelectContent>
                {treasurerClubs.map((membership) => (
                  <SelectItem key={membership.clubId} value={membership.clubId}>
                    CLB #{membership.clubId.slice(0, 6)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        <NavItem to={`/treasurer/${clubId}/dashboard`} icon={LayoutDashboard} label="Tổng quan" />
        <NavItem to={`/treasurer/${clubId}/fund-requests`} icon={FileText} label="Yêu cầu chi" />
        <NavItem to={`/treasurer/${clubId}/ledger`} icon={BookOpen} label="Sổ cái" />
        <NavItem to={`/treasurer/${clubId}/transactions`} icon={CreditCard} label="Giao dịch" />
        <NavItem to={`/treasurer/${clubId}/reports`} icon={FileBarChart} label="Báo cáo" />
      </nav>

      <div className="p-4 border-t">
        <Button 
          variant="ghost" 
          className="w-full justify-start hover:bg-muted" 
          onClick={() => navigate('/member/dashboard')}
        >
          <ArrowLeft className="h-5 w-5 mr-3" />
          Trở về trang cá nhân
        </Button>
      </div>
    </div>
  );

  // Breadcrumb Logic
  const pathnames = location.pathname.split("/").filter((x) => x);
  const breadcrumbNameMap: { [key: string]: string } = {
    treasurer: "Thủ quỹ",
    dashboard: "Tổng quan",
    "fund-requests": "Yêu cầu chi",
    ledger: "Sổ cái",
    transactions: "Giao dịch",
    reports: "Báo cáo",
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
              <Wallet className="h-5 w-5 text-primary" />
              <h1 className="font-bold text-lg text-primary">Thủ quỹ</h1>
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
                  if (value === 'treasurer' || value === clubId) return null;

                  const to = `/${pathnames.slice(0, index + 1).join("/")}`;
                  const isLast = index === pathnames.length - 1;
                  const name = breadcrumbNameMap[value] || value;
                  
                  return (
                    <Fragment key={to}>
                      <BreadcrumbItem>
                        {isLast ? (
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

export default TreasurerLayout;

