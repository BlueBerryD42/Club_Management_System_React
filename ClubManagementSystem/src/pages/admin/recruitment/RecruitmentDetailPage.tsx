import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminService } from "@/services/admin.service";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, CheckCircle2, XCircle } from "lucide-react";

// Mock Data
const mockRecruitmentDetail = {
    id: "REC-001",
    clubName: "CLB Guitar",
    semester: "Fall 2024",
    submittedBy: "Trần Thị B (Chủ nhiệm)",
    status: "pending",
    date: "2024-08-15",
    description: "Danh sách trúng tuyển đợt 1 năm học 2024-2025. Đã hoàn thành phỏng vấn và kiểm tra kỹ năng.",
    candidates: [
        { id: 1, name: "Nguyễn Văn X", email: "x.nguyen@student.university.edu", phone: "0901234567", major: "CNTT", role: "Member" },
        { id: 2, name: "Lê Thị Y", email: "y.le@student.university.edu", phone: "0909876543", major: "Kinh tế", role: "Member" },
        { id: 3, name: "Phạm Văn Z", email: "z.pham@student.university.edu", phone: "0912345678", major: "Ngôn ngữ Anh", role: "Member" },
        // ... more candidates
    ]
};

const RecruitmentDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [rejectReason, setRejectReason] = useState("");
    const [isRejectOpen, setIsRejectOpen] = useState(false);

    const { data: submission = mockRecruitmentDetail } = useQuery({
        queryKey: ['admin-recruitment-detail', id],
        queryFn: async () => {
            try {
                // return await adminService.getRecruitmentDetails(id!);
                return mockRecruitmentDetail;
            } catch (error) {
                console.error(error);
                return mockRecruitmentDetail;
            }
        }
    });

    const approveMutation = useMutation({
        mutationFn: () => adminService.approveRecruitment(id!),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-recruitment'] });
            toast({ title: "Thành công", description: "Đã phê duyệt danh sách tuyển thành viên." });
            navigate("/admin/recruitment");
        },
        onError: () => toast({ title: "Lỗi", description: "Không thể phê duyệt.", variant: "destructive" })
    });

    const rejectMutation = useMutation({
        mutationFn: () => adminService.rejectRecruitment(id!, rejectReason),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-recruitment'] });
            toast({ title: "Đã từ chối", description: "Yêu cầu tuyển thành viên đã bị từ chối." });
            setIsRejectOpen(false);
            navigate("/admin/recruitment");
        },
        onError: () => toast({ title: "Lỗi", description: "Không thể từ chối yêu cầu.", variant: "destructive" })
    });

    const handleApprove = () => {
        // approveMutation.mutate();
        console.log("Mock approve", approveMutation);
        toast({ title: "Simulation", description: "Approving recruitment list..." });
        navigate("/admin/recruitment");
    };

    const handleReject = () => {
        if (!rejectReason.trim()) return;
        // rejectMutation.mutate();
        console.log("Mock reject", rejectMutation);
        toast({ title: "Simulation", description: `Rejecting recruitment: ${rejectReason}` });
        navigate("/admin/recruitment");
    };

    return (
        <div className="space-y-6 pb-20">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate('/admin/recruitment')}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Chi tiết Đợt tuyển #{id}</h2>
                    <p className="text-muted-foreground text-sm">{submission.clubName} - {submission.semester}</p>
                </div>
                <div className="ml-auto">
                    {submission.status === 'pending' && (
                        <div className="flex gap-2">
                            <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="destructive">
                                        <XCircle className="mr-2 h-4 w-4" /> Từ chối
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Từ chối danh sách</DialogTitle>
                                        <DialogDescription>
                                            Vui lòng nhập lý do từ chối để gửi lại cho CLB chỉnh sửa.
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
                                <CheckCircle2 className="mr-2 h-4 w-4" /> Phê duyệt & Kích hoạt
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Danh sách Ứng viên ({submission.candidates.length})</CardTitle>
                        <CardDescription>Danh sách sinh viên trúng tuyển cần tạo tài khoản.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="border rounded-md">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Họ và Tên</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>SĐT</TableHead>
                                        <TableHead>Ngành</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {submission.candidates.map((candidate) => (
                                        <TableRow key={candidate.id}>
                                            <TableCell className="font-medium">{candidate.name}</TableCell>
                                            <TableCell>{candidate.email}</TableCell>
                                            <TableCell>{candidate.phone}</TableCell>
                                            <TableCell>{candidate.major}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">Thông tin đợt tuyển</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-muted-foreground text-sm">Trạng thái</span>
                                <Badge className={
                                    submission.status === 'approved' ? 'bg-green-600' : 
                                    submission.status === 'rejected' ? 'bg-destructive' : 'bg-yellow-500'
                                }>
                                    {submission.status === 'approved' ? 'Đã duyệt' : 
                                     submission.status === 'rejected' ? 'Đã từ chối' : 'Chờ duyệt'}
                                </Badge>
                            </div>
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-muted-foreground text-sm">Người gửi</span>
                                <span className="text-sm font-medium">{submission.submittedBy}</span>
                            </div>
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-muted-foreground text-sm">Ngày gửi</span>
                                <span className="text-sm font-medium">{submission.date}</span>
                            </div>
                            <div className="pt-2">
                                <span className="text-muted-foreground text-sm block mb-1">Ghi chú:</span>
                                <p className="text-sm bg-muted/50 p-3 rounded-md">{submission.description}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default RecruitmentDetailPage;

