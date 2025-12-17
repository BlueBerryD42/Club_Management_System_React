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
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate('/admin/clubs')}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Chi tiết Câu lạc bộ</h2>
                    <p className="text-muted-foreground text-sm">Quản lý thông tin và thành viên.</p>
                </div>
                <div className="ml-auto flex gap-2">
                    {isEditing ? (
                        <>
                            <Button variant="outline" onClick={() => setIsEditing(false)}>Hủy</Button>
                            <Button onClick={handleSave}><Save className="mr-2 h-4 w-4" /> Lưu thay đổi</Button>
                        </>
                    ) : (
                        <Button onClick={() => setIsEditing(true)}><Edit2 className="mr-2 h-4 w-4" /> Chỉnh sửa</Button>
                    )}
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Info Card */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Thông tin chung</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Tên CLB</label>
                                {isEditing ? (
                                    <Input value={editForm.name} onChange={(e) => setEditForm({...editForm, name: e.target.value})} />
                                ) : (
                                    <div className="text-lg font-semibold">{club.name}</div>
                                )}
                            </div>
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Lĩnh vực</label>
                                <div className="text-base">{club.category}</div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Loại hình</label>
                                <div><Badge variant="outline">{club.type === 'free' ? 'Miễn phí' : 'Có phí'}</Badge></div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Trạng thái</label>
                                <div><Badge className={club.status === 'active' ? 'bg-green-600' : 'bg-muted'}>{club.status}</Badge></div>
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">Mô tả</label>
                            {isEditing ? (
                                <Input value={editForm.description} onChange={(e) => setEditForm({...editForm, description: e.target.value})} />
                            ) : (
                                <p className="text-sm mt-1">{club.description}</p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Key Roles */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Ban chủ nhiệm</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-3">
                                <Avatar>
                                    <AvatarFallback>L</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="text-sm font-medium">Chủ nhiệm</p>
                                    <p className="text-sm text-muted-foreground">{club.leader.name}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Avatar>
                                    <AvatarFallback>T</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="text-sm font-medium">Thủ quỹ</p>
                                    <p className="text-sm text-muted-foreground">{club.treasurer.name}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Members List */}
            <Card>
                <CardHeader>
                    <CardTitle>Danh sách thành viên ({club.membersCount})</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Họ và Tên</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Vai trò</TableHead>
                                <TableHead className="text-right">Thao tác</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {club.members.map((member: { id: string; name: string; email: string; role: string; status: string }) => (
                                <TableRow key={member.id}>
                                    <TableCell className="font-medium">{member.name}</TableCell>
                                    <TableCell>{member.email}</TableCell>
                                    <TableCell>
                                        {member.role === 'leader' && <Badge className="bg-yellow-500"><Crown className="w-3 h-3 mr-1"/> Chủ nhiệm</Badge>}
                                        {member.role === 'treasurer' && <Badge className="bg-green-500"><Wallet className="w-3 h-3 mr-1"/> Thủ quỹ</Badge>}
                                        {member.role === 'member' && <Badge variant="outline"><User className="w-3 h-3 mr-1"/> Thành viên</Badge>}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Phân quyền</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => handlePromote(member.id, 'leader')}>
                                                    Bổ nhiệm Chủ nhiệm
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handlePromote(member.id, 'treasurer')}>
                                                    Bổ nhiệm Thủ quỹ
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handlePromote(member.id, 'member')}>
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

