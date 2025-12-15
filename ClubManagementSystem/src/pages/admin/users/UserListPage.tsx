import { useState } from 'react';
import { useQuery } from "@tanstack/react-query";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Users, Loader2, ChevronDown, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

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

type FilterType = "all" | "active" | "pending";

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
  const [expandedClubs, setExpandedClubs] = useState<Set<string>>(new Set());

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
                        let members = [];
                        if (Array.isArray(res.data)) {
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
                              user: m.user
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

  // Filter members based on search and status filter
  const filteredClubs = clubsWithMembers.map(club => {
      if (!club.members) return club;
      
      const filtered = club.members.filter((member: ClubMember) => {
          // Text search
          const matchesSearch = 
              member.user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
              member.user.email.toLowerCase().includes(searchTerm.toLowerCase());
          
          if (!matchesSearch) return false;

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

  const isLoading = clubsLoading || membersLoading;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Quản lý Thành viên CLB</h2>
        <p className="text-muted-foreground">Danh sách thành viên của các câu lạc bộ.</p>
      </div>

      <Tabs defaultValue="members-by-club" className="w-full">
        <div className="flex items-center justify-between">
            <TabsList>
                <TabsTrigger value="members-by-club" className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Thành viên theo CLB
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

            {isLoading && (
                <div className="text-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                </div>
            )}

            {!isLoading && filteredClubs.length === 0 && (
                <div className="text-center py-10 text-muted-foreground">
                    <p>Không tìm thấy dữ liệu nào.</p>
                </div>
            )}

            {!isLoading && filteredClubs.length > 0 && (
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
    </div>
  );
};

export default UserListPage;

