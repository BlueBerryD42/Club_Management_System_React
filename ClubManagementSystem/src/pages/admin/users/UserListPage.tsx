import { useState } from 'react';
import { useQuery } from "@tanstack/react-query";
import { userApi } from "@/services/user.service";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Users, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

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

type FilterType = "all" | "leader" | "member" | "suspended";

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

  // Filtering Logic
  const filteredUsers = users.filter((user: User) => {
      // Text Search
      const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            user.email.toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchesSearch) return false;

      // Role/Status Filter
      if (filter === "all") return true;
      if (filter === "leader") return user.role === "System Admin";
      if (filter === "member") return user.role === "Thành viên";
      if (filter === "suspended") return user.status === "suspended";
      
      return true;
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

      <Tabs defaultValue="all-users" className="w-full">
        <div className="flex items-center justify-between">
            <TabsList>
                <TabsTrigger value="all-users" className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Danh sách Người dùng
                </TabsTrigger>
            </TabsList>
        </div>

        <div className="flex flex-col gap-4 my-4">
            {/* Search Bar */}
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

        <TabsContent value="all-users" className="space-y-4">
            <div className="flex flex-wrap gap-2 mb-4">
                <PillButton 
                  label="Tất cả" 
                  isActive={filter === "all"}
                  onClick={() => setFilter("all")}
                />
                <PillButton 
                  label="System Admin" 
                  isActive={filter === "leader"}
                  onClick={() => setFilter("leader")}
                />
                <PillButton 
                  label="Thành viên" 
                  isActive={filter === "member"}
                  onClick={() => setFilter("member")}
                />
                <PillButton 
                  label="Đã khóa" 
                  isActive={filter === "suspended"}
                  onClick={() => setFilter("suspended")}
                />
            </div>

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
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredUsers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
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
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UserListPage;
