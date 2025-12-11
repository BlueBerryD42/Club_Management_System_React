import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Search, Check, X } from "lucide-react";

interface EventAttendee {
  id: string;
  user_id: string;
  event_id: string;
  status: string;
  checked_in: boolean;
  checked_in_at: string | null;
  full_name: string;
  email: string;
  student_id: string;
}

export default function EventAttendees() {
  const { clubId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [event] = useState({
    id: "1",
    title: "Workshop Kỹ năng mềm",
    start_time: new Date(Date.now() + 86400000 * 7).toISOString(),
  });
  const [attendees, setAttendees] = useState<EventAttendee[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    // Mock data
    const mockAttendees: EventAttendee[] = [
      {
        id: "1",
        user_id: "user1",
        event_id: "1",
        status: "registered",
        checked_in: true,
        checked_in_at: new Date().toISOString(),
        full_name: "Nguyễn Văn A",
        email: "a@student.edu.vn",
        student_id: "20210001",
      },
      {
        id: "2",
        user_id: "user2",
        event_id: "1",
        status: "registered",
        checked_in: false,
        checked_in_at: null,
        full_name: "Trần Thị B",
        email: "b@student.edu.vn",
        student_id: "20210002",
      },
      {
        id: "3",
        user_id: "user3",
        event_id: "1",
        status: "pending",
        checked_in: false,
        checked_in_at: null,
        full_name: "Lê Văn C",
        email: "c@student.edu.vn",
        student_id: "20210003",
      },
    ];
    setAttendees(mockAttendees);
  }, []);

  const handleCheckIn = async (attendeeId: string) => {
    // TODO: Kết nối API
    setAttendees(
      attendees.map((a) =>
        a.id === attendeeId
          ? { ...a, checked_in: true, checked_in_at: new Date().toISOString() }
          : a
      )
    );
    toast({ title: "Thành công", description: "Đã điểm danh" });
  };

  const handleRemoveCheckIn = async (attendeeId: string) => {
    // TODO: Kết nối API
    setAttendees(
      attendees.map((a) =>
        a.id === attendeeId
          ? { ...a, checked_in: false, checked_in_at: null }
          : a
      )
    );
    toast({ title: "Thành công", description: "Đã bỏ điểm danh" });
  };

  const filteredAttendees = attendees.filter(
    (a) =>
      a.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.student_id.includes(searchQuery)
  );

  const stats = {
    total: attendees.length,
    registered: attendees.filter((a) => a.status === "registered").length,
    checked_in: attendees.filter((a) => a.checked_in).length,
    pending: attendees.filter((a) => a.status === "pending").length,
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
          <h1 className="text-3xl font-bold text-foreground">{event.title}</h1>
          <p className="text-muted-foreground mt-2">Quản lý người tham dự sự kiện</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Tổng đăng ký</p>
              <p className="text-2xl font-bold mt-2">{stats.registered}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Đã điểm danh</p>
              <p className="text-2xl font-bold mt-2 text-success">{stats.checked_in}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Chờ duyệt</p>
              <p className="text-2xl font-bold mt-2 text-warning">{stats.pending}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Tổng cộng</p>
              <p className="text-2xl font-bold mt-2">{stats.total}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex gap-2">
              <Search className="h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm theo tên, email hoặc MSSV..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border-0"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Họ tên</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>MSSV</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Điểm danh</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAttendees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Không tìm thấy người tham dự nào
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAttendees.map((attendee) => (
                    <TableRow key={attendee.id}>
                      <TableCell className="font-medium">{attendee.full_name}</TableCell>
                      <TableCell>{attendee.email}</TableCell>
                      <TableCell>{attendee.student_id}</TableCell>
                      <TableCell>
                        {attendee.status === "registered" ? (
                          <Badge className="bg-success/20 text-success">Đã đăng ký</Badge>
                        ) : (
                          <Badge className="bg-warning/20 text-warning">Chờ duyệt</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {attendee.checked_in ? (
                          <div className="flex items-center gap-1">
                            <Check className="h-4 w-4 text-success" />
                            <span className="text-sm">{new Date(attendee.checked_in_at!).toLocaleTimeString("vi-VN")}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">Chưa điểm danh</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {!attendee.checked_in ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCheckIn(attendee.id)}
                            className="text-success border-success hover:bg-success/10"
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Điểm danh
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRemoveCheckIn(attendee.id)}
                            className="text-destructive border-destructive hover:bg-destructive/10"
                          >
                            <X className="h-4 w-4 mr-1" />
                            Bỏ điểm danh
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
