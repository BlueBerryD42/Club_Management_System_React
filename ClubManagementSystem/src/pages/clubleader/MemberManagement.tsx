import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Search, ArrowLeft, UserCog, UserMinus } from "lucide-react";

interface MemberWithProfile {
  id: string;
  user_id: string;
  role: string;
  status: string;
  joined_at: string;
  profile: {
    full_name: string;
    email: string;
    student_id: string | null;
    faculty: string | null;
  };
}

export default function MemberManagement() {
  const { clubId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [members, setMembers] = useState<MemberWithProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMember, setSelectedMember] = useState<MemberWithProfile | null>(null);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [newRole, setNewRole] = useState("member");

  useEffect(() => {
    // Mock data
    setMembers([
      {
        id: "1",
        user_id: "user1",
        role: "leader",
        status: "active",
        joined_at: new Date(Date.now() - 86400000 * 365).toISOString(),
        profile: {
          full_name: "Nguyễn Văn A",
          email: "a@student.edu.vn",
          student_id: "20210001",
          faculty: "Công nghệ thông tin",
        },
      },
      {
        id: "2",
        user_id: "user2",
        role: "member",
        status: "active",
        joined_at: new Date(Date.now() - 86400000 * 30).toISOString(),
        profile: {
          full_name: "Trần Thị B",
          email: "b@student.edu.vn",
          student_id: "20210002",
          faculty: "Công nghệ thông tin",
        },
      },
      {
        id: "3",
        user_id: "user3",
        role: "treasurer",
        status: "active",
        joined_at: new Date(Date.now() - 86400000 * 60).toISOString(),
        profile: {
          full_name: "Lê Văn C",
          email: "c@student.edu.vn",
          student_id: "20210003",
          faculty: "Kinh tế",
        },
      },
    ]);
  }, [clubId]);

  const handleChangeRole = async () => {
    if (!selectedMember) return;

    // TODO: Kết nối API
    toast({ title: "Thành công", description: "Đã cập nhật vai trò thành viên" });
    setShowRoleDialog(false);
    setSelectedMember(null);
  };

  const handleRemoveMember = async (memberId: string) => {
    // TODO: Kết nối API
    toast({ title: "Thành công", description: "Đã xóa thành viên khỏi CLB" });
  };

  const filteredMembers = members.filter((m) => {
    const matchesSearch =
      m.profile?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.profile?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.profile?.student_id?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "leader":
        return <Badge className="bg-primary/20 text-primary">Leader</Badge>;
      case "treasurer":
        return <Badge className="bg-warning/20 text-warning">Thủ quỹ</Badge>;
      case "staff":
        return <Badge className="bg-secondary text-secondary-foreground">Staff</Badge>;
      default:
        return <Badge variant="outline">Thành viên</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-success/20 text-success">Hoạt động</Badge>;
      case "inactive":
        return <Badge className="bg-muted text-muted-foreground">Không hoạt động</Badge>;
      case "pending":
        return <Badge className="bg-warning/20 text-warning">Chờ duyệt</Badge>;
      case "alumni":
        return <Badge className="bg-primary/20 text-primary">Cựu thành viên</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" asChild className="mb-6">
          <Link to={`/club-leader/${clubId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại Dashboard
          </Link>
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Quản lý thành viên</h1>
          <p className="text-muted-foreground mt-2">Quản lý và phân quyền thành viên CLB</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm thành viên..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Họ tên</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>MSSV</TableHead>
                  <TableHead>Vai trò</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Ngày tham gia</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMembers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Chưa có thành viên nào
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMembers.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">{member.profile?.full_name}</TableCell>
                      <TableCell>{member.profile?.email}</TableCell>
                      <TableCell>{member.profile?.student_id || "-"}</TableCell>
                      <TableCell>{getRoleBadge(member.role)}</TableCell>
                      <TableCell>{getStatusBadge(member.status)}</TableCell>
                      <TableCell>
                        {new Date(member.joined_at).toLocaleDateString("vi-VN")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedMember(member);
                              setNewRole(member.role);
                              setShowRoleDialog(true);
                            }}
                          >
                            <UserCog className="h-4 w-4" />
                          </Button>
                          {member.role !== "leader" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive"
                              onClick={() => handleRemoveMember(member.id)}
                            >
                              <UserMinus className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Change Role Dialog */}
        <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Thay đổi vai trò</DialogTitle>
              <DialogDescription>
                Thay đổi vai trò của {selectedMember?.profile?.full_name}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn vai trò" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Thành viên</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="treasurer">Thủ quỹ</SelectItem>
                  <SelectItem value="leader">Leader</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowRoleDialog(false)}>
                Hủy
              </Button>
              <Button onClick={handleChangeRole}>Lưu thay đổi</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
