import { useQuery } from "@tanstack/react-query";
import { Building2, Calendar, CreditCard, Clock, Bell, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppSelector } from "@/store/hooks";
import { clubApi } from "@/services/club.service";

interface UserClub {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logoUrl?: string;
  memberCount?: number;
  role?: string;
  status?: string;
}

interface ClubMembership {
  clubId: string;
  role: string;
  status: string;
}

const getRoleLabel = (role: string): string => {
  switch (role) {
    case 'LEADER':
      return 'Chủ nhiệm';
    case 'TREASURER':
      return 'Thủ quỹ';
    case 'STAFF':
      return 'Nhân viên';
    default:
      return 'Thành viên';
  }
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case "approved":
      return <Badge className="bg-success/20 text-success border-success/30">Đã duyệt</Badge>;
    case "pending":
      return <Badge className="bg-warning/20 text-warning border-warning/30">Chờ duyệt</Badge>;
    case "rejected":
      return <Badge className="bg-destructive/20 text-destructive border-destructive/30">Từ chối</Badge>;
    case "ACTIVE":
      return <Badge className="bg-success/20 text-success border-success/30">Hoạt động</Badge>;
    case "PENDING_PAYMENT":
      return <Badge className="bg-warning/20 text-warning border-warning/30">Chờ thanh toán</Badge>;
    default:
      return null;
  }
};

