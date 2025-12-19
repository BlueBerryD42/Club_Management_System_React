import { useState } from 'react';
import { useQuery } from "@tanstack/react-query";
import { adminService } from "@/services/admin.service";
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
import { Download, Search, Loader2, ChevronLeft, ChevronRight, Play, Pause } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface AuditLog {
    id: string;
    action: string;
    userEmail: string | null;
    details: string | null;
    ipAddress: string | null;
    createdAt: string;
}

const AuditLogPage = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [actionFilter, setActionFilter] = useState("all");
    const [page, setPage] = useState(1);
    const [live, setLive] = useState(true);
    const limit = 50;
    const { toast } = useToast();

    const { data, isLoading, refetch } = useQuery({
        queryKey: ['admin-audit-logs', actionFilter, searchTerm, page],
        queryFn: async () => {
            try {
                const response = await adminService.getAuditLogs({ 
                    action: actionFilter === 'all' ? undefined : actionFilter,
                    search: searchTerm.trim() || undefined,
                    page,
                    limit
                });
                return response;
            } catch (error) {
                console.error('Failed to fetch audit logs:', error);
                toast({
                    title: "Lỗi",
                    description: "Không thể tải nhật ký hệ thống",
                    variant: "destructive"
                });
                return { data: [], pagination: { page: 1, limit, total: 0, totalPages: 0 } };
            }
        },
        // Live auto-refresh options
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
        refetchInterval: live ? 5000 : undefined,
        keepPreviousData: true,
        staleTime: 0
    });

    const logs: AuditLog[] = data?.data || [];
    const pagination = data?.pagination || { page: 1, limit, total: 0, totalPages: 0 };

    const handleExport = async () => {
        try {
            const response = await adminService.exportAuditLogs({
                action: actionFilter === 'all' ? undefined : actionFilter,
                search: searchTerm.trim() || undefined,
            });
            
            // Create blob and download
            const blob = new Blob([response.data], { 
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
            });
                const url = globalThis.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `audit-logs-${Date.now()}.xlsx`;
            document.body.appendChild(link);
            link.click();
                link.remove();
                globalThis.URL.revokeObjectURL(url);

            toast({
                title: "Thành công",
                description: "Đã xuất nhật ký hệ thống",
            });
        } catch (error) {
            console.error('Export failed:', error);
            toast({
                title: "Lỗi",
                description: "Không thể xuất nhật ký",
                variant: "destructive"
            });
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Nhật ký Hệ thống</h2>
                    <p className="text-muted-foreground">
                        Theo dõi mọi hoạt động quan trọng trong hệ thống. 
                        {pagination.total > 0 && ` Tổng: ${pagination.total} bản ghi`}
                    </p>
                </div>
            </div>

            {/* Controls Row: search + filter on the left, actions on the right */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="flex-1 flex items-center gap-4">
                    <div className="relative w-full max-w-sm">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Tìm kiếm user, nội dung..." 
                        className="pl-8" 
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setPage(1); // Reset to page 1 on search
                        }}
                    />
                    </div>
                    <Select 
                    value={actionFilter} 
                    onValueChange={(val) => {
                        setActionFilter(val);
                        setPage(1); // Reset to page 1 on filter change
                    }}
                >
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Loại hành động" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tất cả</SelectItem>
                        <SelectItem value="LOGIN">Đăng nhập</SelectItem>
                        <SelectItem value="CREATE_CLUB">Tạo CLB</SelectItem>
                        <SelectItem value="UPDATE_CLUB">Cập nhật CLB</SelectItem>
                        <SelectItem value="DELETE_CLUB">Xóa CLB</SelectItem>
                        <SelectItem value="APPROVE_FUND">Duyệt chi</SelectItem>
                        <SelectItem value="BAN_USER">Khóa tài khoản</SelectItem>
                        <SelectItem value="CREATE_EVENT">Tạo sự kiện</SelectItem>
                        <SelectItem value="UPDATE_EVENT">Cập nhật sự kiện</SelectItem>
                    </SelectContent>
                    </Select>
                </div>
                <div className="w-full sm:w-auto flex gap-2">
                    <Button
                        variant={live ? "default" : "outline"}
                        onClick={() => setLive((v) => !v)}
                        disabled={isLoading}
                    >
                        {live ? <Play className="mr-2 h-4 w-4" /> : <Pause className="mr-2 h-4 w-4" />}
                        {live ? "Đang cập nhật" : "Tắt cập nhật"}
                    </Button>
                    <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
                        Làm mới
                    </Button>
                    <Button variant="outline" onClick={handleExport} disabled={isLoading}>
                        <Download className="mr-2 h-4 w-4" /> Xuất Excel
                    </Button>
                </div>
            </div>

            {isLoading && (
                <div className="text-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                </div>
            )}

            {!isLoading && (
                <>
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
                                {logs.map((log) => (
                                    <TableRow key={log.id}>
                                        <TableCell className="whitespace-nowrap text-muted-foreground">
                                            {new Date(log.createdAt).toLocaleString('vi-VN')}
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            {log.userEmail || 'system'}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{log.action}</Badge>
                                        </TableCell>
                                        <TableCell>{log.details || '-'}</TableCell>
                                        <TableCell className="text-muted-foreground text-sm">
                                            {log.ipAddress || '-'}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {logs.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                            Không tìm thấy nhật ký nào.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-muted-foreground">
                                Trang {pagination.page} / {pagination.totalPages}
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={pagination.page === 1}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                    Trước
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                                    disabled={pagination.page === pagination.totalPages}
                                >
                                    Sau
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default AuditLogPage;

