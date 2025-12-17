import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { treasurerService } from "@/services/treasurer.service";
import { eventService } from "@/services/event.service";
import { formatVND } from "@/lib/utils";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from "@/components/ui/dialog";
import { 
  ArrowLeft, 
  CheckCircle2, 
  XCircle, 
  Upload,
  DollarSign,
  Calendar,
  User,
  FileText,
  AlertCircle,
  ExternalLink,
  X,
  Image
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function FundRequestDetailPage() {
  const { clubId, eventId } = useParams<{ clubId: string; eventId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [rejectReason, setRejectReason] = useState("");
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofImageUrl, setProofImageUrl] = useState("");
  const [proofPreview, setProofPreview] = useState<string | null>(null);

  // Fetch event details
  const { data: event, isLoading: loadingEvent } = useQuery({
    queryKey: ["treasurer-event", eventId],
    queryFn: async () => {
      if (!eventId) return null;
      return await eventService.getById(eventId);
    },
    enabled: !!eventId,
  });

  // Fetch pending events to get fund request details
  const { data: pendingData } = useQuery({
    queryKey: ["treasurer-pending-events", clubId],
    queryFn: async () => {
      if (!clubId) return null;
      return await treasurerService.getPendingEvents(clubId);
    },
    enabled: !!clubId,
  });

  const fundRequest = pendingData?.data?.find(e => e.id === eventId)?.fundRequests?.[0];
  const balance = pendingData?.balance || 0;
  const requestAmount = fundRequest?.totalAmount || 0;
  const balanceAfter = balance - requestAmount;
  const canApprove = balance >= requestAmount;

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: async () => {
      if (!eventId) throw new Error("Event ID is required");
      return await treasurerService.approveEvent(eventId, {
        proof: proofFile || undefined,
        proofImageUrl: proofImageUrl || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["treasurer-pending-events", clubId] });
      queryClient.invalidateQueries({ queryKey: ["treasurer-event", eventId] });
      toast({ 
        title: "Thành công", 
        description: "Đã duyệt yêu cầu chi quỹ thành công." 
      });
      navigate(`/treasurer/${clubId}/fund-requests`);
    },
    onError: (error: any) => {
      toast({ 
        title: "Lỗi", 
        description: error?.response?.data?.message || "Không thể duyệt yêu cầu.", 
        variant: "destructive" 
      });
    },
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: async () => {
      if (!eventId) throw new Error("Event ID is required");
      return await treasurerService.rejectEvent(eventId, { reason: rejectReason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["treasurer-pending-events", clubId] });
      queryClient.invalidateQueries({ queryKey: ["treasurer-event", eventId] });
      toast({ 
        title: "Đã từ chối", 
        description: "Yêu cầu đã bị từ chối." 
      });
      setIsRejectOpen(false);
      navigate(`/treasurer/${clubId}/fund-requests`);
    },
    onError: (error: any) => {
      toast({ 
        title: "Lỗi", 
        description: error?.response?.data?.message || "Không thể từ chối yêu cầu.", 
        variant: "destructive" 
      });
    },
  });

  // Create payment link mutation
  const createPaymentLinkMutation = useMutation({
    mutationFn: async () => {
      if (!eventId) throw new Error("Event ID is required");
      return await treasurerService.createPaymentLink(eventId);
    },
    onSuccess: (data) => {
      if (data.data?.paymentLink) {
        window.open(data.data.paymentLink, '_blank');
        toast({ 
          title: "Thành công", 
          description: "Đã tạo link thanh toán. Vui lòng thanh toán để bổ sung quỹ." 
        });
      }
    },
    onError: (error: any) => {
      toast({ 
        title: "Lỗi", 
        description: error?.response?.data?.message || "Không thể tạo link thanh toán.", 
        variant: "destructive" 
      });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Lỗi",
        description: "Chỉ chấp nhận file hình ảnh (JPG, PNG, GIF, etc.)",
        variant: "destructive",
      });
      e.target.value = '';
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Lỗi",
        description: "Kích thước file không được vượt quá 5MB",
        variant: "destructive",
      });
      e.target.value = '';
      return;
    }

    setProofFile(file);
    setProofImageUrl(''); // Clear URL if file is selected
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setProofPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveFile = () => {
    setProofFile(null);
    setProofPreview(null);
    // Reset file input
    const fileInput = document.getElementById('proof-file') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const handleApprove = () => {
    if (!proofFile && !proofImageUrl) {
      toast({
        title: "Thiếu thông tin",
        description: "Vui lòng cung cấp hình ảnh chuyển khoản xác nhận.",
        variant: "destructive",
      });
      return;
    }
    approveMutation.mutate();
  };

  const handleReject = () => {
    if (!rejectReason.trim()) {
      toast({
        title: "Thiếu thông tin",
        description: "Vui lòng nhập lý do từ chối.",
        variant: "destructive",
      });
      return;
    }
    rejectMutation.mutate();
  };

  if (loadingEvent) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!event || !fundRequest) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/treasurer/${clubId}/fund-requests`)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <Card>
          <CardContent className="p-12 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium">Không tìm thấy yêu cầu chi</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => navigate(`/treasurer/${clubId}/fund-requests`)}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold tracking-tight">{event.title}</h2>
          <p className="text-muted-foreground text-sm">Chi tiết yêu cầu chi quỹ</p>
        </div>
        <Badge variant="secondary">Chờ duyệt</Badge>
      </div>

      {/* Balance Warning */}
      {!canApprove && (
        <Card className="border-amber-500 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              <div className="flex-1">
                <p className="font-medium text-amber-900">Số dư không đủ</p>
                <p className="text-sm text-amber-700">
                  Số dư hiện tại ({formatVND(balance)}) không đủ để duyệt yêu cầu này. 
                  Thiếu {formatVND(requestAmount - balance)}.
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => createPaymentLinkMutation.mutate()}
                disabled={createPaymentLinkMutation.isPending}
              >
                {createPaymentLinkMutation.isPending ? "Đang tạo..." : "Tạo link thanh toán"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Event Info */}
          <Card>
            <CardHeader>
              <CardTitle>Thông tin sự kiện</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-muted-foreground">Mô tả</Label>
                <p className="mt-1">{event.description || "Không có mô tả"}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Thời gian bắt đầu</Label>
                  <p className="mt-1 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(event.startTime), "dd/MM/yyyy HH:mm", { locale: vi })}
                  </p>
                </div>
                {event.endTime && (
                  <div>
                    <Label className="text-muted-foreground">Thời gian kết thúc</Label>
                    <p className="mt-1 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {format(new Date(event.endTime), "dd/MM/yyyy HH:mm", { locale: vi })}
                    </p>
                  </div>
                )}
              </div>
              <div>
                <Label className="text-muted-foreground">Người tạo</Label>
                <p className="mt-1 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {event.createdBy.fullName || event.createdBy.email}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Fund Request Details */}
          <Card>
            <CardHeader>
              <CardTitle>Chi tiết yêu cầu chi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-muted-foreground">Tiêu đề</Label>
                <p className="mt-1 font-medium">{fundRequest.title}</p>
              </div>
              {fundRequest.description && (
                <div>
                  <Label className="text-muted-foreground">Mô tả</Label>
                  <p className="mt-1">{fundRequest.description}</p>
                </div>
              )}
              <div>
                <Label className="text-muted-foreground">Danh sách hạng mục</Label>
                <div className="mt-2 space-y-2">
                  {fundRequest.items?.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{item.name}</p>
                        {item.description && (
                          <p className="text-sm text-muted-foreground">{item.description}</p>
                        )}
                      </div>
                      <p className="font-semibold text-primary">{formatVND(item.amount)}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="pt-4 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold">Tổng cộng</span>
                  <span className="text-2xl font-bold text-primary">
                    {formatVND(requestAmount)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Balance Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Thông tin quỹ
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-muted-foreground">Số dư hiện tại</Label>
                <p className="text-2xl font-bold text-primary mt-1">
                  {formatVND(balance)}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Số tiền yêu cầu</Label>
                <p className="text-xl font-semibold mt-1">
                  {formatVND(requestAmount)}
                </p>
              </div>
              {canApprove && (
                <div>
                  <Label className="text-muted-foreground">Số dư sau khi duyệt</Label>
                  <p className="text-xl font-semibold text-green-600 mt-1">
                    {formatVND(balanceAfter)}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Hành động</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Dialog 
                open={isApproveOpen} 
                onOpenChange={(open) => {
                  setIsApproveOpen(open);
                  if (!open) {
                    // Reset form when dialog closes
                    setProofFile(null);
                    setProofImageUrl('');
                    setProofPreview(null);
                    const fileInput = document.getElementById('proof-file') as HTMLInputElement;
                    if (fileInput) fileInput.value = '';
                  }
                }}
              >
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Duyệt yêu cầu chi</DialogTitle>
                    <DialogDescription>
                      Vui lòng cung cấp hình ảnh chuyển khoản xác nhận
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div>
                      <Label htmlFor="proof-url">Link hình ảnh (nếu có)</Label>
                      <Input
                        id="proof-url"
                        placeholder="https://..."
                        value={proofImageUrl}
                        onChange={(e) => {
                          setProofImageUrl(e.target.value);
                          if (e.target.value) {
                            setProofFile(null);
                            setProofPreview(null);
                          }
                        }}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="proof-file">Hoặc upload file hình ảnh</Label>
                      <div className="mt-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <Input
                            id="proof-file"
                            type="file"
                            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                            onChange={handleFileChange}
                            className="flex-1"
                          />
                        </div>
                        {proofPreview && (
                          <div className="relative border rounded-lg p-2 bg-muted/50">
                            <div className="relative inline-block">
                              <img
                                src={proofPreview}
                                alt="Preview"
                                className="max-h-64 rounded-md object-contain"
                              />
                              <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                                onClick={handleRemoveFile}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                            {proofFile && (
                              <p className="text-xs text-muted-foreground mt-2">
                                {proofFile.name} ({(proofFile.size / 1024 / 1024).toFixed(2)} MB)
                              </p>
                            )}
                          </div>
                        )}
                        {!proofPreview && !proofImageUrl && (
                          <div className="border-2 border-dashed rounded-lg p-8 text-center">
                            <Image className="h-12 w-12 text-muted-foreground mx-auto mb-2 opacity-50" />
                            <p className="text-sm text-muted-foreground">
                              Chọn file hình ảnh để xem trước
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Chấp nhận: JPG, PNG, GIF, WEBP (tối đa 5MB)
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsApproveOpen(false)}>
                      Hủy
                    </Button>
                    <Button 
                      onClick={handleApprove}
                      disabled={approveMutation.isPending}
                    >
                      {approveMutation.isPending ? "Đang xử lý..." : "Xác nhận duyệt"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Từ chối yêu cầu chi</DialogTitle>
                    <DialogDescription>
                      Vui lòng nhập lý do từ chối yêu cầu này
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-4">
                    <Textarea
                      placeholder="Nhập lý do từ chối..."
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      rows={4}
                    />
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsRejectOpen(false)}>
                      Hủy
                    </Button>
                    <Button 
                      variant="destructive"
                      onClick={handleReject}
                      disabled={rejectMutation.isPending}
                    >
                      {rejectMutation.isPending ? "Đang xử lý..." : "Xác nhận từ chối"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Button
                className="w-full"
                onClick={() => setIsApproveOpen(true)}
                disabled={!canApprove || approveMutation.isPending}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Duyệt yêu cầu
              </Button>
              <Button
                variant="destructive"
                className="w-full"
                onClick={() => setIsRejectOpen(true)}
                disabled={rejectMutation.isPending}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Từ chối
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

