import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Check, X, Eye, MessageSquare, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { clubApi } from "@/services/club.service";

interface JoinRequestWithProfile {
  id: string;
  user_id: string;
  message: string | null;
  status: string;
  created_at: string;
  profile: {
    full_name: string;
    email: string;
    student_id: string | null;
  };
}

export default function JoinRequests() {
  const { clubId } = useParams();
  const { toast } = useToast();
  const [requests, setRequests] = useState<JoinRequestWithProfile[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<JoinRequestWithProfile | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [reviewNotes, setReviewNotes] = useState("");
  const [activeTab, setActiveTab] = useState("pending");

  const queryClient = useQueryClient();
  const { data: appsResp } = useQuery({
    queryKey: ["club-applications", clubId],
    queryFn: async () => {
      const res = await clubApi.getClubApplications(clubId!);
      return res.data;
    },
    enabled: !!clubId,
  });

  useEffect(() => {
    const list = (appsResp?.data || []).map((a: any) => ({
      id: a.id,
      user_id: a.userId,
      message: a.introduction || a.message || null,
      status: (a.status || '').toLowerCase(),
      created_at: a.createdAt,
      profile: {
        full_name: a.user?.fullName || a.user?.email,
        email: a.user?.email,
        student_id: a.user?.studentCode || null,
      },
    }));
    setRequests(list);
  }, [appsResp]);

  const reviewMutation = useMutation({
    mutationFn: (vars: { applicationId: string; action: 'approve' | 'reject'; reviewNotes?: string }) =>
      clubApi.reviewApplication(clubId!, vars.applicationId, { action: vars.action, reviewNotes: vars.reviewNotes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["club-applications", clubId] });
    }
  });

  const handleApprove = async (request: JoinRequestWithProfile) => {
    await reviewMutation.mutateAsync({ applicationId: request.id, action: 'approve', reviewNotes: reviewNotes.trim() || undefined });
    toast({ title: "Thành công", description: `Đã duyệt đơn của ${request.profile.full_name}` });
    setShowDetailDialog(false);
    setReviewNotes("");
  };

  const handleReject = async (request: JoinRequestWithProfile) => {
    await reviewMutation.mutateAsync({ applicationId: request.id, action: 'reject', reviewNotes: reviewNotes.trim() || undefined });
    toast({ title: "Đã từ chối", description: `Đã từ chối đơn của ${request.profile.full_name}` });
    setShowDetailDialog(false);
    setReviewNotes("");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-warning/20 text-warning">Chờ duyệt</Badge>;
      case "approved":
        return <Badge className="bg-success/20 text-success">Đã duyệt</Badge>;
      case "rejected":
        return <Badge className="bg-destructive/20 text-destructive">Từ chối</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredRequests = requests.filter((r) => {
    if (activeTab === "all") return true;
    return r.status === activeTab;
  });

  const pendingCount = requests.filter((r) => r.status === "pending").length;

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
          <h1 className="text-3xl font-bold text-foreground">Đơn gia nhập CLB</h1>
          <p className="text-muted-foreground mt-2">Xem xét và duyệt đơn xin gia nhập</p>
        </div>

        <Card>
          <CardHeader>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="pending" className="relative">
                  Chờ duyệt
                  {pendingCount > 0 && (
                    <span className="ml-2 bg-warning text-warning-foreground px-2 py-0.5 rounded-full text-xs">
                      {pendingCount}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="approved">Đã duyệt</TabsTrigger>
                <TabsTrigger value="rejected">Từ chối</TabsTrigger>
                <TabsTrigger value="all">Tất cả</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Họ tên</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>MSSV</TableHead>
                  <TableHead>Ngày gửi</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Không có đơn nào
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium">{request.profile?.full_name}</TableCell>
                      <TableCell>{request.profile?.email}</TableCell>
                      <TableCell>{request.profile?.student_id || "-"}</TableCell>
                      <TableCell>{new Date(request.created_at).toLocaleDateString("vi-VN")}</TableCell>
                      <TableCell>{getStatusBadge(request.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => { setSelectedRequest(request); setShowDetailDialog(true); }}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          {request.status === "pending" && (
                            <>
                              <Button variant="ghost" size="icon" className="text-success" onClick={() => handleApprove(request)}>
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleReject(request)}>
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Chi tiết đơn gia nhập</DialogTitle>
              <DialogDescription>Thông tin chi tiết của ứng viên</DialogDescription>
            </DialogHeader>
            {selectedRequest && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Họ tên</p>
                    <p className="font-medium">{selectedRequest.profile?.full_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{selectedRequest.profile?.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">MSSV</p>
                    <p className="font-medium">{selectedRequest.profile?.student_id || "-"}</p>
                  </div>
                </div>
                {selectedRequest.message && (
                  <div>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <MessageSquare className="h-4 w-4" />
                      Lời nhắn
                    </p>
                    <p className="mt-1 p-3 bg-muted rounded-lg">{selectedRequest.message}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Trạng thái</p>
                  {getStatusBadge(selectedRequest.status)}
                </div>
                {selectedRequest?.status === "pending" && (
                  <div className="space-y-2">
                    <Label htmlFor="reviewNotes">Ghi chú duyệt (tuỳ chọn)</Label>
                    <Textarea
                      id="reviewNotes"
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      placeholder="Nhập ghi chú cho lý do duyệt hoặc từ chối..."
                      rows={3}
                    />
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              {selectedRequest?.status === "pending" && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => handleReject(selectedRequest)}
                    disabled={reviewMutation.isPending}
                  >
                    {reviewMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <X className="mr-2 h-4 w-4" />
                    )}
                    Từ chối
                  </Button>
                  <Button
                    onClick={() => handleApprove(selectedRequest)}
                    className="bg-success hover:bg-success/90"
                    disabled={reviewMutation.isPending}
                  >
                    {reviewMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="mr-2 h-4 w-4" />
                    )}
                    Duyệt
                  </Button>
                </>
              )}
              {selectedRequest?.status !== "pending" && (
                <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
                  Đóng
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
