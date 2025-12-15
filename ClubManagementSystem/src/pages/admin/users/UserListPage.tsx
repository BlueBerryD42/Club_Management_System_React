import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { userApi } from "@/services/user.service";
import { adminService } from "@/services/admin.service";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Loader2, MoreHorizontal, Lock, Unlock, KeyRound, Edit } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
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
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: string;
  name: string;
  email: string;
  studentCode: string;
  phone: string;
  status: 'active' | 'suspended';
  createdAt: string;
  role: string;
}

interface PillButtonProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
}

type FilterType = "all" | "active" | "suspended";

// Form schema for editing user
const editUserSchema = z.object({
  fullName: z
    .string()
    .min(2, "Họ tên phải có ít nhất 2 ký tự")
    .max(100, "Họ tên không được vượt quá 100 ký tự")
    .regex(/^[a-zA-ZÀ-ỹ\s]+$/, "Họ tên chỉ được chứa chữ cái và khoảng trắng"),
  email: z
    .string()
    .min(1, "Email không được để trống")
    .email("Email không hợp lệ")
    .max(255, "Email không được vượt quá 255 ký tự"),
  phone: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val || val.trim() === "") return true;
        const trimmed = val.trim();
        return /^(0[3|5|7|8|9])+([0-9]{8})$/.test(trimmed) && trimmed.length === 10;
      },
      {
        message: "Số điện thoại không hợp lệ. Vui lòng nhập số điện thoại Việt Nam (10 số, bắt đầu bằng 0)",
      }
    ),
  studentCode: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val || val.trim() === "") return true;
        const trimmed = val.trim().toUpperCase();
        return /^[A-Z0-9]+$/.test(trimmed) && trimmed.length >= 3;
      },
      {
        message: "Mã số sinh viên không hợp lệ. Phải có ít nhất 3 ký tự và chỉ chứa chữ cái in hoa và số",
      }
    ),
});

type EditUserFormValues = z.infer<typeof editUserSchema>;

const PillButton = ({ label, isActive, onClick }: PillButtonProps) => (
    <button
        onClick={onClick}
        className={cn(
            "px-4 py-1.5 rounded-full text-sm font-medium transition-all",
            isActive 
                ? "bg-primary text-primary-foreground shadow-sm" 
                : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
        )}
    >
        {label}
    </button>
);

