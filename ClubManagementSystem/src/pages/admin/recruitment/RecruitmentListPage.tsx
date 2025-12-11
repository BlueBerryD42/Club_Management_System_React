import { useState } from 'react';
import { useQuery } from "@tanstack/react-query";
// import { adminService } from "@/services/admin.service";
import { useNavigate } from "react-router-dom";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, FileSpreadsheet, Clock, CheckCircle2, XCircle, ArrowRight } from "lucide-react";

// Mock Data
const mockSubmissions = [
    { id: "REC-001", clubName: "CLB Guitar", semester: "Fall 2024", candidates: 45, status: "pending", date: "2024-08-15" },
    { id: "REC-002", clubName: "CLB Lập trình", semester: "Fall 2024", candidates: 120, status: "approved", date: "2024-08-10" },
    { id: "REC-003", clubName: "CLB Bóng rổ", semester: "Summer 2024", candidates: 30, status: "rejected", date: "2024-05-20" },
];

const RecruitmentListPage = () => {
    const navigate = useNavigate();
    const [statusFilter, setStatusFilter] = useState("all");

    const { data: submissions = mockSubmissions } = useQuery({
        queryKey: ['admin-recruitment', statusFilter],
        queryFn: async () => {
            try {
                // return await adminService.getRecruitmentSubmissions(statusFilter === 'all' ? undefined : statusFilter);
                return mockSubmissions.filter(s => statusFilter === "all" || s.status === statusFilter);
            } catch (error) {
                console.error(error);
                return [];
            }
        }
    });

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Tuyển thành viên</h2>
                    <p className="text-muted-foreground">Phê duyệt danh sách thành viên mới từ các CLB.</p>
                </div>
                <Button onClick={() => navigate("/admin/recruitment/import")}>
                    <FileSpreadsheet className="mr-2 h-4 w-4" /> Import Excel
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Đang chờ duyệt</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">5</div>
                        <p className="text-xs text-muted-foreground">Yêu cầu cần xử lý</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Thành viên mới (Tháng này)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">342</div>
                        <p className="text-xs text-muted-foreground text-green-600">+12% so với tháng trước</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Tổng đợt tuyển</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">12</div>
                        <p className="text-xs text-muted-foreground">Trong học kỳ này</p>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="all" className="w-full" onValueChange={setStatusFilter}>
                <TabsList>
                    <TabsTrigger value="all">Tất cả</TabsTrigger>
                    <TabsTrigger value="pending" className="flex items-center gap-2">
                        <Clock className="h-3 w-3" /> Chờ duyệt
                    </TabsTrigger>
                    <TabsTrigger value="approved" className="flex items-center gap-2">
                        <CheckCircle2 className="h-3 w-3" /> Đã duyệt
                    </TabsTrigger>
                    <TabsTrigger value="rejected" className="flex items-center gap-2">
                        <XCircle className="h-3 w-3" /> Từ chối
                    </TabsTrigger>
                </TabsList>

                <TabsContent value={statusFilter} className="mt-4">
                    <div className="rounded-md border bg-white">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Mã Đợt</TableHead>
                                    <TableHead>Câu lạc bộ</TableHead>
                                    <TableHead>Học kỳ</TableHead>
                                    <TableHead className="text-center">Số lượng ứng viên</TableHead>
                                    <TableHead>Ngày gửi</TableHead>
                                    <TableHead>Trạng thái</TableHead>
                                    <TableHead className="text-right">Thao tác</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {submissions.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                            Không có dữ liệu.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    submissions.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell className="font-medium">{item.id}</TableCell>
                                            <TableCell>{item.clubName}</TableCell>
                                            <TableCell>{item.semester}</TableCell>
                                            <TableCell className="text-center">
                                                <Badge variant="secondary" className="font-normal">
                                                    <Users className="mr-1 h-3 w-3" /> {item.candidates}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{item.date}</TableCell>
                                            <TableCell>
                                                {item.status === 'approved' && <Badge className="bg-green-600">Đã duyệt</Badge>}
                                                {item.status === 'rejected' && <Badge variant="destructive">Từ chối</Badge>}
                                                {item.status === 'pending' && <Badge variant="secondary">Chờ duyệt</Badge>}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="sm" onClick={() => navigate(`/admin/recruitment/${item.id}`)}>
                                                    Xem chi tiết <ArrowRight className="ml-1 h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default RecruitmentListPage;

