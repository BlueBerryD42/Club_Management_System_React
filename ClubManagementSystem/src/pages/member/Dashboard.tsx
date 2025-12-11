import { useEffect, useState } from "react";
import { Building2, Calendar, CreditCard, Clock, Bell, Users } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppSelector } from "@/store/hooks";
// import axios from "axios"; // Use axios for mock API
const userSelector = (s: any) => s.auth.user;

// derive auth state
const useAuthLike = () => {
  const user = useAppSelector(userSelector);
  const loading = false;
  const profile = user ? { full_name: user.full_name || user.name || user.email } : undefined;
  return { user, loading, profile };
};
const Dashboard = () => {
  const { user, loading, profile } = useAuthLike();
  const [stats, setStats] = useState({ myClubs: 0, upcomingEvents: 0, pendingFees: 0, pendingRequests: 0 });
  const [activities, setActivities] = useState<Array<{ id: string; type: "event" | "club" | "fee" | "request"; title: string; description: string; date: string; status?: string }>>([]);
  const [loadingData, setLoadingData] = useState(true);

  // TODO: Khôi phục auth check khi kết nối API
  // useEffect(() => {
  //   if (!loading && !user) {
  //     navigate("/login");
  //   }
  // }, [user, loading, navigate]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    if (!user) return;
    setLoadingData(true);
    // Simulate API call delay
    setTimeout(() => {
      // Mock stats
      setStats({
        myClubs: 2,
        upcomingEvents: 1,
        pendingFees: 1,
        pendingRequests: 0,
      });
      // Mock activities
      setActivities([
        {
          id: "1",
          type: "event",
          title: "Hội thảo AI",
          description: "Đã đăng ký tham gia",
          date: new Date().toISOString(),
          status: "approved",
        },
        {
          id: "2",
          type: "request",
          title: "CLB Công nghệ",
          description: "Đơn xin gia nhập",
          date: new Date().toISOString(),
          status: "pending",
        },
      ]);
      setLoadingData(false);
    }, 800);
  };

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
      color: "text-primary",
      bgColor: "bg-primary/10",
      href: "/my-clubs",
    },
    {
      title: "Sự kiện sắp tới",
      value: stats.upcomingEvents,
      icon: Calendar,
      color: "text-success",
      bgColor: "bg-success/10",
      href: "/my-events",
    },
    {
      title: "Phí cần đóng",
      value: stats.pendingFees,
      icon: CreditCard,
      color: "text-warning",
      bgColor: "bg-warning/10",
      href: "/fees",
    },
    {
      title: "Đơn chờ duyệt",
      value: stats.pendingRequests,
      icon: Clock,
      color: "text-accent",
      bgColor: "bg-accent/10",
      href: "/my-clubs",
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-success/20 text-success border-success/30">Đã duyệt</Badge>;
      case "pending":
        return <Badge className="bg-warning/20 text-warning border-warning/30">Chờ duyệt</Badge>;
      case "rejected":
        return <Badge className="bg-destructive/20 text-destructive border-destructive/30">Từ chối</Badge>;
      default:
        return null;
    }
  };

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
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
                        <p className="text-3xl font-bold">{loadingData ? "-" : stat.value}</p>
                      </div>
                      <div className={`h-12 w-12 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                        <Icon className={`h-6 w-6 ${stat.color}`} />
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
                  <Link to="/fees">
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

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Hoạt động gần đây
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingData ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16" />
                  ))}
                </div>
              ) : activities.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Chưa có hoạt động nào</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activities.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                        activity.type === "event" ? "bg-success/20 text-success" :
                        activity.type === "request" ? "bg-primary/20 text-primary" :
                        "bg-warning/20 text-warning"
                      }`}>
                        {activity.type === "event" ? <Calendar className="h-4 w-4" /> :
                         activity.type === "request" ? <Users className="h-4 w-4" /> :
                         <CreditCard className="h-4 w-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{activity.title}</p>
                        <p className="text-xs text-muted-foreground">{activity.description}</p>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(activity.date), "dd/MM/yyyy", { locale: vi })}
                          </span>
                          {activity.status && getStatusBadge(activity.status)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