const UserListPage = () => {
  const [filter, setFilter] = useState<FilterType>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<string>("name-asc");
  const [resetPasswordDialog, setResetPasswordDialog] = useState<{ open: boolean; userId: string | null; userName: string }>({ open: false, userId: null, userName: '' });
  const [editUserDialog, setEditUserDialog] = useState<{ open: boolean; user: User | null }>({ open: false, user: null });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form for editing user
  const editForm = useForm<EditUserFormValues>({
    resolver: zodResolver(editUserSchema),
    mode: "onChange",
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      studentCode: "",
    }
  });

  // Fetch Users from API
  const { data: users = [], isLoading, error: queryError } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
        try {
            const res = await userApi.getAllUsers();
            console.log('API Response:', res);
            
            // Extract data from response - handle different response structures
            let userData: unknown[] = [];
            if (Array.isArray(res)) {
                userData = res;
            } else if (Array.isArray(res.data)) {
                userData = res.data;
            } else if (res.data?.data && Array.isArray(res.data.data)) {
                userData = res.data.data;
            } else if (res.data?.users && Array.isArray(res.data.users)) {
                userData = res.data.users;
            }
            
            console.log('Extracted User data:', userData);
            
            return userData.map((rawUser) => {
              const user = rawUser as Record<string, unknown>;
              const getValue = (val: unknown): string => {
                if (val === null || val === undefined) return '';
                if (typeof val === 'string') return val;
                if (typeof val === 'number' || typeof val === 'boolean') return String(val);
                return '';
              };
              
              return {
                id: getValue(user.id),
                name: getValue(user.fullName || user.name || user.email || 'Unknown'),
                email: getValue(user.email || ''),
                studentCode: getValue(user.studentCode || user.mssv || '-'),
                phone: getValue(user.phone || user.phoneNumber || '-'),
                status: (user.isActive === false ? 'suspended' : 'active'),
                createdAt: getValue(user.createdAt || new Date().toISOString()),
                role: (user.role === 'ADMIN' || user.role === 'admin') ? 'System Admin' : 'Thành viên'
              } as User;
            });
        } catch (error) {
            console.error('Error fetching users:', error);
            throw error;
        }
    }
  });

  // Toggle User Status Mutation
  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'active' | 'suspended' }) =>
      adminService.updateUserStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast({ title: "Cập nhật thành công", description: "Trạng thái người dùng đã được thay đổi." });
    },
    onError: () => {
      toast({ title: "Lỗi", description: "Không thể cập nhật trạng thái người dùng.", variant: "destructive" });
    }
  });

  // Reset Password Mutation
  const resetPasswordMutation = useMutation({
    mutationFn: (userId: string) => adminService.resetUserPassword(userId),
    onSuccess: (data) => {
      setResetPasswordDialog({ open: false, userId: null, userName: '' });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      const message = data?.data?.newPassword 
        ? `Mật khẩu mới: ${data.data.newPassword}` 
        : "Mật khẩu đã được đặt lại thành công.";
      toast({ title: "Thành công", description: message });
    },
    onError: () => {
      toast({ title: "Lỗi", description: "Không thể đặt lại mật khẩu.", variant: "destructive" });
    }
  });

  // Update User Mutation
  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => {
      console.log('Mutation called with:', { id, data });
      return adminService.updateUser(id, data);
    },
    onSuccess: (response) => {
      console.log('Update user success response:', response);
      setEditUserDialog({ open: false, user: null });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast({ title: "Thành công", description: "Thông tin người dùng đã được cập nhật." });
    },
    onError: (error: any) => {
      console.error('Update user error:', error);
      const errorMessage = error?.response?.data?.message || error?.message || "Không thể cập nhật thông tin người dùng.";
      toast({ title: "Lỗi", description: errorMessage, variant: "destructive" });
    }
  });

  // Handler Functions
  const handleToggleStatus = (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    toggleStatusMutation.mutate({ id: userId, status: newStatus as 'active' | 'suspended' });
  };

  const handleResetPassword = (userId: string, userName: string) => {
    setResetPasswordDialog({ open: true, userId, userName });
  };

  const handleConfirmResetPassword = () => {
    if (resetPasswordDialog.userId) {
      resetPasswordMutation.mutate(resetPasswordDialog.userId);
    }
  };

  const handleEditUser = (user: User) => {
    editForm.reset({
      fullName: user.name,
      email: user.email,
      phone: user.phone,
      studentCode: user.studentCode,
    });
    setEditUserDialog({ open: true, user });
  };

  const handleSaveEditUser = (data: EditUserFormValues) => {
    if (editUserDialog.user) {
      // Trim and transform data before submission
      // Only include fields that have values (avoid sending empty strings)
      const payload: { fullName: string; email: string; phone?: string; studentCode?: string } = {
        fullName: data.fullName.trim(),
        email: data.email.trim().toLowerCase(),
      };
      
      // Only include optional fields if they have values
      if (data.phone?.trim()) {
        payload.phone = data.phone.trim();
      }
      if (data.studentCode?.trim()) {
        payload.studentCode = data.studentCode.trim().toUpperCase();
      }
      
      console.log('Updating user:', { id: editUserDialog.user.id, payload });
      updateUserMutation.mutate({ id: editUserDialog.user.id, data: payload as EditUserFormValues });
    }
  };

  // Filtering and Sorting Logic
  const filteredUsers = users
    .filter((user: User) => {
      // Text Search
      const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            user.email.toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchesSearch) return false;

      // Status Filter
      if (filter === "all") return true;
      if (filter === "active") return user.status === "active";
      if (filter === "suspended") return user.status === "suspended";
      
      return true;
    })
    .sort((a: User, b: User) => {
      const [field, order] = sortBy.split("-");
      const multiplier = order === "asc" ? 1 : -1;

      switch (field) {
        case "name":
          return multiplier * a.name.localeCompare(b.name);
        case "email":
          return multiplier * a.email.localeCompare(b.email);
        case "createdAt":
          return multiplier * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        default:
          return 0;
      }
    });

  const isLoaderVisible = isLoading;
  const isErrorVisible = !isLoading && queryError;
  const isEmptyVisible = !isLoading && !queryError && users.length === 0;
  const isTableVisible = !isLoading && !queryError && users.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Quản lý Người dùng</h2>
        <p className="text-muted-foreground">Danh sách thành viên và phân quyền hệ thống.</p>
      </div>

      <div className="flex flex-col gap-4">
          {/* Search, Filters, and Sort Row */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex-1 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                  {/* Search Bar */}
                  <div className="relative w-full sm:w-auto sm:max-w-sm">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input 
                          placeholder="Tìm kiếm tên, email..." 
                          className="pl-8" 
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                      />
                  </div>

                  {/* Filter Buttons */}
                  <div className="flex flex-wrap gap-2">
                      <PillButton 
                        label="Tất cả" 
                        isActive={filter === "all"}
                        onClick={() => setFilter("all")}
                      />
                      <PillButton 
                        label="Hoạt động" 
                        isActive={filter === "active"}
                        onClick={() => setFilter("active")}
                      />
                      <PillButton 
                        label="Đã khóa" 
                        isActive={filter === "suspended"}
                        onClick={() => setFilter("suspended")}
                      />
                  </div>
              </div>

              {/* Sort Dropdown */}
              <div className="w-full sm:w-auto">
                  <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="w-full sm:w-[180px]">
                          <SelectValue placeholder="Sắp xếp theo" />
                      </SelectTrigger>
                      <SelectContent>
                          <SelectItem value="name-asc">Tên (A-Z)</SelectItem>
                          <SelectItem value="name-desc">Tên (Z-A)</SelectItem>
                          <SelectItem value="email-asc">Email (A-Z)</SelectItem>
                          <SelectItem value="email-desc">Email (Z-A)</SelectItem>
                          <SelectItem value="createdAt-desc">Mới nhất</SelectItem>
                          <SelectItem value="createdAt-asc">Cũ nhất</SelectItem>
                      </SelectContent>
                  </Select>
              </div>
          </div>
      </div>

      <div className="space-y-4">

            {isLoaderVisible && (
                <div className="text-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                </div>
            )}

            {isErrorVisible && (
                <div className="text-center py-10 text-destructive">
                    <p>Lỗi tải dữ liệu: {queryError instanceof Error ? queryError.message : 'Unknown error'}</p>
                </div>
            )}

            {isEmptyVisible && (
                <div className="text-center py-10 text-muted-foreground">
                    <p>Không tìm thấy người dùng nào.</p>
                </div>
            )}

            {isTableVisible && (
                <div className="rounded-md border bg-white">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Họ tên</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>MSSV</TableHead>
                                <TableHead>SĐT</TableHead>
                                <TableHead>Vai trò</TableHead>
                                <TableHead>Trạng thái</TableHead>
                                <TableHead>Ngày tạo</TableHead>
                                <TableHead className="text-right">Thao tác</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredUsers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                                        Không tìm thấy người dùng nào phù hợp.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredUsers.map((user: User) => (
                                    <TableRow key={user.id}>
                                        <TableCell className="font-medium">{user.name}</TableCell>
                                        <TableCell>{user.email}</TableCell>
                                        <TableCell>{user.studentCode}</TableCell>
                                        <TableCell>{user.phone}</TableCell>
                                        <TableCell>
                                            <Badge variant={user.role === 'System Admin' ? 'destructive' : 'outline'}>
                                                {user.role}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                                                {user.status === 'active' ? 'Hoạt động' : 'Đã khóa'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{new Date(user.createdAt).toLocaleDateString('vi-VN')}</TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <span className="sr-only">Open menu</span>
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Thao tác</DropdownMenuLabel>
                                                    <DropdownMenuItem
                                                        onClick={() => handleEditUser(user)}
                                                        disabled={toggleStatusMutation.isPending || resetPasswordMutation.isPending || updateUserMutation.isPending}
                                                    >
                                                        <Edit className="mr-2 h-4 w-4" />
                                                        Chỉnh sửa thông tin
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    {user.status === 'active' ? (
                                                        <DropdownMenuItem
                                                            className="text-destructive"
                                                            onClick={() => handleToggleStatus(user.id, user.status)}
                                                            disabled={toggleStatusMutation.isPending || resetPasswordMutation.isPending || updateUserMutation.isPending}
                                                        >
                                                            <Lock className="mr-2 h-4 w-4" />
                                                            Vô hiệu hóa tài khoản
                                                        </DropdownMenuItem>
                                                    ) : (
                                                        <DropdownMenuItem
                                                            className="text-green-600"
                                                            onClick={() => handleToggleStatus(user.id, user.status)}
                                                            disabled={toggleStatusMutation.isPending || resetPasswordMutation.isPending || updateUserMutation.isPending}
                                                        >
                                                            <Unlock className="mr-2 h-4 w-4" />
                                                            Kích hoạt tài khoản
                                                        </DropdownMenuItem>
                                                    )}
                                                    <DropdownMenuItem
                                                        onClick={() => handleResetPassword(user.id, user.name)}
                                                        disabled={toggleStatusMutation.isPending || resetPasswordMutation.isPending || updateUserMutation.isPending}
                                                    >
                                                        <KeyRound className="mr-2 h-4 w-4" />
                                                        Đặt lại mật khẩu
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            )}
      </div>

      {/* Reset Password Confirmation Dialog */}
      <Dialog open={resetPasswordDialog.open} onOpenChange={(open) => setResetPasswordDialog({ ...resetPasswordDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Đặt lại mật khẩu</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn đặt lại mật khẩu cho người dùng <strong>{resetPasswordDialog.userName}</strong>? 
              Mật khẩu mới sẽ được tạo tự động và gửi đến email của người dùng.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setResetPasswordDialog({ open: false, userId: null, userName: '' })}
              disabled={resetPasswordMutation.isPending}
            >
              Hủy
            </Button>
            <Button 
              onClick={handleConfirmResetPassword}
              disabled={resetPasswordMutation.isPending}
            >
              {resetPasswordMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                'Xác nhận đặt lại'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={editUserDialog.open} onOpenChange={(open) => setEditUserDialog({ ...editUserDialog, open })}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa thông tin người dùng</DialogTitle>
            <DialogDescription>
              Cập nhật thông tin cho người dùng {editUserDialog.user?.name}
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleSaveEditUser)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Họ và tên <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder="Nhập họ và tên" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="Nhập email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Số điện thoại</FormLabel>
                    <FormControl>
                      <Input placeholder="Nhập số điện thoại" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="studentCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mã số sinh viên</FormLabel>
                    <FormControl>
                      <Input placeholder="Nhập mã số sinh viên" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditUserDialog({ open: false, user: null })}
                  disabled={updateUserMutation.isPending}
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  disabled={updateUserMutation.isPending}
                >
                  {updateUserMutation.isPending ? (
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

export default UserListPage;
