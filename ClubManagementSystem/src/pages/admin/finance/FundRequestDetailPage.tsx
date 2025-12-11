import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminService } from "@/services/admin.service";
import { formatVND } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, User, CheckCircle2, XCircle, ExternalLink } from "lucide-react";

// Mock Detail Data
const mockRequestDetail = { 
    id: "REQ-001", 
    clubName: "CLB Guitar", 
    requester: "Nguyễn Văn A (Chủ nhiệm)",
    title: "Mua sắm thiết bị âm thanh", 
    amount: 15000000, 
    status: "pending", 
    date: "2024-03-15",
    description: "Cần mua thêm 2 loa thùng và 1 mixer để phục vụ cho buổi biểu diễn Acoustic Night sắp tới. Các thiết bị hiện tại đã cũ và hỏng hóc nhiều.",
    proofImage: "https://placehold.co/600x400?text=Invoice+Image",
    history: [
        { date: "2024-03-15 10:00", action: "Đã gửi yêu cầu", user: "Nguyễn Văn A" }
    ]
};

const FundRequestDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [rejectReason, setRejectReason] = useState("");
    const [isRejectOpen, setIsRejectOpen] = useState(false);

    const { data: request = mockRequestDetail } = useQuery({
        queryKey: ['admin-fund-request', id],
        queryFn: async () => {
            try {
                // return await adminService.getFundRequestDetails(id!);
                return mockRequestDetail;
            } catch (error) {
                console.error(error);
                return mockRequestDetail;
            }
        }
    });

    const approveMutation = useMutation({
        mutationFn: () => adminService.approveFundRequest(id!),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-fund-request', id] });
            toast({ title: "Thành công", description: "Đã duyệt yêu cầu chi." });
            navigate("/admin/finance/requests");
        },
        onError: () => toast({ title: "Lỗi", description: "Không thể duyệt yêu cầu.", variant: "destructive" })
    });

    const rejectMutation = useMutation({
        mutationFn: () => adminService.rejectFundRequest(id!, rejectReason),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-fund-request', id] });
            toast({ title: "Đã từ chối", description: "Yêu cầu đã bị từ chối." });
            setIsRejectOpen(false);
            navigate("/admin/finance/requests");
        },
        onError: () => toast({ title: "Lỗi", description: "Không thể từ chối yêu cầu.", variant: "destructive" })
    });

    const handleApprove = () => {
        // approveMutation.mutate();
        console.log("Mock approve", approveMutation);
        toast({ title: "Simulation", description: "Approving request..." });
        navigate("/admin/finance/requests");
    };

    const handleReject = () => {
        if (!rejectReason.trim()) return;
        // rejectMutation.mutate();
        console.log("Mock reject", rejectMutation);
        toast({ title: "Simulation", description: `Rejecting request: ${rejectReason}` });
        navigate("/admin/finance/requests");
    };

    return (
        <div className="space-y-6 pb-20">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate('/admin/finance/requests')}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Chi tiết Yêu cầu #{id}</h2>
                    <p className="text-muted-foreground text-sm">Xem xét và phê duyệt khoản chi.</p>
                </div>
                <div className="ml-auto">
                    {request.status === 'pending' && (
                        <div className="flex gap-2">
                            <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="destructive">
                                        <XCircle className="mr-2 h-4 w-4" /> Từ chối
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Từ chối yêu cầu</DialogTitle>
                                        <DialogDescription>
                                            Vui lòng nhập lý do từ chối để thông báo cho CLB.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <Textarea 
                                        placeholder="Nhập lý do..." 
                                        value={rejectReason}
                                        onChange={(e) => setRejectReason(e.target.value)}
                                    />
                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => setIsRejectOpen(false)}>Hủy</Button>
                                        <Button variant="destructive" onClick={handleReject}>Xác nhận từ chối</Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                            
                            <Button className="bg-green-600 hover:bg-green-700" onClick={handleApprove}>
                                <CheckCircle2 className="mr-2 h-4 w-4" /> Phê duyệt
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Main Info */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle className="text-xl">{request.title}</CardTitle>
                                <CardDescription className="mt-1 flex items-center gap-2">
                                    <User className="h-4 w-4" /> {request.requester} • {request.clubName}
                                </CardDescription>
                            </div>
                            <Badge className={
                                request.status === 'approved' ? 'bg-green-600' : 
                                request.status === 'rejected' ? 'bg-destructive' : 'bg-yellow-500'
                            }>
                                {request.status === 'approved' ? 'Đã duyệt' : 
                                 request.status === 'rejected' ? 'Đã từ chối' : 'Chờ duyệt'}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div>
                            <h3 className="font-semibold mb-2">Mô tả chi tiết</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed bg-muted/30 p-4 rounded-md">
                                {request.description}
                            </p>
                        </div>

                        <div>
                            <h3 className="font-semibold mb-2">Minh chứng / Hóa đơn</h3>
                            <div className="border rounded-md overflow-hidden bg-muted/10">
                                <img src={request.proofImage} alt="Proof" className="w-full h-auto object-cover max-h-[400px]" />
                                <div className="p-3 flex justify-end bg-white border-t">
                                    <Button variant="outline" size="sm">
                                        <ExternalLink className="mr-2 h-4 w-4" /> Xem ảnh gốc
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium text-muted-foreground">Thông tin tài chính</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-green-600 mb-1">
                                {formatVND(request.amount)} VND
                            </div>
                            <p className="text-xs text-muted-foreground">Số tiền đề xuất</p>
                            
                            <div className="mt-6 space-y-3 pt-6 border-t">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Ngày gửi:</span>
                                    <span className="font-medium">{request.date}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Loại chi:</span>
                                    <span className="font-medium">Mua sắm thiết bị</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">Lịch sử xử lý</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {request.history.map((item, index) => (
                                    <div key={index} className="flex gap-3 text-sm relative pb-4 last:pb-0">
                                        <div className="absolute left-[5px] top-2 bottom-0 w-px bg-border last:hidden"></div>
                                        <div className="h-2.5 w-2.5 rounded-full bg-primary mt-1.5 z-10 ring-4 ring-white"></div>
                                        <div>
                                            <p className="font-medium">{item.action}</p>
                                            <p className="text-xs text-muted-foreground">{item.user} • {item.date}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default FundRequestDetailPage;

