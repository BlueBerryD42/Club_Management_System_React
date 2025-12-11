import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Calendar, MapPin, Users, Eye, Pencil, Trash2 } from "lucide-react";

interface Event {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  start_time: string;
  end_time: string | null;
  max_attendees: number | null;
  event_type: string;
  is_public: boolean;
  requires_approval: boolean;
  status: string;
  current_attendees: number | null;
}

export default function EventManagement() {
  const { clubId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [events, setEvents] = useState<Event[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    start_time: "",
    end_time: "",
    max_attendees: 100,
    event_type: "public_free",
    is_public: true,
    requires_approval: false,
  });

  useEffect(() => {
    // Mock data
    setEvents([
      {
        id: "1",
        title: "Workshop Kỹ năng mềm",
        description: "Hội thảo về kỹ năng giao tiếp",
        location: "Hội trường A",
        start_time: new Date(Date.now() + 86400000 * 7).toISOString(),
        end_time: new Date(Date.now() + 86400000 * 7 + 3600000).toISOString(),
        max_attendees: 100,
        event_type: "public_free",
        is_public: true,
        requires_approval: false,
        status: "upcoming",
        current_attendees: 42,
      },
      {
        id: "2",
        title: "Gặp mặt thành viên mới",
        description: "Tiệc chào đón thành viên mới",
        location: "Khuôn viên trường",
        start_time: new Date(Date.now() + 86400000 * 14).toISOString(),
        end_time: null,
        max_attendees: 150,
        event_type: "member_free",
        is_public: false,
        requires_approval: false,
        status: "upcoming",
        current_attendees: 58,
      },
      {
        id: "3",
        title: "Workshop Kỹ năng mềm",
        description: "Hội thảo về kỹ năng giao tiếp",
        location: "Hội trường A",
        start_time: new Date(Date.now() + 86400000 * 7).toISOString(),
        end_time: new Date(Date.now() + 86400000 * 7 + 3600000).toISOString(),
        max_attendees: 100,
        event_type: "public_paid",
        is_public: true,
        requires_approval: false,
        status: "upcoming",
        current_attendees: 42,
      },
      {
        id: "4",
        title: "Workshop Kỹ năng mềm",
        description: "Hội thảo về kỹ năng giao tiếp",
        location: "Hội trường A",
        start_time: new Date(Date.now() + 86400000 * 7).toISOString(),
        end_time: new Date(Date.now() + 86400000 * 7 + 3600000).toISOString(),
        max_attendees: 100,
        event_type: "member_paid",
        is_public: true,
        requires_approval: false,
        status: "upcoming",
        current_attendees: 42,
      },
    ]);
  }, [clubId]);

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      location: "",
      start_time: "",
      end_time: "",
      max_attendees: 100,
      event_type: "public_free",
      is_public: true,
      requires_approval: false,
    });
    setEditingEvent(null);
  };

  const handleCreate = async () => {
    if (!formData.title || !formData.start_time) {
      toast({ title: "Lỗi", description: "Vui lòng điền đầy đủ thông tin", variant: "destructive" });
      return;
    }

    // TODO: Kết nối API
    toast({ title: "Thành công", description: "Đã tạo sự kiện mới" });
    setShowCreateDialog(false);
    resetForm();
  };

  const handleUpdate = async () => {
    if (!editingEvent) return;
    // TODO: Kết nối API
    toast({ title: "Thành công", description: "Đã cập nhật sự kiện" });
    setShowCreateDialog(false);
    resetForm();
  };

  const handleDelete = async (eventId: string) => {
    // TODO: Kết nối API
    setEvents(events.filter(e => e.id !== eventId));
    toast({ title: "Thành công", description: "Đã xóa sự kiện" });
  };

  const openEditDialog = (event: Event) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      description: event.description || "",
      location: event.location || "",
      start_time: event.start_time.slice(0, 16),
      end_time: event.end_time?.slice(0, 16) || "",
      max_attendees: event.max_attendees || 100,
      event_type: event.event_type || "public_free",
      is_public: event.is_public,
      requires_approval: event.requires_approval,
    });
    setShowCreateDialog(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "upcoming":
        return <Badge className="bg-primary/20 text-primary">Sắp diễn ra</Badge>;
      case "ongoing":
        return <Badge className="bg-success/20 text-success">Đang diễn ra</Badge>;
      case "completed":
        return <Badge variant="outline">Đã kết thúc</Badge>;
      case "cancelled":
        return <Badge className="bg-destructive/20 text-destructive">Đã hủy</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getEventTypeBadge = (eventType: string) => {
    switch (eventType) {
      case "public_free":
        return <Badge className="bg-blue-500/20 text-blue-600">Công khai - Miễn phí</Badge>;
      case "public_paid":
        return <Badge className="bg-purple-500/20 text-purple-600">Công khai - Tính phí</Badge>;
      case "member_free":
        return <Badge className="bg-green-500/20 text-green-600">Nội bộ - Miễn phí</Badge>;
      case "member_paid":
        return <Badge className="bg-orange-500/20 text-orange-600">Nội bộ - Tính phí</Badge>;
      default:
        return <Badge variant="outline">{eventType}</Badge>;
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

        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Quản lý sự kiện</h1>
            <p className="text-muted-foreground mt-2">Tạo và quản lý các sự kiện CLB</p>
          </div>
          <Button onClick={() => { resetForm(); setShowCreateDialog(true); }}>
            <Plus className="mr-2 h-4 w-4" />
            Tạo sự kiện
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên sự kiện</TableHead>
                  <TableHead>Loại</TableHead>
                  <TableHead>Thời gian</TableHead>
                  <TableHead>Địa điểm</TableHead>
                  <TableHead>Tham dự</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Chưa có sự kiện nào
                    </TableCell>
                  </TableRow>
                ) : (
                  events.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell>
                        <p className="font-medium">{event.title}</p>
                      </TableCell>
                      <TableCell>{getEventTypeBadge(event.event_type)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3 w-3" />
                          {new Date(event.start_time).toLocaleString("vi-VN")}
                        </div>
                      </TableCell>
                      <TableCell>
                        {event.location && (
                          <div className="flex items-center gap-1 text-sm">
                            <MapPin className="h-3 w-3" />
                            {event.location}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Users className="h-3 w-3" />
                          {event.current_attendees}/{event.max_attendees}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(event.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => openEditDialog(event)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(event.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-lg max-h-[90vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>{editingEvent ? "Chỉnh sửa sự kiện" : "Tạo sự kiện mới"}</DialogTitle>
              <DialogDescription>Điền thông tin chi tiết về sự kiện</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4 overflow-y-auto flex-1">
              <div className="space-y-2">
                <Label htmlFor="title">Tên sự kiện *</Label>
                <Input id="title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="VD: Workshop Kỹ năng mềm" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="event_type">Loại sự kiện *</Label>
                <Select value={formData.event_type} onValueChange={(value) => setFormData({ ...formData, event_type: value })}>
                  <SelectTrigger id="event_type">
                    <SelectValue placeholder="Chọn loại sự kiện" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public_free">
                      <div className="flex flex-col items-start">
                        <span className="font-medium">Sự kiện công khai miễn phí</span>
                        <span className="text-xs text-muted-foreground">Mọi người đều có thể tham gia miễn phí</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="public_paid">
                      <div className="flex flex-col items-start">
                        <span className="font-medium">Sự kiện công khai tính phí</span>
                        <span className="text-xs text-muted-foreground">Mọi người có thể tham gia nhưng phải đóng phí</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="member_free">
                      <div className="flex flex-col items-start">
                        <span className="font-medium">Sự kiện nội bộ miễn phí</span>
                        <span className="text-xs text-muted-foreground">Chỉ dành cho thành viên CLB, miễn phí</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="member_paid">
                      <div className="flex flex-col items-start">
                        <span className="font-medium">Sự kiện nội bộ tính phí</span>
                        <span className="text-xs text-muted-foreground">Chỉ dành cho thành viên CLB, có phí tham gia</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Mô tả</Label>
                <Textarea id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Chi tiết về sự kiện..." rows={3} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Địa điểm</Label>
                <Input id="location" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} placeholder="VD: Hội trường A" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_time">Thời gian bắt đầu *</Label>
                  <Input id="start_time" type="datetime-local" value={formData.start_time} onChange={(e) => setFormData({ ...formData, start_time: e.target.value })} className="[&::-webkit-calendar-picker-indicator]:ml-auto" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_time">Thời gian kết thúc</Label>
                  <Input id="end_time" type="datetime-local" value={formData.end_time} onChange={(e) => setFormData({ ...formData, end_time: e.target.value })} className="[&::-webkit-calendar-picker-indicator]:ml-auto" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="max_attendees">Số người tối đa</Label>
                <Input id="max_attendees" type="number" value={formData.max_attendees} onChange={(e) => setFormData({ ...formData, max_attendees: parseInt(e.target.value) })} min={1} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setShowCreateDialog(false); resetForm(); }}>Hủy</Button>
              <Button onClick={editingEvent ? handleUpdate : handleCreate}>{editingEvent ? "Lưu thay đổi" : "Tạo sự kiện"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
