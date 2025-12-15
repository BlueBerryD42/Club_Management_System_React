import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { clubApi } from "@/services/club.service";
import { Search, ArrowLeft, UserCog, UserMinus, Crown } from "lucide-react";

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
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMember, setSelectedMember] = useState<MemberWithProfile | null>(null);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [showTransferLeaderDialog, setShowTransferLeaderDialog] = useState(false);
  const [newRole, setNewRole] = useState("member");

  // Fetch members from API
  const { data: membersData, isLoading } = useQuery({
    queryKey: ['club-members', clubId],
    queryFn: async () => {
      const response = await clubApi.getMembers(clubId!, { limit: 100 });
      return response.data;
    },
    enabled: !!clubId,
  });

  // Extract members from response
  const members: MemberWithProfile[] = Array.isArray(membersData?.data)
    ? membersData.data.map((m: any) => ({
      id: m.id,
      user_id: m.userId,
      role: m.role,
      status: m.status,
      joined_at: m.createdAt || m.joinedAt || new Date().toISOString(),
      profile: {
        full_name: m.user?.fullName || m.user?.full_name || 'N/A',
        email: m.user?.email || 'N/A',
        student_id: m.user?.studentCode || m.user?.student_code || null,
        faculty: null,
      },
    }))
    : [];

  // Mutation for updating role
  const updateRoleMutation = useMutation({
    mutationFn: async ({ membershipId, role }: { membershipId: string; role: string }) => {
      return await clubApi.updateMembershipRole(clubId!, membershipId, { role: role as any });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['club-members', clubId] });
      toast({ title: "Thành công", description: "Đã cập nhật vai trò thành viên" });
      setShowRoleDialog(false);
      setSelectedMember(null);
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: error.response?.data?.message || "Không thể cập nhật vai trò",
        variant: "destructive"
      });
    },
  });

  // Mutation for transferring leadership
  const transferLeaderMutation = useMutation({
    mutationFn: async (newLeaderUserId: string) => {
      return await clubApi.updateLeader(clubId!, { newLeaderUserId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['club-members', clubId] });
      toast({
        title: "Thành công",
        description: "Đã chuyển quyền trưởng CLB. Bạn hiện là thành viên.",
        duration: 5000,
      });
      setShowTransferLeaderDialog(false);
      setSelectedMember(null);
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: error.response?.data?.message || "Không thể chuyển quyền trưởng CLB",
        variant: "destructive"
      });
    },
  });

  const handleChangeRole = async () => {
    if (!selectedMember) return;

    const upperRole = newRole.toUpperCase();

    // Nếu chọn LEADER, mở dialog xác nhận chuyển quyền
    if (upperRole === "LEADER") {
      setShowRoleDialog(false);
      setShowTransferLeaderDialog(true);
      return;
    }

    // Cập nhật role thông thường (MEMBER, STAFF, TREASURER)
    updateRoleMutation.mutate({
      membershipId: selectedMember.id,
      role: upperRole,
    });
  };

  const handleTransferLeader = () => {
    if (!selectedMember) return;
    transferLeaderMutation.mutate(selectedMember.user_id);
  };

  const handleRemoveMember = async (_memberId: string) => {
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
    const upperRole = role.toUpperCase();
    switch (upperRole) {
      case "LEADER":
        return <Badge className="bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-500/30">Trưởng CLB</Badge>;
      case "TREASURER":
        return <Badge className="bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30">Thủ quỹ</Badge>;
      case "STAFF":
        return <Badge className="bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30">Ban quản lý</Badge>;
      default:
        return <Badge className="bg-slate-500/20 text-slate-700 dark:text-slate-300 border-slate-500/30">Thành viên</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    const upperStatus = status.toUpperCase();
    switch (upperStatus) {
      case "ACTIVE":
        return <Badge className="bg-green-500/20 text-green-700 dark:text-green-300 border-green-500/30">Hoạt động</Badge>;
      case "INACTIVE":
        return <Badge className="bg-gray-500/20 text-gray-700 dark:text-gray-300 border-gray-500/30">Không hoạt động</Badge>;
      case "PENDING":
      case "PENDING_PAYMENT":
        return <Badge className="bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 border-yellow-500/30">Chờ duyệt</Badge>;
      case "ALUMNI":
        return <Badge className="bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border-indigo-500/30">Cựu thành viên</Badge>;
      default:
        return <Badge className="bg-slate-500/20 text-slate-700 dark:text-slate-300 border-slate-500/30">{status}</Badge>;
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" asChild className="mb-6">
          <Link to={`/club-leader/${clubId}/dashboard`}>
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
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : (
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
                            {member.role.toUpperCase() !== "LEADER" && (
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
            )}
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

        {/* Transfer Leadership Dialog */}
        <Dialog open={showTransferLeaderDialog} onOpenChange={setShowTransferLeaderDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-amber-500" />
                Chuyển quyền Trưởng CLB
              </DialogTitle>
              <DialogDescription className="space-y-2">
                <p>
                  Bạn đang chuyển quyền trưởng CLB cho{" "}
                  <strong>{selectedMember?.profile?.full_name}</strong>
                </p>
                <div className="p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-md text-amber-800 dark:text-amber-200 text-sm">
                  <p className="font-semibold mb-1">⚠️ Lưu ý:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Sau khi chuyển quyền, bạn sẽ trở thành thành viên thông thường</li>
                    <li>Bạn sẽ không thể hoàn tác hành động này</li>
                    <li>Chỉ trưởng CLB mới có thể chuyển quyền cho người khác</li>
                  </ul>
                </div>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowTransferLeaderDialog(false);
                  setSelectedMember(null);
                }}
              >
                Hủy
              </Button>
              <Button
                onClick={handleTransferLeader}
                disabled={transferLeaderMutation.isPending}
                className="bg-amber-500 hover:bg-amber-600"
              >
                {transferLeaderMutation.isPending ? "Đang xử lý..." : "Xác nhận chuyển quyền"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
