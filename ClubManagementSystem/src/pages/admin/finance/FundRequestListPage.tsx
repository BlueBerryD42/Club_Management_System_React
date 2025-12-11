import { useState } from 'react';
import { useQuery } from "@tanstack/react-query";
// import { adminService } from "@/services/admin.service";
import { formatVND } from "@/lib/utils";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, CheckCircle2, XCircle, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";

// Mock Data
const mockRequests = [
    { id: "REQ-001", clubName: "CLB Guitar", title: "Mua sắm thiết bị âm thanh", amount: 15000000, status: "pending", date: "2024-03-15" },
    { id: "REQ-002", clubName: "CLB Lập trình", title: "Tổ chức Hackathon 2024", amount: 5000000, status: "approved", date: "2024-03-10" },
    { id: "REQ-003", clubName: "CLB Tình nguyện", title: "Chi phí đi lại Mùa hè xanh", amount: 25000000, status: "rejected", date: "2024-03-05" },
    { id: "REQ-004", clubName: "CLB Truyền thông", title: "In ấn banner sự kiện", amount: 2000000, status: "pending", date: "2024-03-18" },
];

const FundRequestListPage = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    const { data: requests = mockRequests } = useQuery({
        queryKey: ['admin-fund-requests', statusFilter],
        queryFn: async () => {
            try {
                // return await adminService.getFundRequests({ status: statusFilter });
                return mockRequests.filter(r => statusFilter === "all" || r.status === statusFilter);
            } catch (error) {
                console.error(error);
                return [];
            }
        }
    });

    const filteredRequests = requests.filter(req => 
        req.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.clubName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'approved': return <Badge className="bg-green-600">Đã duyệt</Badge>;
            case 'rejected': return <Badge variant="destructive">Từ chối</Badge>;
            default: return <Badge variant="secondary">Chờ duyệt</Badge>;
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Yêu cầu Duyệt chi</h2>
                <p className="text-muted-foreground">Quản lý và phê duyệt các khoản chi tiêu lớn của CLB.</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Tìm kiếm theo tên CLB, tiêu đề..." 
                        className="pl-8" 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                
                <Tabs defaultValue="all" className="w-full sm:w-auto" onValueChange={setStatusFilter}>
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
                </Tabs>
            </div>

            <div className="rounded-md border bg-white">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Mã YC</TableHead>
                            <TableHead>Câu lạc bộ</TableHead>
                            <TableHead>Nội dung chi</TableHead>
                            <TableHead className="text-right">Số tiền (VND)</TableHead>
                            <TableHead>Ngày gửi</TableHead>
                            <TableHead>Trạng thái</TableHead>
                            <TableHead className="text-right">Thao tác</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredRequests.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                    Không có yêu cầu nào.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredRequests.map((req) => (
                                <TableRow key={req.id}>
                                    <TableCell className="font-medium">{req.id}</TableCell>
                                    <TableCell>{req.clubName}</TableCell>
                                    <TableCell className="max-w-[300px] truncate" title={req.title}>{req.title}</TableCell>
                                    <TableCell className="text-right font-semibold text-green-600">
                                        {formatVND(req.amount)}
                                    </TableCell>
                                    <TableCell>{req.date}</TableCell>
                                    <TableCell>{getStatusBadge(req.status)}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="outline" size="sm" onClick={() => navigate(`/admin/finance/requests/${req.id}`)}>
                                            Xem chi tiết
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
};

export default FundRequestListPage;

