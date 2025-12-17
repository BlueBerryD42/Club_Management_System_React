import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { treasurerService } from "@/services/treasurer.service";
import { clubApi } from "@/services/club.service";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown,
  FileText,
  ArrowRight,
  DollarSign,
  CreditCard,
  AlertCircle
} from "lucide-react";
import { formatVND } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function TreasurerDashboard() {
  const { clubId } = useParams<{ clubId: string }>();
  const navigate = useNavigate();

  // Fetch club details
  const { data: clubData, isLoading: loadingClub } = useQuery({
    queryKey: ["treasurer-club", clubId],
    queryFn: async () => {
      if (!clubId) return null;
      const res = await clubApi.getById(clubId);
      return res.data;
    },
    enabled: !!clubId,
  });

  // Fetch pending events and balance
  const { data: pendingData, isLoading: loadingPending } = useQuery({
    queryKey: ["treasurer-pending-events", clubId],
    queryFn: async () => {
      if (!clubId) return null;
      return await treasurerService.getPendingEvents(clubId);
    },
    enabled: !!clubId,
  });

  // Fetch balance
  const { data: balanceData, isLoading: loadingBalance } = useQuery({
    queryKey: ["treasurer-balance", clubId],
    queryFn: async () => {
      if (!clubId) return null;
      return await treasurerService.getClubBalance(clubId);
    },
    enabled: !!clubId,
  });

  const balance = pendingData?.balance || balanceData?.balance || 0;
  const pendingCount = pendingData?.data?.length || 0;

  // Calculate monthly stats (placeholder - would need actual ledger data)
  const monthlyIncome = balanceData?.totalIncome || 0;
  const monthlyExpense = balanceData?.totalExpense || 0;

  if (loadingClub || loadingPending || loadingBalance) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  const statCards = [
    { 
      title: "Số dư hiện tại", 
      value: formatVND(balance), 
      icon: Wallet, 
      color: "text-primary",
      description: "Tổng số dư quỹ CLB"
    },
    { 
      title: "Thu nhập tháng này", 
      value: formatVND(monthlyIncome), 
      icon: TrendingUp, 
      color: "text-green-600",
      description: "Tổng thu nhập trong tháng"
    },
    { 
      title: "Chi tiêu tháng này", 
      value: formatVND(monthlyExpense), 
      icon: TrendingDown, 
      color: "text-red-600",
      description: "Tổng chi tiêu trong tháng"
    },
    { 
      title: "Yêu cầu chờ duyệt", 
      value: pendingCount, 
      icon: FileText, 
      color: "text-amber-600",
      description: "Số yêu cầu chi đang chờ"
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          {clubData?.name || 'Dashboard'}
        </h1>
        <p className="text-muted-foreground mt-2">Tổng quan tài chính</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold mt-2">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
                </div>
                <stat.icon className={`h-10 w-10 ${stat.color} opacity-80`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Balance Warning */}
      {balance < 0 && (
        <Card className="border-amber-500 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              <div>
                <p className="font-medium text-amber-900">Cảnh báo số dư</p>
                <p className="text-sm text-amber-700">
                  Số dư quỹ đang âm. Vui lòng kiểm tra và bổ sung quỹ.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card 
          className="hover:shadow-lg transition-shadow cursor-pointer" 
          onClick={() => navigate(`/treasurer/${clubId}/fund-requests`)}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Yêu cầu chi
              {pendingCount > 0 && (
                <Badge variant="destructive" className="ml-auto">
                  {pendingCount}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>Duyệt hoặc từ chối yêu cầu chi quỹ</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">
              Xem chi tiết <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        <Card 
          className="hover:shadow-lg transition-shadow cursor-pointer" 
          onClick={() => navigate(`/treasurer/${clubId}/ledger`)}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Sổ cái
            </CardTitle>
            <CardDescription>Xem lịch sử thu chi của CLB</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">
              Xem chi tiết <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        <Card 
          className="hover:shadow-lg transition-shadow cursor-pointer" 
          onClick={() => navigate(`/treasurer/${clubId}/transactions`)}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Giao dịch
            </CardTitle>
            <CardDescription>Theo dõi các giao dịch PayOS</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">
              Xem chi tiết <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Pending Requests */}
      {pendingData?.data && pendingData.data.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Yêu cầu chi gần đây</CardTitle>
            <CardDescription>Danh sách các yêu cầu chi đang chờ duyệt</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingData.data.slice(0, 5).map((event) => {
                const fundRequest = event.fundRequests?.[0];
                return (
                  <div
                    key={event.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/treasurer/${clubId}/fund-requests/${event.id}`)}
                  >
                    <div className="flex-1">
                      <p className="font-medium">{event.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {fundRequest?.title || 'Yêu cầu chi quỹ'}
                      </p>
                      <p className="text-sm font-semibold text-primary mt-1">
                        {formatVND(fundRequest?.totalAmount || 0)}
                      </p>
                    </div>
                    <Badge variant="secondary">Chờ duyệt</Badge>
                  </div>
                );
              })}
            </div>
            {pendingData.data.length > 5 && (
              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={() => navigate(`/treasurer/${clubId}/fund-requests`)}
              >
                Xem tất cả ({pendingData.data.length})
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Charts Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Biểu đồ thu chi</CardTitle>
            <CardDescription>Thu nhập và chi tiêu theo thời gian</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              <p>Biểu đồ sẽ được hiển thị khi có dữ liệu</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Phân bổ thu nhập</CardTitle>
            <CardDescription>Theo nguồn thu (vé, phí thành viên)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              <p>Biểu đồ sẽ được hiển thị khi có dữ liệu</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

