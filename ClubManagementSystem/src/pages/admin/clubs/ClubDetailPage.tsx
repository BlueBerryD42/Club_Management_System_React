import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminService } from "@/services/admin.service";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, Edit2, Save, MoreHorizontal, User, Crown, Wallet } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

// Mock Data
const mockClub = {
    id: "1",
    name: "CLB Guitar",
    category: "Nghệ thuật",
    type: "free",
    status: "active",
    description: "Nơi hội tụ những trái tim yêu âm nhạc và cây đàn guitar.",
    leader: { id: "u1", name: "Nguyễn Văn A", email: "a.nguyen@student.edu", avatar: "" },
    treasurer: { id: "u2", name: "Trần Thị B", email: "b.tran@student.edu", avatar: "" },
    membersCount: 45,
    members: [
        { id: "u1", name: "Nguyễn Văn A", email: "a.nguyen@student.edu", role: "leader", status: "active" },
        { id: "u2", name: "Trần Thị B", email: "b.tran@student.edu", role: "treasurer", status: "active" },
        { id: "u3", name: "Lê Văn C", email: "c.le@student.edu", role: "member", status: "active" },
        // ... more members
    ]
};

const ClubDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({ name: "", description: "" });

    const { data: club = mockClub } = useQuery({
        queryKey: ['admin-club-detail', id],
        queryFn: async () => {
            try {
                // return await adminService.getClubDetails(id!);
                const data = mockClub; // Mock
                setEditForm({ name: data.name, description: data.description });
                return data;
            } catch (error) {
                console.error(error);
                return mockClub;
            }
        }
    });

    const updateMutation = useMutation({
        mutationFn: () => adminService.updateClubInfo(id!, editForm),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-club-detail', id] });
            toast({ title: "Thành công", description: "Đã cập nhật thông tin CLB." });
            setIsEditing(false);
        },
        onError: () => toast({ title: "Lỗi", description: "Không thể cập nhật.", variant: "destructive" })
    });

    const roleMutation = useMutation({
        mutationFn: ({ userId, role }: { userId: string, role: string }) => 
            adminService.promoteMember(id!, userId, role),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-club-detail', id] });
            toast({ title: "Thành công", description: "Đã cập nhật vai trò thành viên." });
        }
    });

    const handleSave = () => {
        // updateMutation.mutate();
        console.log("Mock update", updateMutation);
        toast({ title: "Simulation", description: "Updating club info..." });
        setIsEditing(false);
    };

    const handlePromote = (userId: string, role: string) => {
        // roleMutation.mutate({ userId, role });
        console.log("Mock promote", roleMutation);
        toast({ title: "Simulation", description: `Promoting user ${userId} to ${role}` });
    };

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
                            {club.members.map((member) => (
                                <TableRow key={member.id}>
                                    <TableCell className="font-medium">{member.name}</TableCell>
                                    <TableCell>{member.email}</TableCell>
                                    <TableCell>
                                        {member.role === 'leader' && <Badge className="bg-yellow-500"><Crown className="w-3 h-3 mr-1"/> Leader</Badge>}
                                        {member.role === 'treasurer' && <Badge className="bg-green-500"><Wallet className="w-3 h-3 mr-1"/> Treasurer</Badge>}
                                        {member.role === 'member' && <Badge variant="outline"><User className="w-3 h-3 mr-1"/> Member</Badge>}
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

