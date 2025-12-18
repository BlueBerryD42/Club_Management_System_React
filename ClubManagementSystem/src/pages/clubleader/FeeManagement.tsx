import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Pencil, Trash2, Check, X } from "lucide-react";
import { clubApi } from "@/services/club.service";
import { useMutation } from "@tanstack/react-query";

interface Fee {
  id: string;
  name: string;
  amount: number;
  description: string | null;
  is_required: boolean;
  created_at: string;
}

interface FeePayment {
  id: string;
  user_id: string;
  fee_id: string;
  amount_paid: number;
  status: string;
  paid_at: string | null;
  proof_url: string | null;
  full_name: string;
  email: string;
  student_id: string;
  fee_name: string;
}

export default function FeeManagement() {
  const { clubId } = useParams();
  const { toast } = useToast();
  const [fees, setFees] = useState<Fee[]>([]);
  const [payments, setPayments] = useState<FeePayment[]>([]);
  const [showFeeDialog, setShowFeeDialog] = useState(false);
  const [editingFee, setEditingFee] = useState<Fee | null>(null);
  const [feeFormData, setFeeFormData] = useState({
    name: "",
    amount: 0,
    description: "",
    is_required: true,
  });
  const [activeTab, setActiveTab] = useState("fees");

  useEffect(() => {
    // TODO: Fetch current fee config if available via separate endpoint (not specified)
  }, [clubId]);

  const resetFeeForm = () => {
    setFeeFormData({ name: "", amount: 0, description: "", is_required: true });
    setEditingFee(null);
  };

  const configFeeMutation = useMutation({
    mutationFn: () => clubApi.configMembershipFee(clubId!, {
      membershipFeeEnabled: feeFormData.is_required,
      membershipFeeAmount: feeFormData.amount,
    }),
    onSuccess: () => {
      toast({ title: "Thành công", description: "Đã cấu hình phí hội viên" });
    },
    onError: () => {
      toast({ title: "Lỗi", description: "Cấu hình phí thất bại", variant: "destructive" });
    }
  });

  const handleCreateFee = async () => {
    if (!feeFormData.name || feeFormData.amount <= 0) {
      toast({ title: "Lỗi", description: "Vui lòng điền đầy đủ thông tin", variant: "destructive" });
      return;
    }
    await configFeeMutation.mutateAsync();
    setShowFeeDialog(false);
    resetFeeForm();
  };

  const handleDeleteFee = async (feeId: string) => {
    // TODO: Kết nối API
    setFees(fees.filter((f) => f.id !== feeId));
    toast({ title: "Thành công", description: "Đã xóa phí" });
  };

  const handleApproveFeePayment = async (paymentId: string) => {
    // TODO: Kết nối API
    setPayments(payments.map((p) => (p.id === paymentId ? { ...p, status: "paid" } : p)));
    toast({ title: "Thành công", description: "Đã xác nhận thanh toán" });
  };

  const handleRejectFeePayment = async (paymentId: string) => {
    // TODO: Kết nối API
    setPayments(payments.map((p) => (p.id === paymentId ? { ...p, status: "rejected" } : p)));
    toast({ title: "Đã từ chối", description: "Đã từ chối thanh toán" });
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-warning/20 text-warning">Chờ xác nhận</Badge>;
      case "paid":
        return <Badge className="bg-success/20 text-success">Đã thanh toán</Badge>;
      case "rejected":
        return <Badge className="bg-destructive/20 text-destructive">Từ chối</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" asChild className="mb-6">
          <Link to={`/club-leader/${clubId}/dashboard`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại Dashboard
          </Link>
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Quản lý phí</h1>
          <p className="text-muted-foreground mt-2">Quản lý các khoản phí và thanh toán của thành viên</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="fees">Quản lý phí</TabsTrigger>
            <TabsTrigger value="payments">Thanh toán</TabsTrigger>
          </TabsList>

          <TabsContent value="fees">
            <div className="flex justify-end mb-4">
              <Button onClick={() => { resetFeeForm(); setShowFeeDialog(true); }}>
                <Plus className="mr-2 h-4 w-4" />
                Tạo phí mới
              </Button>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tên phí</TableHead>
                      <TableHead>Số tiền</TableHead>
                      <TableHead>Mô tả</TableHead>
                      <TableHead>Bắt buộc</TableHead>
                      <TableHead className="text-right">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fees.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          Chưa có phí nào
                        </TableCell>
                      </TableRow>
                    ) : (
                      fees.map((fee) => (
                        <TableRow key={fee.id}>
                          <TableCell className="font-medium">{fee.name}</TableCell>
                          <TableCell>{fee.amount.toLocaleString("vi-VN")} đ</TableCell>
                          <TableCell className="max-w-xs truncate">{fee.description}</TableCell>
                          <TableCell>
                            {fee.is_required ? (
                              <Badge className="bg-success/20 text-success">Bắt buộc</Badge>
                            ) : (
                              <Badge variant="outline">Tùy chọn</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="icon" onClick={() => { setEditingFee(fee); setShowFeeDialog(true); }}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteFee(fee.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Họ tên</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>MSSV</TableHead>
                      <TableHead>Phí</TableHead>
                      <TableHead>Số tiền</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead className="text-right">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          Không có thanh toán nào
                        </TableCell>
                      </TableRow>
                    ) : (
                      payments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell className="font-medium">{payment.full_name}</TableCell>
                          <TableCell>{payment.email}</TableCell>
                          <TableCell>{payment.student_id}</TableCell>
                          <TableCell>{payment.fee_name}</TableCell>
                          <TableCell>{payment.amount_paid.toLocaleString("vi-VN")} đ</TableCell>
                          <TableCell>{getPaymentStatusBadge(payment.status)}</TableCell>
                          <TableCell className="text-right">
                            {payment.status === "pending" && (
                              <div className="flex justify-end gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-success border-success hover:bg-success/10"
                                  onClick={() => handleApproveFeePayment(payment.id)}
                                >
                                  <Check className="h-4 w-4 mr-1" />
                                  Xác nhận
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-destructive border-destructive hover:bg-destructive/10"
                                  onClick={() => handleRejectFeePayment(payment.id)}
                                >
                                  <X className="h-4 w-4 mr-1" />
                                  Từ chối
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={showFeeDialog} onOpenChange={setShowFeeDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingFee ? "Chỉnh sửa phí" : "Tạo phí mới"}</DialogTitle>
              <DialogDescription>Nhập thông tin chi tiết về phí</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="fee_name">Tên phí *</Label>
                <Input id="fee_name" value={feeFormData.name} onChange={(e) => setFeeFormData({ ...feeFormData, name: e.target.value })} placeholder="VD: Phí quản lý hàng năm" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fee_amount">Số tiền (VNĐ) *</Label>
                <Input id="fee_amount" type="number" value={feeFormData.amount} onChange={(e) => setFeeFormData({ ...feeFormData, amount: parseInt(e.target.value) || 0 })} placeholder="0" min={0} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fee_description">Mô tả</Label>
                <Input id="fee_description" value={feeFormData.description} onChange={(e) => setFeeFormData({ ...feeFormData, description: e.target.value })} placeholder="Mô tả chi tiết về phí..." />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setShowFeeDialog(false); resetFeeForm(); }}>Hủy</Button>
              <Button onClick={handleCreateFee}>{editingFee ? "Lưu thay đổi" : "Tạo phí"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