const Dashboard = () => {
  const user = useAppSelector((s: Record<string, any>) => s.auth.user);

  // Fetch user's clubs
  const { data: clubsData = [], isLoading: clubsLoading } = useQuery({
    queryKey: ['user-clubs', user?.id],
    enabled: !!user && !!user.memberships && user.memberships.length > 0,
    queryFn: async () => {
      if (!user?.memberships || user.memberships.length === 0) return [];

      try {
        // Fetch details for each club the user is a member of
        const clubDetails: UserClub[] = [];

        for (const membership of user.memberships as ClubMembership[]) {
          try {
            const res = await clubApi.getById(membership.clubId);
            const clubData = Array.isArray(res) ? res[0] : (res.data?.club || res.data);

            clubDetails.push({
              id: clubData.id,
              name: clubData.name,
              slug: clubData.slug,
              description: clubData.description,
              logoUrl: clubData.logoUrl,
              role: membership.role,
              status: membership.status
            });
          } catch (error) {
            console.error(`Error fetching club ${membership.clubId}:`, error);
          }
        }

        return clubDetails;
      } catch (error) {
        console.error('Error fetching clubs:', error);
        return [];
      }
    }
  });

  // Fetch user's pending applications
  const { data: applicationsData } = useQuery({
    queryKey: ['my-applications', 'PENDING'],
    queryFn: async () => {
      const res = await clubApi.getMyApplications({ status: 'PENDING' });
      return res.data;
    },
    enabled: !!user,
  });

  // Filter to count only applications submitted BY the current user (not TO their clubs)
  const allApplications = applicationsData?.data || applicationsData?.applications || [];
  const userOwnApplications = allApplications.filter((app: any) => app.userId === user?.id);

  // Computed stats based on clubsData and applicationsData
  const stats = {
    myClubs: clubsLoading ? 0 : clubsData.length,
    upcomingEvents: 0,
    pendingFees: 0,
    pendingRequests: userOwnApplications.length,
  };

  const loading = false;
  const profile = user ? { full_name: user.full_name || user.name || user.email } : undefined;

  if (loading) {
    return (
      <Layout>
        <div className="container py-8">
          <Skeleton className="h-10 w-64 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  const statCards = [
    {
      title: "CLB của tôi",
      value: stats.myClubs,
      icon: Building2,
      cardBg: "bg-primary",
      iconColor: "text-white",
      textColor: "text-white",
      href: "/member/my-clubs",
    },
    {
      title: "Sự kiện sắp tới",
      value: stats.upcomingEvents,
      icon: Calendar,
      cardBg: "bg-emerald-500",
      iconColor: "text-white",
      textColor: "text-white",
      href: "/member/my-events",
    },
    {
      title: "Phí cần đóng",
      value: stats.pendingFees,
      icon: CreditCard,
      cardBg: "bg-amber-500",
      iconColor: "text-white",
      textColor: "text-white",
      href: "/member/fees",
    },
    {
      title: "Đơn chờ duyệt",
      value: stats.pendingRequests,
      icon: Clock,
      cardBg: "bg-indigo-500",
      iconColor: "text-white",
      textColor: "text-white",
      href: "/member/pending-applications",
    },
  ];

  const isClubsLoading = clubsLoading;
  const hasClubs = clubsData.length > 0;
  const noClubsMessage = !isClubsLoading && !hasClubs;

  return (
    <Layout>
      <div className="container py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Xin chào, {profile?.full_name || "bạn"}! 👋
          </h1>
          <p className="text-muted-foreground">
            Chào mừng bạn trở lại với ClubHub. Đây là tổng quan hoạt động của bạn.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <Link key={stat.title} to={stat.href}>
                <Card className={`hover:shadow-md transition-shadow cursor-pointer ${stat.cardBg} text-white border-none`}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm mb-1 text-white/80">{stat.title}</p>
                        <p className="text-3xl font-bold">{isClubsLoading ? "-" : stat.value}</p>
                      </div>
                      <div className={`h-12 w-12 rounded-xl bg-white/15 flex items-center justify-center`}>
                        <Icon className={`h-6 w-6 ${stat.iconColor}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Thao tác nhanh</CardTitle>
              <CardDescription>Các hành động thường dùng</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Button variant="outline" className="h-auto py-4 justify-start" asChild>
                  <Link to="/clubs">
                    <Building2 className="h-5 w-5 mr-3" />
                    <div className="text-left">
                      <div className="font-medium">Tìm CLB</div>
                      <div className="text-xs text-muted-foreground">Khám phá và gia nhập CLB mới</div>
                    </div>
                  </Link>
                </Button>
                <Button variant="outline" className="h-auto py-4 justify-start" asChild>
                  <Link to="/events">
                    <Calendar className="h-5 w-5 mr-3" />
                    <div className="text-left">
                      <div className="font-medium">Sự kiện</div>
                      <div className="text-xs text-muted-foreground">Xem và đăng ký sự kiện</div>
                    </div>
                  </Link>
                </Button>
                <Button variant="outline" className="h-auto py-4 justify-start" asChild>
                  <Link to="/member/profile">
                    <Users className="h-5 w-5 mr-3" />
                    <div className="text-left">
                      <div className="font-medium">Hồ sơ</div>
                      <div className="text-xs text-muted-foreground">Cập nhật thông tin cá nhân</div>
                    </div>
                  </Link>
                </Button>
                <Button variant="outline" className="h-auto py-4 justify-start" asChild>
                  <Link to="/member/fees">
                    <CreditCard className="h-5 w-5 mr-3" />
                    <div className="text-left">
                      <div className="font-medium">Thanh toán</div>
                      <div className="text-xs text-muted-foreground">Xem và đóng phí CLB</div>
                    </div>
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* My Clubs Section */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                CLB của tôi
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isClubsLoading && (
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <Skeleton key={i} className="h-12" />
                  ))}
                </div>
              )}

              {noClubsMessage && (
                <div className="text-center py-6 text-muted-foreground">
                  <Building2 className="h-12 w-12 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Bạn chưa gia nhập CLB nào</p>
                  <Button variant="link" size="sm" asChild className="mt-2">
                    <Link to="/clubs">Tìm CLB</Link>
                  </Button>
                </div>
              )}

              {hasClubs && (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {clubsData.map((club) => (
                    <Link
                      key={club.id}
                      to={`/clubs/${club.id}`}
                      className="block p-3 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate group-hover:underline">{club.name}</p>
                          {club.role && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {getRoleLabel(club.role)}
                            </p>
                          )}
                        </div>
                        {club.status && getStatusBadge(club.status)}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Hoạt động gần đây
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Tính năng này sẽ sớm được cập nhật</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Dashboard;
