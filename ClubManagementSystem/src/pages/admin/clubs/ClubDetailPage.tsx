import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { clubApi } from "@/services/club.service";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, Edit2, Save, MoreHorizontal, User, Crown, Wallet } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const ClubDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({ name: "", description: "" });

    // Fetch club details from backend
    const { data: clubData, isLoading } = useQuery({
        queryKey: ['admin-club-detail', id],
        queryFn: async () => {
            const response = await clubApi.getById(id!);
            return response.data;
        },
        enabled: !!id
    });

    // Fetch club members - use actual club ID from clubData, not slug
    const { data: membersData } = useQuery({
        queryKey: ['club-members', clubData?.data?.id],
        queryFn: async () => {
            const response = await clubApi.getMembers(clubData!.data.id);
            return response.data;
        },
        enabled: !!clubData?.data?.id
    });

    // Map backend data to frontend format
    const club = clubData?.data ? (() => {
        const members = membersData?.data?.map((m: any) => ({
            id: m.user?.id || m.userId,
            name: m.user?.fullName || m.user?.email || 'Unknown',
            email: m.user?.email || '',
            role: m.role?.toLowerCase() || 'member',
            status: 'active'
        })) || [];

        // Find treasurer from members list
        const treasurerMember = membersData?.data?.find((m: any) => m.role === 'TREASURER');

        return {
            id: clubData.data.id,
            name: clubData.data.name,
            category: clubData.data.description?.substring(0, 50) || 'Chưa phân loại',
            type: 'free',
            status: 'active',
            description: clubData.data.description || '',
            leader: {
                id: clubData.data.leader?.id || '',
                name: clubData.data.leader?.fullName || 'Chưa có',
                email: clubData.data.leader?.email || '',
                avatar: clubData.data.leader?.avatarUrl || ''
            },
            treasurer: treasurerMember ? {
                id: treasurerMember.user?.id || '',
                name: treasurerMember.user?.fullName || treasurerMember.user?.email || 'Chưa có',
                email: treasurerMember.user?.email || '',
                avatar: treasurerMember.user?.avatarUrl || ''
            } : {
                id: '',
                name: 'Chưa có',
                email: '',
                avatar: ''
            },
            membersCount: clubData.data._count?.memberships || 0,
            members
        };
    })() : null;

    // Update form when data loads
    if (club && !editForm.name) {
        setEditForm({ name: club.name, description: club.description });
    }

    const updateMutation = useMutation({
        mutationFn: () => clubApi.update(id!, editForm),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-club-detail', id] });
            toast({ title: "Thành công", description: "Đã cập nhật thông tin CLB." });
            setIsEditing(false);
        },
        onError: () => toast({ title: "Lỗi", description: "Không thể cập nhật.", variant: "destructive" })
    });

    const handleSave = () => {
        updateMutation.mutate();
    };

    const handlePromote = (_userId: string, _role: string) => {
        toast({ title: "Thông báo", description: "Tính năng cập nhật vai trò đang phát triển" });
    };

    if (isLoading || !club) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-muted-foreground">Đang tải...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-20">
            {/* Premium Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => navigate('/admin/clubs')} className="rounded-xl hover:bg-slate-100">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                            Chi tiết Câu lạc bộ
                        </h1>
                        <p className="text-sm text-muted-foreground mt-0.5">Quản lý thông tin và thành viên CLB.</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    {isEditing ? (
                        <>
                            <Button variant="outline" onClick={() => setIsEditing(false)} className="rounded-xl">Hủy</Button>
                            <Button onClick={handleSave} className="rounded-xl bg-primary hover:bg-primary/90">
                                <Save className="mr-2 h-4 w-4" /> Lưu thay đổi
                            </Button>
                        </>
                    ) : (
                        <Button onClick={() => setIsEditing(true)} className="rounded-xl">
                            <Edit2 className="mr-2 h-4 w-4" /> Chỉnh sửa
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Info Card */}
                <Card className="md:col-span-2 border-0 shadow-lg">
                    <CardHeader className="bg-slate-50 border-b rounded-t-xl">
                        <CardTitle className="text-lg">Thông tin chung</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-6">
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="text-sm font-medium text-slate-500">Tên CLB</label>
                                {isEditing ? (
                                    <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="mt-1 rounded-xl" />
                                ) : (
                                    <div className="text-lg font-semibold text-slate-900 mt-1">{club.name}</div>
                                )}
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-500">Lĩnh vực</label>
                                <div className="text-base text-slate-700 mt-1">{club.category}</div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-500">Loại hình</label>
                                <div className="mt-1">
                                    <Badge variant="outline" className="rounded-full bg-slate-50">
                                        {club.type === 'free' ? 'Miễn phí' : 'Có phí'}
                                    </Badge>
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-500">Trạng thái</label>
                                <div className="mt-1">
                                    <Badge className={`rounded-full ${club.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                                        <span className={`h-1.5 w-1.5 rounded-full mr-1.5 ${club.status === 'active' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                                        {club.status === 'active' ? 'Hoạt động' : 'Tạm ngưng'}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-slate-500">Mô tả</label>
                            {isEditing ? (
                                <Input value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} className="mt-1 rounded-xl" />
                            ) : (
                                <p className="text-sm text-slate-600 mt-1">{club.description}</p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Key Roles */}
                <div className="space-y-6">
                    <Card className="border-0 shadow-lg">
                        <CardHeader className="bg-gradient-to-r from-primary/5 to-orange-50 border-b rounded-t-xl">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Crown className="h-5 w-5 text-primary" />
                                Ban chủ nhiệm
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-4">
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-yellow-50 border border-yellow-100">
                                <Avatar className="h-10 w-10 border-2 border-yellow-300">
                                    <AvatarFallback className="bg-yellow-400 text-white font-bold">L</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="text-xs font-medium text-yellow-700">Chủ nhiệm</p>
                                    <p className="text-sm font-semibold text-slate-900">{club.leader.name}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                                <Avatar className="h-10 w-10 border-2 border-emerald-300">
                                    <AvatarFallback className="bg-emerald-500 text-white font-bold">T</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="text-xs font-medium text-emerald-700">Thủ quỹ</p>
                                    <p className="text-sm font-semibold text-slate-900">{club.treasurer.name}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Members List */}
            <Card className="border-0 shadow-lg overflow-hidden">
                <CardHeader className="bg-slate-50 border-b">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <User className="h-5 w-5 text-slate-600" />
                        Danh sách thành viên
                        <Badge variant="secondary" className="ml-2 rounded-full">{club.membersCount}</Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50/50">
                                <TableHead className="font-semibold">Họ và Tên</TableHead>
                                <TableHead className="font-semibold">Email</TableHead>
                                <TableHead className="font-semibold">Vai trò</TableHead>
                                <TableHead className="text-right font-semibold">Thao tác</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {club.members.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-12">
                                        <User className="h-10 w-10 mx-auto text-slate-300 mb-2" />
                                        <p className="text-muted-foreground">Chưa có thành viên nào</p>
                                    </TableCell>
                                </TableRow>
                            ) : club.members.map((member: { id: string; name: string; email: string; role: string; status: string }) => (
                                <TableRow key={member.id} className="hover:bg-slate-50/50 transition-colors">
                                    <TableCell className="font-medium">{member.name}</TableCell>
                                    <TableCell className="text-slate-600">{member.email}</TableCell>
                                    <TableCell>
                                        {member.role === 'leader' && (
                                            <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100 rounded-full">
                                                <Crown className="w-3 h-3 mr-1" /> Chủ nhiệm
                                            </Badge>
                                        )}
                                        {member.role === 'treasurer' && (
                                            <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 rounded-full">
                                                <Wallet className="w-3 h-3 mr-1" /> Thủ quỹ
                                            </Badge>
                                        )}
                                        {member.role === 'member' && (
                                            <Badge variant="outline" className="rounded-full">
                                                <User className="w-3 h-3 mr-1" /> Thành viên
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="rounded-xl w-48">
                                                <DropdownMenuLabel>Phân quyền</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => handlePromote(member.id, 'leader')} className="cursor-pointer">
                                                    <Crown className="h-4 w-4 mr-2 text-yellow-500" />
                                                    Bổ nhiệm Chủ nhiệm
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handlePromote(member.id, 'treasurer')} className="cursor-pointer">
                                                    <Wallet className="h-4 w-4 mr-2 text-emerald-500" />
                                                    Bổ nhiệm Thủ quỹ
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handlePromote(member.id, 'member')} className="cursor-pointer">
                                                    <User className="h-4 w-4 mr-2" />
                                                    Xuống làm Thành viên
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
};

export default ClubDetailPage;


