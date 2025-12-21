import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from "@tanstack/react-query";
import { clubApi } from "@/services/club.service";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, UserPlus, Trash2, Loader2, ArrowLeft, MoreHorizontal, User, Crown, Wallet } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const addMemberSchema = z.object({
    email: z.string().email("Email không hợp lệ").min(1, "Email là bắt buộc"),
    fullName: z.string().optional(),
    studentCode: z.string().optional(),
    phone: z.string().optional(),
    role: z.enum(["MEMBER", "STAFF", "TREASURER"]),
});

type AddMemberFormValues = z.infer<typeof addMemberSchema>;

const ClubDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
    const [removingMember, setRemovingMember] = useState<{ id: string; name: string } | null>(null);

    const form = useForm<AddMemberFormValues>({
        resolver: zodResolver(addMemberSchema),
        defaultValues: {
            email: "",
            fullName: "",
            studentCode: "",
            phone: "",
            role: "MEMBER",
        },
    });

    const addMemberMutation = useMutation({
        mutationFn: (data: AddMemberFormValues) => clubApi.addMember(club!.id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-club-detail', id] });
            queryClient.invalidateQueries({ queryKey: ['club-members', id] });
            toast({ title: "Thành công", description: "Đã thêm thành viên vào câu lạc bộ" });
            setIsAddMemberOpen(false);
            form.reset();
        },
        onError: (error: any) => {
            const message = error?.response?.data?.message || "Không thể thêm thành viên";
            toast({ title: "Lỗi", description: message, variant: "destructive" });
        }
    });

    const removeMemberMutation = useMutation({
        mutationFn: (membershipId: string) => clubApi.removeMember(club!.id, membershipId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-club-detail', id] });
            queryClient.invalidateQueries({ queryKey: ['club-members', id] });
            toast({ title: "Thành công", description: "Đã xóa thành viên khỏi câu lạc bộ" });
            setRemovingMember(null);
        },
        onError: (error: any) => {
            const message = error?.response?.data?.message || "Không thể xóa thành viên";
            toast({ title: "Lỗi", description: message, variant: "destructive" });
            setRemovingMember(null);
        }
    });

    const onAddMemberSubmit = (data: AddMemberFormValues) => {
        addMemberMutation.mutate(data);
    };

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
        const members: any[] = membersData?.data?.map((m: any) => ({
            id: m.user?.id || m.userId,
            name: m.user?.fullName || m.user?.email || 'Unknown',
            email: m.user?.email || '',
            role: m.role?.toLowerCase() || 'member',
            status: 'active',
            membershipId: m.id
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
                                <div className="text-lg font-semibold text-slate-900 mt-1">{club.name}</div>
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
                            <p className="text-sm text-slate-600 mt-1">{club.description}</p>
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
                    <CardTitle className="text-lg flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                            <User className="h-5 w-5 text-slate-600" />
                            Danh sách thành viên
                            <Badge variant="secondary" className="ml-2 rounded-full">{club.membersCount}</Badge>
                        </div>
                        <Button size="sm" onClick={() => setIsAddMemberOpen(true)} className="rounded-full shadow-sm">
                            <Plus className="h-4 w-4 mr-1" /> Thêm thành viên
                        </Button>
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
                            ) : club.members.map((member: { id: string; name: string; email: string; role: string; status: string; membershipId: string }) => (
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
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    onClick={() => setRemovingMember({ id: member.membershipId, name: member.name })}
                                                    className="cursor-pointer text-destructive focus:text-destructive"
                                                >
                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                    Xóa khỏi CLB
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

            {/* Add Member Dialog */}
            <Dialog open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
                <DialogContent className="sm:max-w-[425px] rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl">
                            <UserPlus className="h-5 w-5 text-primary" />
                            Thêm thành viên mới
                        </DialogTitle>
                        <DialogDescription>
                            Nhập thông tin để thêm thành viên trực tiếp vào câu lạc bộ.
                        </DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onAddMemberSubmit)} className="space-y-4 py-4">
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email *</FormLabel>
                                        <FormControl>
                                            <Input placeholder="student@university.edu.vn" {...field} className="rounded-xl" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="fullName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Họ và tên</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Nguyễn Văn A" {...field} className="rounded-xl" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="studentCode"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>MSSV</FormLabel>
                                            <FormControl>
                                                <Input placeholder="SE123456" {...field} className="rounded-xl" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="phone"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Số điện thoại</FormLabel>
                                            <FormControl>
                                                <Input placeholder="0987654321" {...field} className="rounded-xl" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <FormField
                                control={form.control}
                                name="role"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Vai trò</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="rounded-xl">
                                                    <SelectValue placeholder="Chọn vai trò" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="rounded-xl">
                                                <SelectItem value="MEMBER">Thành viên</SelectItem>
                                                <SelectItem value="STAFF">Nhân viên</SelectItem>
                                                <SelectItem value="TREASURER">Thủ quỹ</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <DialogFooter className="pt-4">
                                <Button type="button" variant="ghost" onClick={() => setIsAddMemberOpen(false)} disabled={addMemberMutation.isPending} className="rounded-xl">
                                    Hủy
                                </Button>
                                <Button type="submit" disabled={addMemberMutation.isPending} className="rounded-xl px-8">
                                    {addMemberMutation.isPending ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Đang xử lý...
                                        </>
                                    ) : (
                                        "Thêm thành viên"
                                    )}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            {/* Remove Member Confirmation */}
            <AlertDialog open={!!removingMember} onOpenChange={(open) => !open && setRemovingMember(null)}>
                <AlertDialogContent className="rounded-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Xác nhận xóa thành viên?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Bạn có chắc chắn muốn xóa <strong>{removingMember?.name}</strong> khỏi câu lạc bộ?
                            Hành động này sẽ thu hồi quyền truy cập của họ ngay lập tức.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={removeMemberMutation.isPending} className="rounded-xl">Hủy</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault();
                                if (removingMember) removeMemberMutation.mutate(removingMember.id);
                            }}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl"
                            disabled={removeMemberMutation.isPending}
                        >
                            {removeMemberMutation.isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Đang xóa...
                                </>
                            ) : (
                                "Xóa thành viên"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default ClubDetailPage;


