import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, Users, Calendar, FileText, LogIn, UserPlus, Home, Building2, User, LogOut, CreditCard, LayoutDashboard, Crown, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { useUserProfile } from "@/hooks/useUserProfile";
import { logout } from "@/store/slices/authSlice";
import { useQuery } from "@tanstack/react-query";
import { clubApi } from "@/services/club.service";

const navLinks = [
  { href: "/", label: "Trang chủ", icon: Home },
  { href: "/clubs", label: "Câu lạc bộ", icon: Building2 },
  { href: "/events", label: "Sự kiện", icon: Calendar },
  { href: "/about", label: "Giới thiệu", icon: FileText },
];

export function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  // Fetch and hydrate user profile (memberships, etc.) after login
  const { isLoading: profileLoading } = useUserProfile();
  const loading = profileLoading;
  const profile = user ? { full_name: user.fullName || user.email || "Người dùng", avatar_url: user.avatarUrl } : undefined;
  const leaderClubs = (user?.memberships || []).filter(m => m.role === 'LEADER' && m.status === 'ACTIVE');
  const treasurerClubs = (user?.memberships || []).filter(m => m.role === 'TREASURER' && m.status === 'ACTIVE');
  const membershipClubIds = Array.from(new Set([...leaderClubs, ...treasurerClubs].map((m) => m.clubId)));

  const { data: clubNameMap } = useQuery({
    queryKey: ['membership-club-names', membershipClubIds],
    enabled: membershipClubIds.length > 0,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const entries = await Promise.all(
        membershipClubIds.map(async (id) => {
          try {
            const res = await clubApi.getById(id);
            const club = (res as any).data?.data || (res as any).data;
            const name = club?.name || club?.data?.name || club?.club?.name;
            return [id, name || id];
          } catch (err) {
            console.error('Failed to load club name', err);
            return [id, id];
          }
        })
      );
      return Object.fromEntries(entries) as Record<string, string>;
    }
  });

  const getClubName = (m: any) => clubNameMap?.[m.clubId] || m.clubName || m.club?.name || m.clubId;

  // Scroll detection
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY < 10) {
        // Always show header at the top
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY) {
        // Scrolling down - hide header
        setIsVisible(false);
      } else {
        // Scrolling up - show header
        setIsVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const handleSignOut = async () => {
    dispatch(logout());
    navigate("/");
  };

  return (
    <header className={cn(
      "sticky top-0 z-50 w-full border-b border-border/50 bg-card/95 backdrop-blur-lg supports-[backdrop-filter]:bg-card/80 transition-transform duration-300",
      isVisible ? "translate-y-0" : "-translate-y-full"
    )}>
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 font-bold text-xl">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-primary">
            <Users className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="hidden sm:inline-block text-gradient">ClubHub</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.href;
            return (
              <Link
                key={link.href}
                to={link.href}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <Icon className="h-4 w-4" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Auth Buttons / User Menu */}
        <div className="hidden md:flex items-center gap-2">
          {loading ? (
            <div className="h-9 w-24 bg-muted animate-pulse rounded-lg" />
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 px-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profile?.avatar_url || ""} />
                    <AvatarFallback className="text-xs gradient-primary text-primary-foreground">
                      {profile?.full_name?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">{profile?.full_name || "Người dùng"}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuItem asChild>
                  <Link to="/member/dashboard" className="flex items-center gap-2">
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/member/profile" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Hồ sơ cá nhân
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/member/my-clubs" className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    CLB của tôi
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/member/my-events" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Sự kiện của tôi
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/member/fees" className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Thanh toán phí
                  </Link>
                </DropdownMenuItem>
                {leaderClubs.length > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">Khu vực Leader</div>
                    {leaderClubs.map((m) => (
                      <DropdownMenuItem key={m.clubId} asChild>
                        <Link to={`/club-leader/${m.clubId}/dashboard`} className="flex items-center gap-2">
                          <Crown className="h-4 w-4 text-yellow-500" />
                          Quản lý CLB {getClubName(m)}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </>
                )}
                {treasurerClubs.length > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">Khu vực Treasurer</div>
                    {treasurerClubs.map((m) => (
                      <DropdownMenuItem key={m.clubId} asChild>
                        <Link to={`/treasurer/${m.clubId}/dashboard`} className="flex items-center gap-2">
                          <Wallet className="h-4 w-4 text-green-500" />
                          Quản lý quỹ CLB {getClubName(m)}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                  <LogOut className="h-4 w-4 mr-2" />
                  Đăng xuất
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/login">
                  <LogIn className="h-4 w-4 mr-1" />
                  Đăng nhập
                </Link>
              </Button>

            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden border-t border-border/50 bg-card animate-slide-up">
          <nav className="container py-4 flex flex-col gap-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.href;
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {link.label}
                </Link>
              );
            })}
            <div className="border-t border-border/50 my-2 pt-4 flex flex-col gap-2">
              {user ? (
                <>
                  <Link to="/member/dashboard" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted">
                    <LayoutDashboard className="h-5 w-5" />
                    Dashboard
                  </Link>
                  {leaderClubs.length > 0 && (
                    <>
                      <div className="px-4 pt-2 text-xs font-medium text-muted-foreground">Khu vực Leader</div>
                      {leaderClubs.map((m) => (
                        <Link
                          key={m.clubId}
                          to={`/club-leader/${m.clubId}/dashboard`}
                          onClick={() => setIsOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted"
                        >
                          <Crown className="h-5 w-5 text-yellow-500" />
                          Quản lý CLB {getClubName(m)}
                        </Link>
                      ))}
                    </>
                  )}
                  {treasurerClubs.length > 0 && (
                    <>
                      <div className="px-4 pt-2 text-xs font-medium text-muted-foreground">Khu vực Treasurer</div>
                      {treasurerClubs.map((m) => (
                        <Link
                          key={m.clubId}
                          to={`/treasurer/${m.clubId}/dashboard`}
                          onClick={() => setIsOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted"
                        >
                          <Wallet className="h-5 w-5 text-green-500" />
                          Quản lý quỹ CLB {getClubName(m)}
                        </Link>
                      ))}
                    </>
                  )}
                  <Button variant="ghost" className="justify-start text-destructive" onClick={() => { handleSignOut(); setIsOpen(false); }}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Đăng xuất
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" asChild className="w-full">
                    <Link to="/login" onClick={() => setIsOpen(false)}>
                      <LogIn className="h-4 w-4 mr-2" />
                      Đăng nhập
                    </Link>
                  </Button>
                  <Button variant="hero" asChild className="w-full">
                    <Link to="/register" onClick={() => setIsOpen(false)}>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Đăng ký
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
