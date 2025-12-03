import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// Progress not used
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAppSelector } from "@/store/hooks";
// import axios from "axios"; // Use axios for mock API
import { useToast } from "@/hooks/use-toast";
import { 
  CreditCard, 
  Building2, 
  Clock,
  CheckCircle2,
  AlertCircle,
  Wallet
} from "lucide-react";
import { format, isPast } from "date-fns";
import { vi } from "date-fns/locale";

interface Fee {
  id: string;
  name: string;
  description: string | null;
  amount: number;
  due_date: string | null;
  is_active: boolean;
  club_id: string;
  clubs: {
    name: string;
  };
}

interface Payment {
  id: string;
  fee_id: string;
  amount: number;
  status: string;
  paid_at: string;
  fees: {
    name: string;
    clubs: {
      name: string;
    };
  };
}

const Fees = () => {
  const user = useAppSelector((s) => s.auth.user);
  const loading = false;
  const navigate = useNavigate();
  const { toast } = useToast();
  const [fees, setFees] = useState<Fee[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [processingPayment, setProcessingPayment] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    setLoadingData(true);
    setTimeout(() => {
      setFees([
        {
          id: "1",
          name: "Phí CLB Công nghệ",
          description: "Phí thường niên năm 2024",
          amount: 100000,
          due_date: new Date(Date.now() + 86400000 * 7).toISOString(),
          is_active: true,
          club_id: "club1",
          clubs: { name: "CLB Công nghệ" },
        },
      ]);
      setPayments([
        {
          id: "p1",
          fee_id: "1",
          amount: 100000,
          status: "pending",
          paid_at: new Date().toISOString(),
          fees: {
            name: "Phí CLB Công nghệ",
            clubs: { name: "CLB Công nghệ" },
          },
        },
      ]);
      setLoadingData(false);
    }, 800);
  };

  const handlePayment = async (fee: Fee) => {
    setProcessingPayment(fee.id);
    setTimeout(() => {
      toast({
        title: "Đã ghi nhận",
        description: "Yêu cầu thanh toán đã được gửi. Vui lòng chờ xác nhận.",
      });
      fetchData();
      setProcessingPayment(null);
    }, 1000);
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

  // Filter fees that haven't been paid
  const paidFeeIds = payments
    .filter(p => p.status === "approved")
    .map(p => p.fee_id);
  
  const pendingPaymentFeeIds = payments
    .filter(p => p.status === "pending")
    .map(p => p.fee_id);
  
  const unpaidFees = fees.filter(f => !paidFeeIds.includes(f.id) && !pendingPaymentFeeIds.includes(f.id));
  const pendingFees = fees.filter(f => pendingPaymentFeeIds.includes(f.id));

  const totalUnpaid = unpaidFees.reduce((sum, f) => sum + Number(f.amount), 0);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-success/20 text-success border-success/30">Đã thanh toán</Badge>;
      case "pending":
        return <Badge className="bg-warning/20 text-warning border-warning/30">Chờ xác nhận</Badge>;
      case "rejected":
        return <Badge className="bg-destructive/20 text-destructive border-destructive/30">Từ chối</Badge>;
      default:
        return null;
    }
  };

  return (
    <Layout>
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Quản lý phí CLB</h1>
          <p className="text-muted-foreground">Theo dõi và thanh toán các khoản phí câu lạc bộ</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-destructive/10 flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-destructive" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Cần thanh toán</p>
                  <p className="text-2xl font-bold">{unpaidFees.length} khoản</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-warning/10 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-warning" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Chờ xác nhận</p>
                  <p className="text-2xl font-bold">{pendingFees.length} khoản</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Wallet className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tổng cần đóng</p>
                  <p className="text-2xl font-bold">{totalUnpaid.toLocaleString("vi-VN")}đ</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList>
            <TabsTrigger value="pending">
              Cần thanh toán ({unpaidFees.length + pendingFees.length})
            </TabsTrigger>
            <TabsTrigger value="history">
              Lịch sử ({payments.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            {loadingData ? (
              <div className="grid gap-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-32" />
                ))}
              </div>
            ) : unpaidFees.length === 0 && pendingFees.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <CheckCircle2 className="h-16 w-16 mx-auto mb-4 text-success opacity-50" />
                  <h3 className="text-lg font-medium mb-2">Không có khoản phí nào</h3>
                  <p className="text-muted-foreground">Bạn đã thanh toán tất cả các khoản phí!</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {/* Pending payment fees */}
                {pendingFees.map((fee) => (
                  <Card key={fee.id} className="border-warning/50">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-6">
                        <div className="h-14 w-14 rounded-xl bg-warning/10 flex items-center justify-center flex-shrink-0">
                          <Clock className="h-7 w-7 text-warning" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-lg">{fee.name}</h3>
                            <Badge className="bg-warning/20 text-warning border-warning/30">Chờ xác nhận</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground flex items-center gap-1 mb-1">
                            <Building2 className="h-4 w-4" />
                            {fee.clubs?.name}
                          </p>
                          {fee.description && (
                            <p className="text-sm text-muted-foreground">{fee.description}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-warning">
                            {Number(fee.amount).toLocaleString("vi-VN")}đ
                          </p>
                          <p className="text-xs text-muted-foreground">Đang xử lý</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {/* Unpaid fees */}
                {unpaidFees.map((fee) => {
                  const isOverdue = fee.due_date && isPast(new Date(fee.due_date));
                  
                  return (
                    <Card key={fee.id} className={isOverdue ? "border-destructive/50" : ""}>
                      <CardContent className="p-6">
                        <div className="flex items-center gap-6">
                          <div className={`h-14 w-14 rounded-xl flex items-center justify-center flex-shrink-0 ${
                            isOverdue ? "bg-destructive/10" : "bg-primary/10"
                          }`}>
                            <CreditCard className={`h-7 w-7 ${isOverdue ? "text-destructive" : "text-primary"}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-lg">{fee.name}</h3>
                              {isOverdue && (
                                <Badge className="bg-destructive/20 text-destructive border-destructive/30">Quá hạn</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground flex items-center gap-1 mb-1">
                              <Building2 className="h-4 w-4" />
                              {fee.clubs?.name}
                            </p>
                            {fee.due_date && (
                              <p className={`text-sm ${isOverdue ? "text-destructive" : "text-muted-foreground"}`}>
                                Hạn nộp: {format(new Date(fee.due_date), "dd/MM/yyyy", { locale: vi })}
                              </p>
                            )}
                            {fee.description && (
                              <p className="text-sm text-muted-foreground mt-1">{fee.description}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-primary mb-2">
                              {Number(fee.amount).toLocaleString("vi-VN")}đ
                            </p>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button 
                                  size="sm"
                                  disabled={processingPayment === fee.id}
                                >
                                  {processingPayment === fee.id ? "Đang xử lý..." : "Thanh toán"}
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Thanh toán phí CLB</DialogTitle>
                                  <DialogDescription>
                                    Xác nhận thanh toán khoản phí "{fee.name}" của {fee.clubs?.name}
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="py-4">
                                  <div className="flex justify-between items-center p-4 bg-muted rounded-lg mb-4">
                                    <span>Số tiền:</span>
                                    <span className="text-xl font-bold">{Number(fee.amount).toLocaleString("vi-VN")}đ</span>
                                  </div>
                                  <p className="text-sm text-muted-foreground mb-4">
                                    Bằng cách bấm "Xác nhận", yêu cầu thanh toán của bạn sẽ được gửi đến quản lý CLB để xác nhận.
                                  </p>
                                  <Button 
                                    className="w-full" 
                                    onClick={() => handlePayment(fee)}
                                    disabled={processingPayment === fee.id}
                                  >
                                    Xác nhận thanh toán
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="history">
            {payments.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Clock className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-medium mb-2">Chưa có lịch sử thanh toán</h3>
                  <p className="text-muted-foreground">Các giao dịch sẽ hiển thị ở đây</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {payments.map((payment) => (
                  <Card key={payment.id}>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-6">
                        <div className={`h-14 w-14 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          payment.status === "approved" ? "bg-success/10" : 
                          payment.status === "pending" ? "bg-warning/10" : "bg-destructive/10"
                        }`}>
                          {payment.status === "approved" ? (
                            <CheckCircle2 className="h-7 w-7 text-success" />
                          ) : payment.status === "pending" ? (
                            <Clock className="h-7 w-7 text-warning" />
                          ) : (
                            <AlertCircle className="h-7 w-7 text-destructive" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg">{payment.fees?.name}</h3>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Building2 className="h-4 w-4" />
                            {payment.fees?.clubs?.name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(payment.paid_at), "dd/MM/yyyy HH:mm", { locale: vi })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold mb-1">
                            {Number(payment.amount).toLocaleString("vi-VN")}đ
                          </p>
                          {getStatusBadge(payment.status)}
                        </div>
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

export default Fees;
