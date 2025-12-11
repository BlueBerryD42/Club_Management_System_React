import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
// import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAppSelector } from "@/store/hooks";
import { useToast } from "@/hooks/use-toast";
import { 
  Building2, 
  Calendar, 
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Plus
} from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

interface MyClub {
  id: string;
  club_id: string;
  role: string;
  status: string;
  joined_at: string;
  clubs: {
    id: string;
    name: string;
    category: string;
    logo_url: string | null;
    description: string | null;
  };
}

interface JoinRequest {
  id: string;
  club_id: string;
  status: string;
  message: string | null;
  created_at: string;
  clubs: {
    id: string;
    name: string;
    category: string;
    logo_url: string | null;
  };
}

const MyClubs = () => {
  const user = useAppSelector((s) => s.auth.user);
  const loading = false;
  // const navigate = useNavigate();
  const { toast } = useToast();
  const [myClubs, setMyClubs] = useState<MyClub[]>([]);
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // TODO: Khôi phục auth check khi kết nối API
  // useEffect(() => {
  //   if (!loading && !user) {
  //     navigate("/login");
  //   }
  // }, [user, loading, navigate]);

  // useEffect(() => {
  //   if (user) {
  //     fetchData();
  //   }
  // }, [user]);

  useEffect(() => {
    fetchData();
  }, []);
  // Replace supabase API with mock data logic
  const fetchData = async () => {
    if (!user) return;
    setLoadingData(true);
    setTimeout(() => {
      setMyClubs([
        {
          id: "1",
          club_id: "club1",
          role: "member",
          status: "active",
          joined_at: new Date(Date.now() - 86400000 * 30).toISOString(),
          clubs: {
            id: "club1",
            name: "CLB Công nghệ",
            category: "Kỹ thuật",
            logo_url: null,
            description: "Câu lạc bộ về công nghệ và kỹ thuật.",
          },
        },
      ]);
      setJoinRequests([
        {
          id: "r1",
          club_id: "club2",
          status: "pending",
          message: "Mong muốn tham gia CLB!",
          created_at: new Date().toISOString(),
          clubs: {
            id: "club2",
            name: "CLB Văn nghệ",
            category: "Nghệ thuật",
            logo_url: null,
          },
        },
      ]);
      setLoadingData(false);
    }, 800);
  };

  const cancelRequest = async (requestId: string) => {
    setJoinRequests(prev => prev.filter(r => r.id !== requestId));
    toast({
      title: "Đã huỷ",
      description: "Đơn xin gia nhập đã được huỷ",
    });
  };

  const leaveClub = async (membershipId: string) => {
    setMyClubs(prev => prev.filter(c => c.id !== membershipId));
    toast({
      title: "Đã rời",
      description: "Bạn đã rời khỏi câu lạc bộ",
    });
  };

  if (loading) {
    return (
      <Layout>
        <div className="container py-8">
          <Skeleton className="h-10 w-48 mb-8" />
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </Layout>
    );
  }

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

  const pendingRequests = joinRequests.filter(r => r.status === "pending");
  const processedRequests = joinRequests.filter(r => r.status !== "pending");

  return (
    <Layout>
      <div className="container py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">CLB của tôi</h1>
            <p className="text-muted-foreground">Quản lý các câu lạc bộ bạn tham gia</p>
          </div>
          <Button asChild>
            <Link to="/clubs">
              <Plus className="h-4 w-4 mr-2" />
              Tìm CLB mới
            </Link>
          </Button>
        </div>

        <Tabs defaultValue="clubs" className="space-y-6">
          <TabsList>
            <TabsTrigger value="clubs">
              Đang tham gia ({myClubs.length})
            </TabsTrigger>
            <TabsTrigger value="pending">
              Đơn chờ duyệt ({pendingRequests.length})
            </TabsTrigger>
            <TabsTrigger value="history">
              Lịch sử đơn ({processedRequests.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="clubs">
            {loadingData ? (
              <div className="grid gap-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-32" />
                ))}
              </div>
            ) : myClubs.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Building2 className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-medium mb-2">Chưa tham gia CLB nào</h3>
                  <p className="text-muted-foreground mb-4">Hãy khám phá và gia nhập các câu lạc bộ!</p>
                  <Button asChild>
                    <Link to="/clubs">Tìm câu lạc bộ</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {myClubs.map((club) => (
                  <Card key={club.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-6">
                        <div className="h-16 w-16 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                          {club.clubs.logo_url ? (
                            <img src={club.clubs.logo_url} alt={club.clubs.name} className="h-12 w-12 object-cover rounded-lg" />
                          ) : (
                            <Building2 className="h-8 w-8 text-primary" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-lg">{club.clubs.name}</h3>
                            <Badge variant="secondary">{club.role === "leader" ? "Trưởng CLB" : "Thành viên"}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{club.clubs.category}</p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            Tham gia: {format(new Date(club.joined_at), "dd/MM/yyyy", { locale: vi })}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" asChild>
                            <Link to={`/clubs/${club.club_id}`}>
                              Xem chi tiết
                              <ArrowRight className="h-4 w-4 ml-1" />
                            </Link>
                          </Button>
                          {club.role !== "leader" && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-destructive hover:text-destructive"
                              onClick={() => leaveClub(club.id)}
                            >
                              Rời CLB
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="pending">
            {pendingRequests.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Clock className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-medium mb-2">Không có đơn chờ duyệt</h3>
                  <p className="text-muted-foreground">Các đơn xin gia nhập CLB sẽ hiển thị ở đây</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {pendingRequests.map((request) => (
                  <Card key={request.id}>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-6">
                        <div className="h-16 w-16 rounded-xl bg-warning/10 flex items-center justify-center flex-shrink-0">
                          <Clock className="h-8 w-8 text-warning" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-lg">{request.clubs.name}</h3>
                            {getStatusBadge(request.status)}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{request.clubs.category}</p>
                          <p className="text-sm text-muted-foreground">
                            Ngày gửi: {format(new Date(request.created_at), "dd/MM/yyyy HH:mm", { locale: vi })}
                          </p>
                          {request.message && (
                            <p className="text-sm mt-2 italic">"{request.message}"</p>
                          )}
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-destructive hover:text-destructive"
                          onClick={() => cancelRequest(request.id)}
                        >
                          Hủy đơn
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="history">
            {processedRequests.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Clock className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-medium mb-2">Chưa có lịch sử đơn</h3>
                  <p className="text-muted-foreground">Các đơn đã được xử lý sẽ hiển thị ở đây</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {processedRequests.map((request) => (
                  <Card key={request.id} className="opacity-80">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-6">
                        <div className={`h-16 w-16 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          request.status === "approved" ? "bg-success/10" : "bg-destructive/10"
                        }`}>
                          {request.status === "approved" ? (
                            <CheckCircle2 className="h-8 w-8 text-success" />
                          ) : (
                            <XCircle className="h-8 w-8 text-destructive" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-lg">{request.clubs.name}</h3>
                            {getStatusBadge(request.status)}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Ngày gửi: {format(new Date(request.created_at), "dd/MM/yyyy", { locale: vi })}
                          </p>
                        </div>
                        {request.status === "approved" && (
                          <Button variant="outline" size="sm" asChild>
                            <Link to={`/clubs/${request.club_id}`}>
                              Xem CLB
                            </Link>
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default MyClubs;
