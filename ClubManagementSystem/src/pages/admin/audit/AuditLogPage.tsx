import { useState } from 'react';
import { useQuery } from "@tanstack/react-query";
// import { adminService } from "@/services/admin.service";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Mock Data
const mockLogs = [
    { id: 1, action: "LOGIN", user: "admin@edu.vn", details: "Đăng nhập thành công", ip: "192.168.1.1", time: "2024-03-20 08:30:15" },
    { id: 2, action: "UPDATE_CLUB", user: "admin@edu.vn", details: "Cập nhật thông tin CLB Guitar", ip: "192.168.1.1", time: "2024-03-20 09:15:00" },
    { id: 3, action: "APPROVE_FUND", user: "admin@edu.vn", details: "Duyệt yêu cầu chi #REQ-002", ip: "192.168.1.1", time: "2024-03-19 14:20:45" },
    { id: 4, action: "CREATE_CLUB", user: "system", details: "Tạo CLB mới: CLB AI", ip: "127.0.0.1", time: "2024-03-18 10:00:00" },
    { id: 5, action: "BAN_USER", user: "admin@edu.vn", details: "Khóa tài khoản user #U123", ip: "192.168.1.1", time: "2024-03-17 16:45:30" },
];

const AuditLogPage = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [actionFilter, setActionFilter] = useState("all");

    const { data: logs = mockLogs } = useQuery({
        queryKey: ['admin-audit-logs', actionFilter],
        queryFn: async () => {
            try {
                // return await adminService.getAuditLogs({ action: actionFilter });
                return mockLogs.filter(log => actionFilter === "all" || log.action === actionFilter);
            } catch (error) {
                console.error(error);
                return [];
            }
        }
    });

    const filteredLogs = logs.filter(log => 
        log.user.toLowerCase().includes(searchTerm.toLowerCase()) || 
        log.details.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleExport = () => {
        // adminService.exportAuditLogs();
        console.log("Exporting logs...");
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Nhật ký Hệ thống</h2>
                    <p className="text-muted-foreground">Theo dõi mọi hoạt động quan trọng trong hệ thống.</p>
                </div>
                <Button variant="outline" onClick={handleExport}>
                    <Download className="mr-2 h-4 w-4" /> Xuất Excel
                </Button>
            </div>

            <div className="flex gap-4 items-center">
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Tìm kiếm user, nội dung..." 
                        className="pl-8" 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Select value={actionFilter} onValueChange={setActionFilter}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Loại hành động" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tất cả</SelectItem>
                        <SelectItem value="LOGIN">Đăng nhập</SelectItem>
                        <SelectItem value="UPDATE_CLUB">Cập nhật CLB</SelectItem>
                        <SelectItem value="APPROVE_FUND">Duyệt chi</SelectItem>
                        <SelectItem value="BAN_USER">Khóa tài khoản</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="rounded-md border bg-white">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Thời gian</TableHead>
                            <TableHead>Người thực hiện</TableHead>
                            <TableHead>Hành động</TableHead>
                            <TableHead>Chi tiết</TableHead>
                            <TableHead>IP</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredLogs.map((log) => (
                            <TableRow key={log.id}>
                                <TableCell className="whitespace-nowrap text-muted-foreground">{log.time}</TableCell>
                                <TableCell className="font-medium">{log.user}</TableCell>
                                <TableCell>
                                    <Badge variant="outline">{log.action}</Badge>
                                </TableCell>
                                <TableCell>{log.details}</TableCell>
                                <TableCell className="text-muted-foreground text-sm">{log.ip}</TableCell>
                            </TableRow>
                        ))}
                        {filteredLogs.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                    Không tìm thấy nhật ký nào.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
};

export default AuditLogPage;

