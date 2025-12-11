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
import { Plus, Search, MoreHorizontal, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminService } from "@/services/admin.service";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

// Mock Data as fallback or initial structure
const mockClubs = [
  { id: 1, name: "CLB Guitar", category: "Nghệ thuật", leader: "Nguyễn Văn A", members: 45, status: "active" },
  { id: 2, name: "CLB Lập trình (DevClub)", category: "Học thuật", leader: "Trần Thị B", members: 120, status: "active" },
  { id: 3, name: "CLB Tình nguyện Xanh", category: "Xã hội", leader: "Lê Văn C", members: 80, status: "inactive" },
  { id: 4, name: "CLB Bóng rổ", category: "Thể thao", leader: "Phạm Văn D", members: 30, status: "active" },
  { id: 5, name: "CLB Truyền thông", category: "Kỹ năng", leader: "Hoàng Thị E", members: 55, status: "active" },
];

const ClubListPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch Clubs (Mocking API call for now to use mockClubs if API fails or is not ready)
  const { data: clubs = mockClubs, isLoading } = useQuery({
    queryKey: ['admin-clubs'],
    queryFn: async () => {
      try {
        // Uncomment when API is ready
        // return await adminService.getClubs(); 
        return mockClubs;
      } catch (error) {
        console.error("Failed to fetch clubs", error);
        return mockClubs;
      }
    }
  });

  // Toggle Club Status Mutation
  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number | string, status: 'active' | 'inactive' }) => 
      adminService.toggleClubStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-clubs'] });
      toast({ title: "Cập nhật thành công", description: "Trạng thái CLB đã được thay đổi." });
    },
    onError: () => {
      toast({ title: "Lỗi", description: "Không thể cập nhật trạng thái.", variant: "destructive" });
    }
  });

  const handleToggleStatus = (id: number | string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    // For now, since we use mock data, we can't really mutate it via API. 
    // In a real app, we would call mutate. 
    console.log("Mock toggle", toggleStatusMutation);
    // simulating success for UI demo:
    toast({ 
        title: "Simulation", 
        description: `Calling API to set Club ${id} to ${newStatus}` 
    });
    // toggleStatusMutation.mutate({ id, status: newStatus });
  };

  const filteredClubs = clubs.filter((club: any) => 
    club.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Quản lý Câu lạc bộ</h2>
          <p className="text-muted-foreground">Danh sách và trạng thái hoạt động của các CLB.</p>
        </div>
        <Button onClick={() => navigate("/admin/clubs/create")}>
          <Plus className="mr-2 h-4 w-4" /> Tạo CLB Mới
        </Button>
      </div>

      <div className="flex items-center py-4">
        <div className="relative w-full max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
                placeholder="Tìm kiếm CLB..." 
                className="pl-8" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
      </div>

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tên CLB</TableHead>
              <TableHead>Lĩnh vực</TableHead>
              <TableHead>Chủ nhiệm</TableHead>
              <TableHead className="text-center">Thành viên</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
                <TableRow>
                    <TableCell colSpan={6} className="text-center py-10">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    </TableCell>
                </TableRow>
            ) : filteredClubs.map((club: any) => (
              <TableRow key={club.id}>
                <TableCell className="font-medium">{club.name}</TableCell>
                <TableCell>{club.category}</TableCell>
                <TableCell>{club.leader}</TableCell>
                <TableCell className="text-center">{club.members}</TableCell>
                <TableCell>
                  <Badge variant={club.status === "active" ? "default" : "secondary"}>
                    {club.status === "active" ? "Hoạt động" : "Tạm ngưng"}
                  </Badge>
                </TableCell>
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
                      <DropdownMenuItem onClick={() => navigate(`/admin/clubs/${club.id}`)}>
                        Xem chi tiết
                      </DropdownMenuItem>
                      <DropdownMenuItem>Chỉnh sửa thông tin</DropdownMenuItem>
                      <DropdownMenuItem 
                        className={club.status === "active" ? "text-destructive" : "text-green-600"}
                        onClick={() => handleToggleStatus(club.id, club.status)}
                      >
                        {club.status === "active" ? "Vô hiệu hóa" : "Kích hoạt lại"}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ClubListPage;
