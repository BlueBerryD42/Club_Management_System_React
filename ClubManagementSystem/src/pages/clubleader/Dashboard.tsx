import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { clubApi } from "@/services/club.service";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Users,
  Calendar,
  DollarSign,
  FileText,
  UserPlus,
  Settings,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import type { AxiosError } from "axios";

interface Club {
  id: string;
  name: string;
  category: string;
  description: string;
  isActive?: boolean;
}

interface ClubStats {
  totalMembers: number;
  activeMembers: number;
  pendingRequests: number;
  upcomingEvents: number;
  totalFees: number;
  paidFees: number;
}

export default function ClubLeaderDashboard() {
  const { clubId } = useParams();
  const navigate = useNavigate();
  const [club, setClub] = useState<Club | null>(null);
  const [stats, setStats] = useState<ClubStats>({
    totalMembers: 0,
    activeMembers: 0,
    pendingRequests: 0,
    upcomingEvents: 0,
    totalFees: 0,
    paidFees: 0,
  });

  const shouldPoll = club?.isActive === false;

  const {
    data: clubResp,
    isLoading: loadingClub,
    error: clubError,
    isError: isClubError,
  } = useQuery({
    queryKey: ["leader-club-detail", clubId],
    queryFn: async () => {
      const res = await clubApi.getById(clubId!);
      return res.data;
    },
    enabled: !!clubId,
    retry: false,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: shouldPoll ? 5000 : false,
  });

  const { data: appsResp } = useQuery({
    queryKey: ["leader-club-applications", clubId],
    queryFn: async () => {
      const res = await clubApi.getClubApplications(clubId!);
      return res.data;
    },
    enabled: !!clubId,
  });

  useEffect(() => {
    if (clubResp?.data) {
      const c = clubResp.data;
      setClub({
        id: c.id,
        name: c.name,
        category: c.category || "",
        description: c.description || "",
        isActive: c.isActive,
      });
      const memberCount = c._count?.memberships || 0;
      setStats((prev) => ({
        ...prev,
        totalMembers: memberCount,
        activeMembers: memberCount,
      }));
    }
  }, [clubResp]);

  useEffect(() => {
    const list = (appsResp?.data || []) as Array<{ status: string }>;
    const pending = list.filter((a) => a.status?.toUpperCase() === "PENDING").length;
    setStats((prev) => ({ ...prev, pendingRequests: pending }));
  }, [appsResp]);

  // Remove manual interval; react-query refetchInterval handles polling while inactive

  const clubErrorMessage = (() => {
    if (!clubError) return "";
    const axiosErr = clubError as AxiosError<any>;
    return (
      axiosErr?.response?.data?.message ||
      axiosErr?.message ||
      "Đã xảy ra lỗi, vui lòng thử lại sau."
    );
  })();

  if (isClubError) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12">
          <Alert variant="destructive" className="max-w-2xl">
            <AlertTitle>Không thể tải thông tin CLB</AlertTitle>
            <AlertDescription>
              {clubErrorMessage || "CLB có thể đã bị khóa hoặc không tồn tại."}
            </AlertDescription>
          </Alert>
        </div>
      </Layout>
    );
  }

  if (!club || loadingClub) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
      </Layout>
    );
  }

  const isInactive = club?.isActive === false;

  const statCards = [
    {
      title: "Tổng thành viên",
      value: stats.totalMembers,
      icon: Users,
      gradient: "from-primary/10 via-primary/5 to-transparent",
      bubble: "bg-primary/10",
      iconBg: "bg-primary/20",
      accent: "text-primary",
    },
    {
      title: "Thành viên hoạt động",
      value: stats.activeMembers,
      icon: TrendingUp,
      gradient: "from-emerald-500/10 via-emerald-500/5 to-transparent",
      bubble: "bg-emerald-500/10",
      iconBg: "bg-emerald-500/20",
      accent: "text-emerald-600",
    },
    {
      title: "Đơn chờ duyệt",
      value: stats.pendingRequests,
      icon: UserPlus,
      gradient: "from-amber-400/15 via-amber-400/10 to-transparent",
      bubble: "bg-amber-400/15",
      iconBg: "bg-amber-400/30",
      accent: "text-amber-600",
    },
    {
      title: "Sự kiện sắp tới",
      value: stats.upcomingEvents,
      icon: Calendar,
      gradient: "from-blue-500/10 via-blue-500/5 to-transparent",
      bubble: "bg-blue-500/10",
      iconBg: "bg-blue-500/20",
      accent: "text-blue-600",
    },
  ];

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {isInactive ? (
          <>
            <Alert variant="destructive" className="mb-6">
              <AlertTitle>CLB đã bị khóa</AlertTitle>
              <AlertDescription>
                CLB này đã bị vô hiệu hóa bởi admin. Vui lòng liên hệ quản trị viên để kích hoạt lại.
              </AlertDescription>
            </Alert>
            <div className="mt-6 text-center text-muted-foreground">
              <p>Hiện tại bạn không thể sử dụng các chức năng của CLB này.</p>
            </div>
          </>
        ) : (
          <>
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground">{club.name}</h1>
              <p className="text-muted-foreground mt-2">Quản lý câu lạc bộ</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {statCards.map((stat, index) => (
                <Card
                  key={index}
                  className={`relative overflow-hidden border-0 bg-gradient-to-br ${stat.gradient} shadow-lg hover:shadow-xl transition-shadow`}
                >
                  <div className={`absolute top-0 right-0 w-32 h-32 ${stat.bubble} rounded-full -translate-y-1/2 translate-x-1/2`} />
                  <CardContent className="p-6 relative">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">{stat.title}</p>
                        <p className={`text-3xl font-bold mt-2 ${stat.accent}`}>{stat.value}</p>
                      </div>
                      <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${stat.iconBg}`}>
                        <stat.icon className={`h-6 w-6 ${stat.accent}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <Card
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate(`/club-leader/${clubId}/members`)}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Quản lý thành viên
                  </CardTitle>
                  <CardDescription>Quản lý vai trò thành viên</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full">
                    Xem chi tiết <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>

              <Card
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate(`/club-leader/${clubId}/events`)}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Quản lý sự kiện
                  </CardTitle>
                  <CardDescription>Tạo và quản lý các sự kiện CLB</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full">
                    Xem chi tiết <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>

              <Card
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate(`/club-leader/${clubId}/fees`)}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Quản lý phí
                  </CardTitle>
                  <CardDescription>Thiết lập và theo dõi thu phí</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full">
                    Xem chi tiết <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>

              <Card
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate(`/club-leader/${clubId}/join-requests`)}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserPlus className="h-5 w-5" />
                    Đơn gia nhập
                  </CardTitle>
                  <CardDescription>Xem xét, duyệt đơn gia nhập CLB</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full">
                    Xem chi tiết <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>

              <Card
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate(`/club-leader/${clubId}/reports`)}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Báo cáo
                  </CardTitle>
                  <CardDescription>Xem báo cáo và thống kê CLB</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full">
                    Xem chi tiết <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>

              <Card
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate(`/club-leader/${clubId}/settings`)}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Cài đặt CLB
                  </CardTitle>
                  <CardDescription>Cập nhật thông tin và cấu hình</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full">
                    Xem chi tiết <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
