import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAppSelector } from "@/store/hooks";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { transactionApi } from "@/services/transaction.service";
import {
  CreditCard,
  Building2,
  Clock,
  CheckCircle2,
  AlertCircle,
  Wallet,
  ExternalLink,
  QrCode as QrCodeIcon,
} from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

interface Transaction {
  id: string;
  userId: string;
  type: string;
  status: string;
  amount: number;
  orderCode: string;
  checkoutUrl?: string;
  qrCode?: string;
  clubId?: string;
  eventId?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
  club?: {
    id: string;
    name: string;
    logoUrl?: string;
  };
}

const Fees = () => {
  const user = useAppSelector((s) => s.auth.user);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);

  // Fetch pending membership transactions
  const { data: pendingTransactionsResponse, isLoading: loadingPending } = useQuery({
    queryKey: ['transactions', 'MEMBERSHIP', 'PENDING'],
    queryFn: async () => {
      const response = await transactionApi.getMyTransactions({
        type: 'MEMBERSHIP',
        status: 'PENDING',
      });
      console.log('📊 Pending transactions response:', response.data);
      return response.data;
    },
    enabled: !!user,
    refetchInterval: 10000, // Auto refresh every 10s for faster updates during testing
  });

  // Fetch transaction history (all statuses)
  const { data: historyResponse, isLoading: loadingHistory } = useQuery({
    queryKey: ['transactions', 'MEMBERSHIP', 'history'],
    queryFn: async () => {
      const response = await transactionApi.getMyTransactions({
        type: 'MEMBERSHIP',
      });
      console.log('📜 All transactions response:', response.data);
      return response.data;
    },
    enabled: !!user,
    refetchInterval: 10000, // Sync with pending query
  });

  // Create payment mutation
  const createPaymentMutation = useMutation({
    mutationFn: async (clubId: string) => {
      const response = await transactionApi.createPayment({
        type: 'MEMBERSHIP',
        clubId,
      });
      return response.data;
    },
    onSuccess: (response) => {
      const transaction = response.data || response.transaction;
      setSelectedTransaction(transaction);
      setShowPaymentDialog(true);
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast({ title: "Thành công", description: "Đã tạo link thanh toán" });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: error.response?.data?.message || "Không thể tạo link thanh toán",
        variant: "destructive",
      });
    },
  });

  // Get payment info mutation (for existing transactions)
  const getPaymentInfoMutation = useMutation({
    mutationFn: async (transactionId: string) => {
      const response = await transactionApi.getPaymentInfo(transactionId);
      return response.data;
    },
    onSuccess: (response) => {
      const paymentInfo = response.data || response;
      setSelectedTransaction(paymentInfo);
      setShowPaymentDialog(true);
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: error.response?.data?.message || "Không thể lấy thông tin thanh toán",
        variant: "destructive",
      });
    },
  });

  // Check and sync payment status from PayOS
  const checkStatusMutation = useMutation({
    mutationFn: async (transactionId: string) => {
      const response = await transactionApi.checkAndSyncStatus(transactionId);
      return response.data;
    },
    onSuccess: (response) => {
      const result = response.data || response;
      if (result.status === 'SUCCESS') {
        toast({
          title: "🎉 Thanh toán thành công!",
          description: "Phí thành viên đã được xác nhận. Membership của bạn đã được kích hoạt!",
        });
        queryClient.invalidateQueries({ queryKey: ['transactions'] });
        setShowPaymentDialog(false);
      } else if (result.status === 'CANCELLED') {
        toast({
          title: "Giao dịch đã hủy",
          description: "Giao dịch đã bị hủy hoặc hết hạn. Bạn có thể tạo thanh toán mới.",
          variant: "destructive",
        });
        queryClient.invalidateQueries({ queryKey: ['transactions'] });
      } else {
        toast({
          title: "Chưa thanh toán",
          description: "Giao dịch vẫn đang chờ thanh toán. Vui lòng quét QR hoặc mở link để thanh toán.",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: error.response?.data?.message || "Không thể kiểm tra trạng thái thanh toán",
        variant: "destructive",
      });
    },
  });

  const pendingTransactions: Transaction[] = pendingTransactionsResponse?.data || pendingTransactionsResponse?.transactions || [];
  const allTransactions: Transaction[] = historyResponse?.data || historyResponse?.transactions || [];

  console.log('✅ Parsed:', { pending: pendingTransactions.length, all: allTransactions.length });

  // Filter for completed transactions
  const completedTransactions = allTransactions.filter(t =>
    t.status === 'SUCCESS' || t.status === 'FAILED' || t.status === 'CANCELLED'
  );

  const totalUnpaid = pendingTransactions.reduce((sum, t) => sum + Number(t.amount), 0);

  const handleCreatePayment = (clubId: string) => {
    createPaymentMutation.mutate(clubId);
  };

  const handleViewPayment = (transaction: Transaction) => {
    getPaymentInfoMutation.mutate(transaction.id);
  };

  const handleOpenPaymentLink = () => {
    if (selectedTransaction?.checkoutUrl) {
      window.open(selectedTransaction.checkoutUrl, '_blank');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SUCCESS":
        return <Badge className="bg-success/20 text-success border-success/30">Đã thanh toán</Badge>;
      case "PENDING":
        return <Badge className="bg-warning/20 text-warning border-warning/30">Chờ thanh toán</Badge>;
      case "FAILED":
      case "CANCELLED":
        return <Badge className="bg-destructive/20 text-destructive border-destructive/30">Thất bại</Badge>;
      default:
        return null;
    }
  };

  // Get memberships that need payment (PENDING_PAYMENT status)
  const pendingMemberships = user?.memberships?.filter((m: any) => m.status === 'PENDING_PAYMENT') || [];

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
                  <p className="text-2xl font-bold">{pendingMemberships.length} khoản</p>
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
                  <p className="text-2xl font-bold">{pendingTransactions.length} khoản</p>
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
              Cần thanh toán ({pendingMemberships.length + pendingTransactions.length})
            </TabsTrigger>
            <TabsTrigger value="history">
              Lịch sử ({completedTransactions.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            {loadingPending ? (
              <div className="grid gap-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-32" />
                ))}
              </div>
            ) : pendingMemberships.length === 0 && pendingTransactions.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <CheckCircle2 className="h-16 w-16 mx-auto mb-4 text-success opacity-50" />
                  <h3 className="text-lg font-medium mb-2">Không có khoản phí nào</h3>
                  <p className="text-muted-foreground">Bạn đã thanh toán tất cả các khoản phí!</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {/* Pending Transactions (have payment link already) */}
                {pendingTransactions.map((transaction) => (
                  <Card key={transaction.id} className="border-warning/50">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-6">
                        <div className="h-14 w-14 rounded-xl bg-warning/10 flex items-center justify-center flex-shrink-0">
                          <Clock className="h-7 w-7 text-warning" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-lg">Phí thành viên {transaction.club?.name}</h3>
                            <Badge className="bg-warning/20 text-warning border-warning/30">Chờ thanh toán</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground flex items-center gap-1 mb-1">
                            <Building2 className="h-4 w-4" />
                            {transaction.club?.name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Order: {transaction.orderCode}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-warning mb-2">
                            {Number(transaction.amount).toLocaleString("vi-VN")}đ
                          </p>
                          <div className="flex gap-2 justify-end">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewPayment(transaction)}
                              disabled={getPaymentInfoMutation.isPending}
                            >
                              <QrCodeIcon className="h-4 w-4 mr-2" />
                              Xem QR
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => checkStatusMutation.mutate(transaction.id)}
                              disabled={checkStatusMutation.isPending}
                            >
                              {checkStatusMutation.isPending ? "Đang kiểm tra..." : "Đã thanh toán?"}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {/* Pending Memberships (need to create payment) */}
                {pendingMemberships.map((membership: any) => {
                  // Check if transaction already exists for this membership
                  const hasTransaction = pendingTransactions.some(t => t.clubId === membership.clubId);
                  if (hasTransaction) return null;

                  return (
                    <Card key={membership.id}>
                      <CardContent className="p-6">
                        <div className="flex items-center gap-6">
                          <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <CreditCard className="h-7 w-7 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-lg mb-1">
                              Phí thành viên {membership.club?.name}
                            </h3>
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <Building2 className="h-4 w-4" />
                              {membership.club?.name}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-primary mb-2">
                              {Number(membership.club?.membershipFeeAmount || 0).toLocaleString("vi-VN")}đ
                            </p>
                            <Button
                              size="sm"
                              onClick={() => handleCreatePayment(membership.clubId)}
                              disabled={createPaymentMutation.isPending}
                            >
                              {createPaymentMutation.isPending ? "Đang tạo..." : "Thanh toán"}
                            </Button>
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
            {loadingHistory ? (
              <div className="grid gap-4">
                {[1, 2].map((i) => (
                  <Skeleton key={i} className="h-32" />
                ))}
              </div>
            ) : completedTransactions.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Clock className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-medium mb-2">Chưa có lịch sử thanh toán</h3>
                  <p className="text-muted-foreground">Các giao dịch sẽ hiển thị ở đây</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {completedTransactions.map((transaction) => (
                  <Card key={transaction.id}>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-6">
                        <div className={`h-14 w-14 rounded-xl flex items-center justify-center flex-shrink-0 ${transaction.status === "SUCCESS" ? "bg-success/10" : "bg-destructive/10"
                          }`}>
                          {transaction.status === "SUCCESS" ? (
                            <CheckCircle2 className="h-7 w-7 text-success" />
                          ) : (
                            <AlertCircle className="h-7 w-7 text-destructive" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg">Phí thành viên {transaction.club?.name}</h3>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Building2 className="h-4 w-4" />
                            {transaction.club?.name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(transaction.createdAt), "dd/MM/yyyy HH:mm", { locale: vi })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold mb-1">
                            {Number(transaction.amount).toLocaleString("vi-VN")}đ
                          </p>
                          {getStatusBadge(transaction.status)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Payment Dialog with QR Code */}
        <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Thanh toán phí thành viên</DialogTitle>
              <DialogDescription>
                Quét mã QR hoặc mở link để thanh toán qua PayOS
              </DialogDescription>
            </DialogHeader>
            {selectedTransaction && (
              <div className="space-y-4">
                {/* QR Code */}
                {selectedTransaction.qrCode && (
                  <div className="flex justify-center p-4 bg-muted rounded-lg">
                    <img
                      src={selectedTransaction.qrCode}
                      alt="QR Code"
                      className="w-64 h-64"
                    />
                  </div>
                )}

                {/* Payment Info */}
                <div className="space-y-2">
                  <div className="flex justify-between p-3 bg-muted rounded-lg">
                    <span className="text-sm text-muted-foreground">Số tiền:</span>
                    <span className="font-bold">{Number(selectedTransaction.amount).toLocaleString("vi-VN")}đ</span>
                  </div>
                  <div className="flex justify-between p-3 bg-muted rounded-lg">
                    <span className="text-sm text-muted-foreground">Mã đơn:</span>
                    <span className="font-mono font-bold">{selectedTransaction.orderCode}</span>
                  </div>
                  {selectedTransaction.club && (
                    <div className="flex justify-between p-3 bg-muted rounded-lg">
                      <span className="text-sm text-muted-foreground">Câu lạc bộ:</span>
                      <span className="font-medium">{selectedTransaction.club.name}</span>
                    </div>
                  )}
                </div>

                {/* Payment Link Button */}
                {selectedTransaction.checkoutUrl && (
                  <Button
                    className="w-full"
                    onClick={handleOpenPaymentLink}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Mở link thanh toán
                  </Button>
                )}

                {/* Check Status Button */}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => checkStatusMutation.mutate(selectedTransaction.id)}
                  disabled={checkStatusMutation.isPending}
                >
                  {checkStatusMutation.isPending ? "Đang kiểm tra..." : "✓ Đã thanh toán? Kiểm tra ngay"}
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  Sau khi thanh toán xong, nhấn nút trên để cập nhật trạng thái
                </p>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default Fees;
