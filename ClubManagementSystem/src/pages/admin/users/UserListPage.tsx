import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminService } from "@/services/admin.service";
import { useToast } from "@/hooks/use-toast";
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
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, MoreHorizontal, Lock, Unlock, RotateCcw, Shield, User, Crown, Users, Loader2 } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

// Mock Data grouped by Club (Fallback)
const mockClubUsers = [
    {
        clubId: "system",
        clubName: "Quản trị hệ thống",
        users: [
             { id: "1", name: "Admin User", email: "admin@university.edu", role: "System Admin", status: "active" },
        ]
    },
    {
        clubId: "clb-guitar",
        clubName: "CLB Guitar",
        users: [
            { id: "2", name: "Trần Thị B", email: "b.tran@student.university.edu", role: "Club Leader", status: "active" },
            { id: "3", name: "Lê Văn C", email: "c.le@student.university.edu", role: "Treasurer", status: "suspended" },
            { id: "4", name: "Nguyễn Văn D", email: "d.nguyen@student.university.edu", role: "Member", status: "active" },
        ]
    },
    {
         clubId: "clb-dev",
         clubName: "CLB Lập trình (DevClub)",
         users: [
             { id: "5", name: "Hoàng Văn E", email: "e.hoang@student.university.edu", role: "Club Leader", status: "active" },
             { id: "6", name: "Phạm Thị F", email: "f.pham@student.university.edu", role: "Member", status: "active" },
         ]
    }
];

type FilterType = "all" | "leader" | "treasurer" | "member" | "suspended";

