import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { adminService } from "@/services/admin.service";
import { clubApi } from "@/services/club.service";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Users, Loader2, MoreHorizontal, Lock, Unlock, KeyRound, Edit, ChevronDown, ChevronRight } from "lucide-react";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";

interface ClubMember {
  id: string;
  userId: string;
  role: string;
  status: string;
  joinedAt: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    studentCode: string;
    phone: string;
    avatarUrl?: string;
  };
}

interface Club {
  id: string;
  name: string;
  description?: string;
  slug: string;
  members?: ClubMember[];
  isExpanded?: boolean;
}

interface PillButtonProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
}

interface User {
  id: string;
  name: string;
  email: string;
  studentCode?: string;
  phone?: string;
  role: string;
  status: 'active' | 'suspended';
  createdAt: string;
}

type FilterType = "all" | "active" | "suspended" | "pending";

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

const getRoleLabel = (role: string): string => {
  switch (role) {
    case 'LEADER':
      return 'Chủ nhiệm';
    case 'TREASURER':
      return 'Thủ quỹ';
    case 'STAFF':
      return 'Nhân viên';
    default:
      return 'Thành viên';
  }
};

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
  const [toggleStatusConfirmDialog, setToggleStatusConfirmDialog] = useState<{ open: boolean; userId: string | null; userName: string; currentStatus: 'active' | 'suspended' }>({ open: false, userId: null, userName: '', currentStatus: 'active' });
  const [expandedClubs, setExpandedClubs] = useState<Set<string>>(new Set());
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

  // Fetch all users
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      try {
        const res = await adminService.getUsers();

        // /api/users/getallprofile returns: { users: [...], count: number }
        // Backend fields: id, email, fullName, phone, studentCode, isActive, createdAt
        let userList = [];
        if (Array.isArray(res)) {
          userList = res;
        } else if (Array.isArray(res.users)) {
          userList = res.users;
        } else if (Array.isArray(res.data)) {
          userList = res.data;
        } else if (res.data?.users && Array.isArray(res.data.users)) {
          userList = res.data.users;
        } else if (res.data?.data && Array.isArray(res.data.data)) {
          userList = res.data.data;
        }

        // Map backend fields to frontend User interface
        // Backend returns: fullName, isActive (boolean)
        // Frontend expects: name, status ('active' | 'suspended')
        const mappedUsers = userList.map((user: any) => ({
          id: user.id,
          name: user.fullName || user.name || '',
          email: user.email || '',
          studentCode: user.studentCode || user.student_code,
          phone: user.phone || '',
          role: user.role || user.auth_role || 'USER', // Note: getallprofile doesn't return role, will default to 'USER'
          status: user.isActive === false ? 'suspended' : 'active',
          createdAt: user.createdAt || user.created_at || new Date().toISOString(),
        }));

        return mappedUsers as User[];
      } catch (error) {
        console.error('Error fetching users:', error);
        throw error;
      }
    }
  });

  const users = usersData || [];

  // Fetch all clubs
  const { data: clubs = [], isLoading: clubsLoading } = useQuery({
    queryKey: ['admin-clubs'],
    queryFn: async () => {
      try {
        const res = await clubApi.getAll({ limit: 100 });
        let clubData = [];
        if (Array.isArray(res)) {
          clubData = res;
        } else if (Array.isArray(res.data)) {
          clubData = res.data;
        } else if (res.data?.data && Array.isArray(res.data.data)) {
          clubData = res.data.data;
        }

        return clubData.map((c: any) => ({
          id: c.id,
          name: c.name || c.fullName || 'Unknown',
          description: c.description,
          slug: c.slug,
          members: []
        })) as Club[];
      } catch (error) {
        console.error('Error fetching clubs:', error);
        throw error;
      }
    }
  });

  // Fetch members for each club
  const { data: clubsWithMembers = [], isLoading: membersLoading } = useQuery({
    queryKey: ['club-members', clubs.map(c => c.id).join(',')],
    enabled: clubs.length > 0,
    queryFn: async () => {
      try {
        const clubsWithData = await Promise.all(
          clubs.map(async (club) => {
            try {
              const res = await clubApi.getMembers(club.id, { limit: 100 });

              // Handle different response structures
              // API returns: { success: true, data: [...], pagination: {...} }
              // apiClient.get() returns response.data, so res = { success: true, data: [...], pagination: {...} }
              let members = [];
              if (Array.isArray(res)) {
                members = res;
              } else if (Array.isArray(res.data)) {
                members = res.data;
              } else if (res.data?.data && Array.isArray(res.data.data)) {
                members = res.data.data;
              }

              return {
                ...club,
                members: members.map((m: any) => ({
                  id: m.id,
                  userId: m.userId,
                  role: m.role || 'MEMBER',
                  status: m.status || 'ACTIVE',
                  joinedAt: m.joinedAt,
                  user: m.user || {
                    id: m.userId,
                    email: '',
                    fullName: '',
                    studentCode: '',
                    phone: '',
                    avatarUrl: null
                  }
                }))
              };
            } catch (err) {
              console.error(`Error fetching members for club ${club.id}:`, err);
              return { ...club, members: [] };
            }
          })
        );
        return clubsWithData;
      } catch (error) {
        console.error('Error fetching members:', error);
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
    const user = users.find((u: User) => u.id === userId);
    setToggleStatusConfirmDialog({ 
      open: true, 
      userId, 
      userName: user?.name || 'Người dùng',
      currentStatus: currentStatus as 'active' | 'suspended'
    });
  };

  const handleConfirmToggleStatus = () => {
    if (toggleStatusConfirmDialog.userId) {
      const newStatus = toggleStatusConfirmDialog.currentStatus === 'active' ? 'suspended' : 'active';
      toggleStatusMutation.mutate({ id: toggleStatusConfirmDialog.userId, status: newStatus as 'active' | 'suspended' });
      setToggleStatusConfirmDialog({ open: false, userId: null, userName: '', currentStatus: 'active' });
    }
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

  // Filtering and Sorting Logic for Users
  const filteredUsers = users
    .filter((user: User) => {
      // Text Search - check both name and email (skip if search is empty)
      if (searchTerm.trim()) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch =
          (user.name && user.name.toLowerCase().includes(searchLower)) ||
          (user.email && user.email.toLowerCase().includes(searchLower)) ||
          (user.studentCode && user.studentCode.toLowerCase().includes(searchLower));

        if (!matchesSearch) return false;
      }

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

  // Filter members based on search and status filter
  const filteredClubs = clubsWithMembers.map(club => {
    if (!club.members) return club;

    const filtered = club.members.filter((member: ClubMember) => {
      // Text search (skip if search is empty)
      if (searchTerm.trim()) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch =
          (member.user?.fullName && member.user.fullName.toLowerCase().includes(searchLower)) ||
          (member.user?.email && member.user.email.toLowerCase().includes(searchLower)) ||
          (member.user?.studentCode && member.user.studentCode.toLowerCase().includes(searchLower));

        if (!matchesSearch) return false;
      }

      // Status filter
      if (filter === "all") return true;
      if (filter === "active") return member.status === "ACTIVE";
      if (filter === "pending") return member.status !== "ACTIVE";

      return true;
    });

    return { ...club, members: filtered };
  }).filter(club => club.members && club.members.length > 0);

  const toggleClub = (clubId: string) => {
    const newExpanded = new Set(expandedClubs);
    if (newExpanded.has(clubId)) {
      newExpanded.delete(clubId);
    } else {
      newExpanded.add(clubId);
    }
    setExpandedClubs(newExpanded);
  };

  const isLoadingUsers = usersLoading;
  const isLoadingClubs = clubsLoading || membersLoading;

  return (
    <div className="space-y-6">
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
            Quản lý Người dùng
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Quản lý tất cả người dùng và thành viên câu lạc bộ trong hệ thống.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="rounded-full px-4 py-2 bg-primary/10 text-primary">
            <Users className="h-4 w-4 mr-2" />
            {users.length} người dùng
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="all-users" className="w-full">
        <TabsList className="bg-slate-100 p-1 rounded-xl">
          <TabsTrigger value="all-users" className="flex items-center gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Users className="h-4 w-4" />
            Tất cả người dùng
          </TabsTrigger>
          <TabsTrigger value="members-by-club" className="flex items-center gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Users className="h-4 w-4" />
            Thành viên theo CLB
          </TabsTrigger>
        </TabsList>

        {/* All Users Tab */}
        <TabsContent value="all-users" className="space-y-4 mt-6">
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

          {isLoadingUsers && (
            <div className="text-center py-10">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            </div>
          )}

          {!isLoadingUsers && filteredUsers.length === 0 && (
            <div className="text-center py-10 text-muted-foreground">
              <p>Không tìm thấy người dùng nào phù hợp.</p>
            </div>
          )}

          {!isLoadingUsers && filteredUsers.length > 0 && (
            <div className="rounded-xl border-0 shadow-lg bg-white overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="font-semibold">Họ tên</TableHead>
                    <TableHead className="font-semibold">Email</TableHead>
                    <TableHead className="font-semibold">MSSV</TableHead>
                    <TableHead className="font-semibold">SĐT</TableHead>
                    <TableHead className="font-semibold">Vai trò</TableHead>
                    <TableHead className="font-semibold">Trạng thái</TableHead>
                    <TableHead className="font-semibold">Ngày tạo</TableHead>
                    <TableHead className="text-right font-semibold">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user: User) => (
                    <TableRow key={user.id} className="hover:bg-slate-50/50 transition-colors">
                      <TableCell className="font-medium text-slate-900">{user.name}</TableCell>
                      <TableCell className="text-slate-600">{user.email}</TableCell>
                      <TableCell className="text-slate-600">{user.studentCode || '-'}</TableCell>
                      <TableCell className="text-slate-600">{user.phone || '-'}</TableCell>
                      <TableCell>
                        <Badge className={`rounded-full ${user.role === 'ADMIN'
                            ? 'bg-red-100 text-red-700 hover:bg-red-100'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-100'
                          }`}>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={`rounded-full ${user.status === 'active'
                            ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-100'
                          }`}>
                          <span className={`h-1.5 w-1.5 rounded-full mr-1.5 ${user.status === 'active' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                          {user.status === 'active' ? 'Hoạt động' : 'Đã khóa'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-600">{new Date(user.createdAt).toLocaleDateString('vi-VN')}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-xl w-48">
                            <DropdownMenuLabel>Thao tác</DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={() => handleEditUser(user)}
                              disabled={toggleStatusMutation.isPending || resetPasswordMutation.isPending || updateUserMutation.isPending}
                              className="cursor-pointer"
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Chỉnh sửa thông tin
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {user.status === 'active' ? (
                              <DropdownMenuItem
                                className="text-red-600 cursor-pointer"
                                onClick={() => handleToggleStatus(user.id, user.status)}
                                disabled={toggleStatusMutation.isPending || resetPasswordMutation.isPending || updateUserMutation.isPending}
                              >
                                <Lock className="mr-2 h-4 w-4" />
                                Vô hiệu hóa tài khoản
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                className="text-emerald-600 cursor-pointer"
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
                              className="cursor-pointer"
                            >
                              <KeyRound className="mr-2 h-4 w-4" />
                              Đặt lại mật khẩu
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* Members by Club Tab */}
        <TabsContent value="members-by-club" className="space-y-4">
          <div className="flex flex-wrap gap-2 mb-4">
            <PillButton
              label="Tất cả"
              isActive={filter === "all"}
              onClick={() => setFilter("all")}
            />
            <PillButton
              label="Đang hoạt động"
              isActive={filter === "active"}
              onClick={() => setFilter("active")}
            />
            <PillButton
              label="Chưa kích hoạt"
              isActive={filter === "pending"}
              onClick={() => setFilter("pending")}
            />
          </div>

          {isLoadingClubs && (
            <div className="text-center py-10">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            </div>
          )}

          {!isLoadingClubs && filteredClubs.length === 0 && (
            <div className="text-center py-10 text-muted-foreground">
              <p>Không tìm thấy dữ liệu nào.</p>
            </div>
          )}

          {!isLoadingClubs && filteredClubs.length > 0 && (
            <div className="space-y-4">
              {filteredClubs.map((club) => (
                <div key={club.id} className="border rounded-lg bg-white overflow-hidden">
                  {/* Club Header */}
                  <button
                    onClick={() => toggleClub(club.id)}
                    className="w-full px-4 py-4 hover:bg-muted/50 transition-colors flex items-center gap-3"
                  >
                    {expandedClubs.has(club.id) ? (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    )}
                    <div className="flex-1 text-left">
                      <h3 className="font-semibold text-lg">{club.name}</h3>
                      {club.description && (
                        <p className="text-sm text-muted-foreground">{club.description}</p>
                      )}
                    </div>
                    <Badge variant="secondary">{club.members?.length || 0} thành viên</Badge>
                  </button>

                  {/* Members Table */}
                  {expandedClubs.has(club.id) && club.members && club.members.length > 0 && (
                    <div className="border-t">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Họ tên</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>MSSV</TableHead>
                            <TableHead>SĐT</TableHead>
                            <TableHead>Vai trò</TableHead>
                            <TableHead>Trạng thái</TableHead>
                            <TableHead>Ngày tham gia</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {club.members.map((member: ClubMember) => (
                            <TableRow key={member.id}>
                              <TableCell className="font-medium">{member.user.fullName}</TableCell>
                              <TableCell>{member.user.email}</TableCell>
                              <TableCell>{member.user.studentCode || '-'}</TableCell>
                              <TableCell>{member.user.phone || '-'}</TableCell>
                              <TableCell>
                                <Badge variant={member.role === 'LEADER' ? 'destructive' : 'outline'}>
                                  {getRoleLabel(member.role)}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant={member.status === 'ACTIVE' ? 'default' : 'secondary'}>
                                  {member.status === 'ACTIVE' ? 'Hoạt động' : 'Chưa kích hoạt'}
                                </Badge>
                              </TableCell>
                              <TableCell>{new Date(member.joinedAt).toLocaleDateString('vi-VN')}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}

                  {expandedClubs.has(club.id) && (!club.members || club.members.length === 0) && (
                    <div className="border-t px-4 py-8 text-center text-muted-foreground">
                      Không có thành viên nào.
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

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

      {/* Toggle User Status Confirmation Dialog */}
      <AlertDialog open={toggleStatusConfirmDialog.open} onOpenChange={(open) => setToggleStatusConfirmDialog({ ...toggleStatusConfirmDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {toggleStatusConfirmDialog.currentStatus === 'active' ? 'Vô hiệu hóa tài khoản?' : 'Kích hoạt tài khoản?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {toggleStatusConfirmDialog.currentStatus === 'active' ? (
                <>
                  Bạn có chắc muốn vô hiệu hóa tài khoản của <strong>{toggleStatusConfirmDialog.userName}</strong>? Người dùng này sẽ không thể truy cập hệ thống cho đến khi tài khoản được kích hoạt lại.
                </>
              ) : (
                <>
                  Bạn có chắc muốn kích hoạt lại tài khoản của <strong>{toggleStatusConfirmDialog.userName}</strong>?
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmToggleStatus}
              className={toggleStatusConfirmDialog.currentStatus === 'active' ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'}
            >
              {toggleStatusConfirmDialog.currentStatus === 'active' ? 'Vô hiệu hóa' : 'Kích hoạt'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default UserListPage;

