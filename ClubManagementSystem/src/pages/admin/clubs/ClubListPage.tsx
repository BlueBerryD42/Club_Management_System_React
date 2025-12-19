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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Search, MoreHorizontal, Loader2, Tent, Users, RefreshCw, Eye, Edit, Ban, CheckCircle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { clubApi } from "@/services/club.service";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

// Edit Club Schema
const editClubSchema = z.object({
  name: z.string().min(3, "Tên CLB phải có ít nhất 3 ký tự"),
  description: z.string().min(20, "Mô tả phải chi tiết hơn (tối thiểu 20 ký tự)"),
  slug: z.string().optional(),
  logoUrl: z.string().url("Logo phải là URL hợp lệ").optional().or(z.literal("")),
});

type EditClubFormValues = z.infer<typeof editClubSchema>;

interface Club {
  id: string;
  name: string;
  description?: string;
  slug: string;
  category: string;
  leader: string;
  leaderAvatar?: string;
  members: number;
  status: 'active' | 'inactive';
  logoUrl?: string;
}

const ClubListPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [editClubDialog, setEditClubDialog] = useState<{ open: boolean; club: Club | null }>({ open: false, club: null });

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Form for editing club
  const editForm = useForm<EditClubFormValues>({
    resolver: zodResolver(editClubSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      description: "",
      slug: "",
      logoUrl: "",
    }
  });

  // Fetch Clubs from backend API
  const { data: clubsData, isLoading, refetch } = useQuery({
    queryKey: ['admin-clubs', debouncedSearch],
    queryFn: async () => {
      const response = await clubApi.getAll({ search: debouncedSearch || undefined });
      return response.data;
    }
  });

  // Map backend data to frontend format
  const clubs = clubsData?.data?.map((club: any) => ({
    id: club.id,
    name: club.name,
    description: club.description,
    category: club.description?.substring(0, 50) || 'Chưa phân loại',
    leader: club.leader?.fullName || 'Chưa có',
    leaderAvatar: club.leader?.avatarUrl,
    members: club._count?.memberships || 0,
    status: 'active',
    slug: club.slug,
    logoUrl: club.logoUrl
  })) || [];

  // Toggle Club Status Mutation
  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number | string, status: 'active' | 'inactive' }) =>
      clubApi.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-clubs'] });
      toast({ title: "Cập nhật thành công", description: "Trạng thái CLB đã được thay đổi." });
    },
    onError: () => {
      toast({ title: "Lỗi", description: "Không thể cập nhật trạng thái.", variant: "destructive" });
    }
  });

  // Update Club Mutation
  const updateClubMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: EditClubFormValues }) =>
      clubApi.update(id, data),
    onSuccess: (_res, variables) => {
      // Close dialog
      setEditClubDialog({ open: false, club: null });

      // Optimistically update cache so UI reflects changes immediately
      queryClient.setQueryData(['admin-clubs', debouncedSearch], (oldData: any) => {
        if (!oldData?.data) return oldData;
        const updatedList = oldData.data.map((club: any) => {
          if (club.id !== variables.id) return club;
          return {
            ...club,
            name: variables.data.name ?? club.name,
            description: variables.data.description ?? club.description,
            slug: variables.data.slug ?? club.slug,
            logoUrl: variables.data.logoUrl ?? club.logoUrl,
          };
        });
        return { ...oldData, data: updatedList };
      });

      // Force refetch to get canonical data from server
      queryClient.invalidateQueries({ queryKey: ['admin-clubs'], exact: false });
      queryClient.refetchQueries({ queryKey: ['admin-clubs'], exact: false });

      toast({ title: "Thành công", description: "Thông tin CLB đã được cập nhật." });
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || "Không thể cập nhật CLB.";
      toast({ title: "Lỗi", description: errorMessage, variant: "destructive" });
    }
  });

  const handleToggleStatus = (id: number | string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    toggleStatusMutation.mutate({ id, status: newStatus });
  };

  const handleEditClub = (club: Club) => {
    editForm.reset({
      name: club.name,
      description: club.description || "",
      slug: club.slug,
      logoUrl: club.logoUrl || "",
    });
    setEditClubDialog({ open: true, club });
  };

  const handleSaveEditClub = (data: EditClubFormValues) => {
    if (editClubDialog.club) {
      updateClubMutation.mutate({ id: editClubDialog.club.id, data });
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const filteredClubs = clubs;
  const activeClubs = clubs.filter((c: any) => c.status === 'active').length;
  const totalMembers = clubs.reduce((acc: number, c: any) => acc + c.members, 0);

  return (
    <div className="space-y-6">
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
            Quản lý Câu lạc bộ
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Quản lý danh sách và trạng thái hoạt động của các CLB trong hệ thống.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => refetch()} className="rounded-xl">
            <RefreshCw className="h-4 w-4 mr-2" />
            Làm mới
          </Button>
          <Button size="sm" className="rounded-xl bg-primary hover:bg-primary/90" onClick={() => navigate("/admin/clubs/create")}>
            <Plus className="h-4 w-4 mr-2" />
            Tạo CLB mới
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-0 shadow-md bg-gradient-to-br from-primary/10 to-transparent">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center">
                <Tent className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-primary">{clubs.length}</p>
                <p className="text-sm text-muted-foreground">Tổng số CLB</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md bg-gradient-to-br from-emerald-500/10 to-transparent">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-600">{activeClubs}</p>
                <p className="text-sm text-muted-foreground">Đang hoạt động</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md bg-gradient-to-br from-blue-500/10 to-transparent">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">{totalMembers}</p>
                <p className="text-sm text-muted-foreground">Tổng thành viên</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search Bar */}
      <Card className="border-0 shadow-md">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm theo tên CLB..."
                className="pl-10 rounded-xl border-slate-200 focus:border-primary"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Badge variant="secondary" className="rounded-full px-4 py-2">
              {filteredClubs.length} kết quả
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Table Card */}
      <Card className="border-0 shadow-lg overflow-hidden">
        <CardHeader className="bg-slate-50 border-b">
          <CardTitle className="text-lg">Danh sách Câu lạc bộ</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/50">
                <TableHead className="font-semibold">Câu lạc bộ</TableHead>
                <TableHead className="font-semibold">Chủ nhiệm</TableHead>
                <TableHead className="text-center font-semibold">Thành viên</TableHead>
                <TableHead className="font-semibold">Trạng thái</TableHead>
                <TableHead className="text-right font-semibold">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-16">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                    <p className="text-sm text-muted-foreground mt-2">Đang tải dữ liệu...</p>
                  </TableCell>
                </TableRow>
              ) : filteredClubs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-16">
                    <Tent className="h-12 w-12 mx-auto text-slate-300" />
                    <p className="text-muted-foreground mt-2">Chưa có câu lạc bộ nào</p>
                  </TableCell>
                </TableRow>
              ) : filteredClubs.map((club: any) => (
                <TableRow key={club.id} className="hover:bg-slate-50/50 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 rounded-xl">
                        <AvatarImage src={club.logoUrl} />
                        <AvatarFallback className="rounded-xl bg-primary/10 text-primary font-bold">
                          {getInitials(club.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-slate-900">{club.name}</p>
                        <p className="text-xs text-muted-foreground truncate max-w-[200px]">{club.category}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-7 w-7">
                        <AvatarImage src={club.leaderAvatar} />
                        <AvatarFallback className="text-xs bg-slate-100">
                          {club.leader ? getInitials(club.leader) : '?'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{club.leader}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary" className="rounded-full font-semibold">
                      {club.members}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={`rounded-full ${club.status === "active"
                          ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-100"
                        }`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full mr-1.5 ${club.status === "active" ? "bg-emerald-500" : "bg-slate-400"}`} />
                      {club.status === "active" ? "Hoạt động" : "Tạm ngưng"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 rounded-xl">
                        <DropdownMenuLabel>Thao tác</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => navigate(`/admin/clubs/${club.slug || club.id}`)}
                          className="cursor-pointer"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Xem chi tiết
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleEditClub(club as Club)}
                          className="cursor-pointer"
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Chỉnh sửa
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className={`cursor-pointer ${club.status === "active" ? "text-red-600" : "text-emerald-600"}`}
                          onClick={() => handleToggleStatus(club.id, club.status)}
                        >
                          {club.status === "active" ? (
                            <>
                              <Ban className="h-4 w-4 mr-2" />
                              Vô hiệu hóa
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Kích hoạt lại
                            </>
                          )}
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

      {/* Edit Club Dialog */}
      <Dialog open={editClubDialog.open} onOpenChange={(open) => setEditClubDialog({ ...editClubDialog, open })}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa Câu lạc bộ</DialogTitle>
            <DialogDescription>
              Cập nhật thông tin cho {editClubDialog.club?.name}
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleSaveEditClub)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tên Câu lạc bộ <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder="Ví dụ: CLB Guitar FPT" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mô tả <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Textarea placeholder="Mô tả chi tiết về CLB..." className="min-h-[120px]" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Slug (URL tùy chỉnh)</FormLabel>
                    <FormControl>
                      <Input placeholder="Ví dụ: clb-lop-thay-sang" {...field} />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Để trống nếu muốn tự động tạo từ tên CLB
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="logoUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Logo URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://..." {...field} />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Dán đường dẫn ảnh logo (để trống nếu chưa có)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditClubDialog({ open: false, club: null })}
                  disabled={updateClubMutation.isPending}
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  disabled={updateClubMutation.isPending}
                >
                  {updateClubMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Đang lưu...
                    </>
                  ) : (
                    'Lưu thay đổi'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClubListPage;