const UserListPage = () => {
  const [filter, setFilter] = useState<FilterType>("all");
  const [searchTerm, setSearchTerm] = useState("");
  // const { toast } = useToast();
  // const queryClient = useQueryClient();

  // Fetch Users (Mock for now)
  const { data: clubUsers = mockClubUsers, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
        try {
            // return await adminService.getUsers();
            return mockClubUsers;
        } catch (error) {
            console.error(error);
            return mockClubUsers;
        }
    }
  });

  // Filtering Logic for "By Club" view
  const filteredGroups = clubUsers.map(group => {
      const filteredUsers = group.users.filter(user => {
          // 1. Text Search
          const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                user.email.toLowerCase().includes(searchTerm.toLowerCase());
          if (!matchesSearch) return false;

          // 2. Role/Status Filter
          if (filter === "all") return true;
          if (filter === "leader") return user.role === "Club Leader" || user.role === "System Admin";
          if (filter === "treasurer") return user.role === "Treasurer";
          if (filter === "member") return user.role === "Member";
          if (filter === "suspended") return user.status === "suspended";
          
          return true;
      });

      return { ...group, users: filteredUsers };
  }).filter(group => group.users.length > 0); // Hide empty groups

  // Filtering Logic for "Club Leaders" view (Flattened list)
  const allLeaders = clubUsers
    .flatMap(group => group.users.map(u => ({ ...u, clubName: group.clubName })))
    .filter(u => u.role === "Club Leader")
    .filter(u => 
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.clubName.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const PillButton = ({ value, label, count }: { value: FilterType, label: string, count?: number }) => (
      <button
          onClick={() => setFilter(value)}
          className={cn(
              "px-4 py-1.5 rounded-full text-sm font-medium transition-all",
              filter === value 
                  ? "bg-primary text-primary-foreground shadow-sm" 
                  : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
          )}
      >
          {label}
          {count !== undefined && <span className="ml-2 opacity-80 text-xs">({count})</span>}
      </button>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Quản lý Người dùng</h2>
        <p className="text-muted-foreground">Danh sách thành viên và phân quyền hệ thống.</p>
      </div>

      <Tabs defaultValue="by-club" className="w-full">
        <div className="flex items-center justify-between">
            <TabsList>
                <TabsTrigger value="by-club" className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Theo Câu lạc bộ
                </TabsTrigger>
                <TabsTrigger value="leaders" className="flex items-center gap-2">
                    <Crown className="h-4 w-4" />
                    Danh sách Chủ nhiệm
                </TabsTrigger>
            </TabsList>
        </div>

        <div className="flex flex-col gap-4 my-4">
            {/* Search Bar - Shared */}
            <div className="relative w-full max-w-sm">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                    placeholder="Tìm kiếm tên, email..." 
                    className="pl-8" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
        </div>

        <TabsContent value="by-club" className="space-y-4">
            <div className="flex flex-wrap gap-2 mb-4">
                <PillButton value="all" label="Tất cả" />
                <PillButton value="leader" label="Chủ nhiệm/Admin" />
                <PillButton value="treasurer" label="Thủ quỹ" />
                <PillButton value="member" label="Thành viên" />
                <PillButton value="suspended" label="Đã khóa" />
            </div>

            {isLoading ? (
                <div className="text-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                </div>
            ) : (
                <Accordion type="multiple" defaultValue={["system", "clb-guitar", "clb-dev"]} className="w-full space-y-4">
                    {filteredGroups.length === 0 ? (
                        <div className="text-center py-10 text-muted-foreground">
                            Không tìm thấy thành viên nào phù hợp.
                        </div>
                    ) : (
                        filteredGroups.map((group) => (
                            <AccordionItem key={group.clubId} value={group.clubId} className="border rounded-lg bg-white px-4">
                                <AccordionTrigger className="hover:no-underline py-4">
                                    <div className="flex items-center gap-3">
                                        {group.clubId === 'system' ? <Shield className="h-5 w-5 text-primary" /> : <User className="h-5 w-5 text-muted-foreground" />}
                                        <span className="text-lg font-semibold">{group.clubName}</span>
                                        <Badge variant="secondary" className="ml-2">{group.users.length} kết quả</Badge>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="pt-0 pb-4">
                                    <UserTable users={group.users} />
                                </AccordionContent>
                            </AccordionItem>
                        ))
                    )}
                </Accordion>
            )}
        </TabsContent>

        <TabsContent value="leaders">
            <div className="rounded-md border bg-white">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Họ và Tên</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Câu lạc bộ</TableHead>
                            <TableHead>Trạng thái</TableHead>
                            <TableHead className="text-right">Thao tác</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                         {allLeaders.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                    Không tìm thấy chủ nhiệm nào.
                                </TableCell>
                            </TableRow>
                        ) : (
                            allLeaders.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell className="font-medium flex items-center gap-2">
                                        <Crown className="h-4 w-4 text-yellow-500" />
                                        {user.name}
                                    </TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell className="font-medium text-primary">{user.clubName}</TableCell>
                                    <TableCell>
                                        <Badge variant={user.status === "active" ? "default" : "secondary"}>
                                            {user.status === "active" ? "Hoạt động" : "Đã khóa"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <UserActions user={user} />
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Shared Components to reduce duplication

const UserTable = ({ users }: { users: any[] }) => (
    <Table>
        <TableHeader>
            <TableRow>
                <TableHead>Họ và Tên</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Vai trò</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
        </TableHeader>
        <TableBody>
            {users.map((user) => (
                <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                        <Badge variant={user.role === 'System Admin' ? "destructive" : "outline"}>
                            {user.role}
                        </Badge>
                    </TableCell>
                    <TableCell>
                        <Badge variant={user.status === "active" ? "default" : "secondary"}>
                            {user.status === "active" ? "Hoạt động" : "Đã khóa"}
                        </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                        <UserActions user={user} />
                    </TableCell>
                </TableRow>
            ))}
        </TableBody>
    </Table>
);

const UserActions = ({ user }: { user: any }) => {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const toggleStatusMutation = useMutation({
        mutationFn: () => adminService.updateUserStatus(user.id, user.status === 'active' ? 'suspended' : 'active'),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-users'] });
            toast({ title: "Thành công", description: "Trạng thái người dùng đã được cập nhật." });
        },
        onError: () => toast({ title: "Lỗi", description: "Không thể cập nhật trạng thái.", variant: "destructive" })
    });

    const resetPasswordMutation = useMutation({
        mutationFn: () => adminService.resetUserPassword(user.id),
        onSuccess: () => {
            toast({ title: "Thành công", description: "Mật khẩu đã được đặt lại và gửi qua email." });
        },
        onError: () => toast({ title: "Lỗi", description: "Không thể đặt lại mật khẩu.", variant: "destructive" })
    });

    const handleToggleStatus = () => {
        // Mock success for demo
        console.log("Mock toggle", toggleStatusMutation);
        toast({ title: "Simulation", description: `Updating status for ${user.name}` });
        // toggleStatusMutation.mutate();
    };

    const handleResetPassword = () => {
        // Mock success for demo
        console.log("Mock reset", resetPasswordMutation);
        toast({ title: "Simulation", description: `Resetting password for ${user.name}` });
        // resetPasswordMutation.mutate();
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>Thao tác</DropdownMenuLabel>
                <DropdownMenuItem onClick={handleResetPassword}>
                    <RotateCcw className="mr-2 h-4 w-4" /> Đặt lại mật khẩu
                </DropdownMenuItem>
                {user.status === 'active' ? (
                    <DropdownMenuItem className="text-destructive" onClick={handleToggleStatus}>
                        <Lock className="mr-2 h-4 w-4" /> Khóa tài khoản
                    </DropdownMenuItem>
                ) : (
                    <DropdownMenuItem className="text-green-600" onClick={handleToggleStatus}>
                        <Unlock className="mr-2 h-4 w-4" /> Mở khóa
                    </DropdownMenuItem>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default UserListPage;
