import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Calendar, MapPin, Users, Loader2, Link as LinkIcon, Trash2, DollarSign } from "lucide-react";
import { eventService, type Event as BackendEvent } from "@/services/event.service";
import { clubApi } from "@/services/club.service";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { formatVND } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, ChevronsUpDown, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

// Import event locations data
const eventLocationsData = {
  university: "Đại học FPT",
  campuses: [
    {
      campus: "TP. Hồ Chí Minh",
      locations: [
        { id: "HCM-AUD-01", locationName: "Hội trường lớn", capacity: 600 },
        { id: "HCM-SEM-01", locationName: "Phòng hội thảo lớn A", capacity: 650 },
        { id: "HCM-SEM-02", locationName: "Phòng hội thảo lớn B", capacity: 650 },
        { id: "HCM-MP-01", locationName: "Phòng đa năng", capacity: 120 },
        { id: "HCM-CLS-01", locationName: "Phòng học tiêu chuẩn", capacity: 30 },
        { id: "HCM-OUT-01", locationName: "Khu vực ngoài trời trong khuôn viên", capacity: 3000 }
      ]
    },
    {
      campus: "Hà Nội (Hòa Lạc)",
      locations: [
        { id: "HN-AUD-01", locationName: "Hội trường lớn", capacity: 1000 },
        { id: "HN-SEM-01", locationName: "Phòng hội thảo lớn", capacity: 500 },
        { id: "HN-MP-01", locationName: "Phòng đa năng", capacity: 200 },
        { id: "HN-CLS-01", locationName: "Phòng học tiêu chuẩn", capacity: 40 },
        { id: "HN-OUT-01", locationName: "Quảng trường – khu ngoài trời", capacity: 5000 }
      ]
    },
    {
      campus: "Đà Nẵng",
      locations: [
        { id: "DN-AUD-01", locationName: "Hội trường", capacity: 500 },
        { id: "DN-SEM-01", locationName: "Phòng hội thảo", capacity: 300 },
        { id: "DN-MP-01", locationName: "Phòng đa năng", capacity: 150 },
        { id: "DN-CLS-01", locationName: "Phòng học tiêu chuẩn", capacity: 35 },
        { id: "DN-OUT-01", locationName: "Sân sự kiện ngoài trời", capacity: 2000 }
      ]
    },
    {
      campus: "Cần Thơ",
      locations: [
        { id: "CT-AUD-01", locationName: "Hội trường", capacity: 400 },
        { id: "CT-SEM-01", locationName: "Phòng hội thảo", capacity: 250 },
        { id: "CT-MP-01", locationName: "Phòng đa năng", capacity: 120 },
        { id: "CT-CLS-01", locationName: "Phòng học tiêu chuẩn", capacity: 30 },
        { id: "CT-OUT-01", locationName: "Khu vực ngoài trời", capacity: 1500 }
      ]
    },
    {
      campus: "Quy Nhơn",
      locations: [
        { id: "QN-AUD-01", locationName: "Hội trường", capacity: 350 },
        { id: "QN-SEM-01", locationName: "Phòng hội thảo", capacity: 200 },
        { id: "QN-MP-01", locationName: "Phòng đa năng", capacity: 100 },
        { id: "QN-CLS-01", locationName: "Phòng học tiêu chuẩn", capacity: 30 },
        { id: "QN-OUT-01", locationName: "Khu sinh hoạt ngoài trời", capacity: 1200 }
      ]
    }
  ]
};

interface Event {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  startTime: string;
  endTime: string | null;
  capacity: number | null;
  type: 'PUBLIC' | 'INTERNAL';
  pricingType: 'FREE' | 'PAID';
  price: number;
  format: 'ONLINE' | 'OFFLINE';
  onlineLink: string | null;
  isActive: boolean;
  attendees: number;
  visibleFrom: string | null;
  approvalStatus?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'DONE';
}

// Zod Schema for Event Form
const fundRequestItemSchema = z.object({
  name: z.string().min(1, "Tên hạng mục không được để trống"),
  amount: z.number().min(1, "Số tiền phải lớn hơn 0"),
  description: z.string().optional().or(z.literal("")),
  _tempId: z.string().optional(), // Allow temp ID for tracking
});

const eventFormSchema = z.object({
  title: z.string().min(3, "Tên sự kiện phải có ít nhất 3 ký tự").max(200, "Tên sự kiện không được vượt quá 200 ký tự"),
  description: z.string().optional(),
  type: z.enum(["PUBLIC", "INTERNAL"], { required_error: "Vui lòng chọn loại sự kiện" }),
  pricingType: z.enum(["FREE", "PAID"], { required_error: "Vui lòng chọn hình thức thanh toán" }),
  price: z.number().min(0, "Giá vé phải lớn hơn hoặc bằng 0").optional(),
  format: z.enum(["ONLINE", "OFFLINE"], { required_error: "Vui lòng chọn hình thức tổ chức" }),
  location: z.string().optional(),
  onlineLink: z.string().url("Link không hợp lệ").optional().or(z.literal("")),
  startTime: z.string().min(1, "Vui lòng chọn thời gian bắt đầu").refine((val) => {
    if (!val) return false;
    const startTime = new Date(val);
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return startTime >= sevenDaysFromNow;
  }, {
    message: "Thời gian bắt đầu phải cách ngày hiện tại ít nhất 7 ngày",
  }),
  endTime: z.string().optional(),
  capacity: z.number().min(1, "Số người tối đa phải lớn hơn 0").optional(),
  visibleFrom: z.string().min(1, "Vui lòng chọn thời gian hiển thị"),
  staffIds: z.array(z.string()).optional(),
  fundRequest: z.object({
    title: z.string().min(3, "Tiêu đề yêu cầu quỹ phải có ít nhất 3 ký tự"),
    description: z.string().min(10, "Mô tả yêu cầu quỹ phải có ít nhất 10 ký tự"),
    items: z.array(fundRequestItemSchema).min(1, "Phải có ít nhất 1 hạng mục quỹ"),
  }),
}).refine((data) => {
  if (data.pricingType === "PAID") {
    return data.price !== undefined && data.price > 0;
  }
  return true;
}, {
  message: "Vui lòng nhập giá vé cho sự kiện tính phí",
  path: ["price"],
}).refine((data) => {
  if (data.format === "OFFLINE") {
    return data.location && data.location.trim().length > 0;
  }
  return true;
}, {
  message: "Vui lòng nhập địa điểm cho sự kiện offline",
  path: ["location"],
}).refine((data) => {
  if (data.format === "ONLINE") {
    return data.onlineLink && data.onlineLink.trim().length > 0;
  }
  return true;
}, {
  message: "Vui lòng nhập link trực tuyến cho sự kiện online",
  path: ["onlineLink"],
}).refine((data) => {
  if (data.startTime && data.visibleFrom) {
    const startTime = new Date(data.startTime);
    const visibleFrom = new Date(data.visibleFrom);
    return visibleFrom < startTime;
  }
  return true;
}, {
  message: "Thời gian hiển thị phải trước thời gian bắt đầu",
  path: ["visibleFrom"],
}).refine((data) => {
  if (data.startTime && data.endTime) {
    const startTime = new Date(data.startTime);
    const endTime = new Date(data.endTime);
    return endTime > startTime;
  }
  return true;
}, {
  message: "Thời gian kết thúc phải sau thời gian bắt đầu",
  path: ["endTime"],
});

type EventFormValues = z.infer<typeof eventFormSchema>;

// Component to display total fund amount reactively
function FundRequestTotalDisplay({ form }: { form: ReturnType<typeof useForm<EventFormValues>> }) {
  const items = useWatch({
    control: form.control,
    name: "fundRequest.items",
    defaultValue: [],
  }) || [];
  
  const totalAmount = items.reduce((sum: number, item: any) => {
    if (!item) return sum;
    const amount = typeof item.amount === 'number' ? item.amount : (parseInt(String(item.amount || 0)) || 0);
    return sum + amount;
  }, 0);
  
  if (items.length === 0) return null;
  
  return (
    <div className="mb-4 p-4 bg-muted rounded-md">
      <div className="flex items-center justify-between">
        <span className="font-semibold">Tổng số tiền:</span>
        <span className="text-lg font-bold text-primary">
          {totalAmount > 0 ? formatVND(totalAmount) : "0 VNĐ"}
        </span>
      </div>
    </div>
  );
}

export default function EventManagement() {
  const { clubId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [priceDisplay, setPriceDisplay] = useState("");
  const [locationOpen, setLocationOpen] = useState(false);
  const [selectedLocationCapacity, setSelectedLocationCapacity] = useState<number | null>(null);
  const [hasShownCapacityToast, setHasShownCapacityToast] = useState(false);
  const [currentLocationForToast, setCurrentLocationForToast] = useState<string | null>(null);
  const [fundRequestItemAmounts, setFundRequestItemAmounts] = useState<Record<number, string>>({});
  const previousItemsRef = useRef<any[]>([]);
  const isAddingItemRef = useRef(false);
  
  // Flatten all locations from all campuses
  const allLocations = eventLocationsData.campuses.flatMap((campus: any) =>
    campus.locations.map((loc: any) => ({
      ...loc,
      campus: campus.campus,
      displayName: `${loc.locationName} (${campus.campus}) - Sức chứa: ${loc.capacity.toLocaleString('vi-VN')} người`
    }))
  );

  // Fetch club members for staff selection
  const { data: clubMembersData, isLoading: membersLoading } = useQuery({
    queryKey: ['club-members', clubId],
    queryFn: async () => {
      if (!clubId) return { data: [] };
      const response = await clubApi.getMembers(clubId);
      return response.data;
    },
    enabled: !!clubId && showCreateDialog,
  });

  const clubMembers = clubMembersData?.data || [];
  
  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      title: "",
      description: "",
      location: "",
      onlineLink: "",
      startTime: "",
      endTime: "",
      capacity: undefined,
      type: "PUBLIC",
      pricingType: "FREE",
      price: 0,
      format: "OFFLINE",
      visibleFrom: "",
      staffIds: [],
      fundRequest: {
        title: "",
        description: "",
        items: [],
      },
    },
  });

  // Check location when form value changes
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "location" && value.location) {
        // Try to match with predefined locations
        const matched = allLocations.find((loc: any) => 
          loc.locationName === value.location || 
          value.location?.trim() === loc.locationName.trim()
        );
        if (matched) {
          setSelectedLocationCapacity(matched.capacity);
        } else {
          setSelectedLocationCapacity(null);
        }
      }
      // Reset location capacity when switching to ONLINE format
      if (name === "format" && value.format === "ONLINE") {
        setSelectedLocationCapacity(null);
      }
    });
    return () => subscription.unsubscribe();
  }, [form, allLocations]);


  useEffect(() => {
    if (clubId) {
      fetchEvents();
    }
  }, [clubId]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await eventService.getAll({ 
        clubId,
        includePending: 'true', // Include pending and rejected events for club leader
        includeInactive: 'true' // Include ended events too
      });
      const mappedEvents: Event[] = (response.data || []).map((event: BackendEvent) => ({
        id: event.id,
        title: event.title,
        description: event.description,
        location: event.location,
        startTime: event.startTime,
        endTime: event.endTime,
        capacity: event.capacity ?? null,
        type: event.type,
        pricingType: event.pricingType,
        price: event.price,
        format: event.format,
        onlineLink: event.onlineLink,
        isActive: event.isActive,
        attendees: event._count?.tickets || 0,
        visibleFrom: event.visibleFrom,
        approvalStatus: event.approvalStatus,
      }));
      setEvents(mappedEvents);
    } catch (error: any) {
      console.error("Error fetching events:", error);
      toast({
        title: "Lỗi",
        description: error.response?.data?.message || "Không thể tải danh sách sự kiện",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    form.reset({
      title: "",
      description: "",
      location: "",
      onlineLink: "",
      startTime: "",
      endTime: "",
      capacity: undefined,
      type: "PUBLIC",
      pricingType: "FREE",
      price: 0,
      format: "OFFLINE",
      visibleFrom: "",
      staffIds: [],
      fundRequest: {
        title: "",
        description: "",
        items: [],
      },
    });
    setPriceDisplay("");
    setEditingEvent(null);
    setHasShownCapacityToast(false);
    setCurrentLocationForToast(null);
    setSelectedLocationCapacity(null);
    setFundRequestItemAmounts({});
  };

  const handleCreate = async (data: EventFormValues) => {
    if (!clubId) {
      toast({ title: "Lỗi", description: "Không tìm thấy CLB", variant: "destructive" });
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        title: data.title,
        description: data.description || undefined,
        type: data.type,
        pricingType: data.pricingType,
        price: data.pricingType === "PAID" ? data.price : undefined,
        capacity: data.capacity ?? null,
        startTime: new Date(data.startTime).toISOString(),
        endTime: data.endTime ? new Date(data.endTime).toISOString() : undefined,
        format: data.format,
        location: data.format === "OFFLINE" ? data.location : undefined,
        onlineLink: data.format === "ONLINE" ? data.onlineLink : undefined,
        visibleFrom: data.visibleFrom ? new Date(data.visibleFrom).toISOString() : undefined,
        staffIds: data.staffIds && data.staffIds.length > 0 ? data.staffIds : undefined,
        fundRequest: {
          title: data.fundRequest.title,
          description: data.fundRequest.description,
          items: data.fundRequest.items.map(item => ({
            name: item.name,
            amount: item.amount,
            description: item.description || undefined,
          })),
        },
      };

      await eventService.create(clubId, payload);
      toast({ title: "Thành công", description: "Đã tạo sự kiện mới" });
      setShowCreateDialog(false);
      resetForm();
      fetchEvents();
    } catch (error: any) {
      console.error("Error creating event:", error);
      toast({
        title: "Lỗi",
        description: error.response?.data?.message || "Không thể tạo sự kiện",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (data: EventFormValues) => {
    if (!editingEvent) {
      toast({ title: "Lỗi", description: "Không tìm thấy sự kiện", variant: "destructive" });
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        title: data.title,
        description: data.description || undefined,
        type: data.type,
        pricingType: data.pricingType,
        price: data.pricingType === "PAID" ? data.price : undefined,
        capacity: data.capacity ?? null,
        startTime: new Date(data.startTime).toISOString(),
        endTime: data.endTime ? new Date(data.endTime).toISOString() : undefined,
        format: data.format,
        location: data.format === "OFFLINE" ? data.location : undefined,
        onlineLink: data.format === "ONLINE" ? data.onlineLink : undefined,
        visibleFrom: data.visibleFrom ? new Date(data.visibleFrom).toISOString() : undefined,
      };

      await eventService.update(editingEvent.id, payload);
      toast({ title: "Thành công", description: "Đã cập nhật sự kiện" });
      setShowCreateDialog(false);
      resetForm();
      fetchEvents();
    } catch (error: any) {
      console.error("Error updating event:", error);
      toast({
        title: "Lỗi",
        description: error.response?.data?.message || "Không thể cập nhật sự kiện",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (event: Event) => {
    const now = new Date();
    const startTime = new Date(event.startTime);
    const endTime = event.endTime ? new Date(event.endTime) : null;
    const visibleFrom = event.visibleFrom ? new Date(event.visibleFrom) : null;
    const approvalStatus = event.approvalStatus;

    // Check approval status first (for pending/rejected/done events)
    if (approvalStatus === 'PENDING') {
      return <Badge className="bg-warning/20 text-warning">Chờ duyệt quỹ</Badge>;
    }
    
    if (approvalStatus === 'REJECTED') {
      return <Badge className="bg-destructive/20 text-destructive">Đã từ chối</Badge>;
    }

    // Check if event has finished successfully (DONE status)
    if (approvalStatus === 'DONE') {
      return <Badge variant="outline">Đã kết thúc</Badge>;
    }

    // Check if event has ended (passed endTime)
    if (endTime && now >= endTime) {
      return <Badge variant="outline">Đã kết thúc</Badge>;
    }

    // Only show "Đã hủy" if isActive is false AND event hasn't finished (not ended)
    // Note: approvalStatus !== 'DONE' check is not needed here since we already handled 'DONE' above
    if (!event.isActive && (!endTime || now < endTime)) {
      return <Badge className="bg-destructive/20 text-destructive">Đã hủy</Badge>;
    }

    // Check if registration hasn't opened yet
    if (visibleFrom && now < visibleFrom) {
      return <Badge className="bg-amber-500/20 text-amber-600">Chưa mở đăng ký</Badge>;
    }

    // Check if event hasn't started yet (but registration is open)
    if (now < startTime) {
      return <Badge className="bg-primary/20 text-primary">Sắp diễn ra</Badge>;
    }

    // Check if event is currently happening
    if (endTime && now >= startTime && now < endTime) {
      return <Badge className="bg-success/20 text-success">Đang diễn ra</Badge>;
    }

    // Fallback: event is happening (no end time specified)
    return <Badge variant="outline">Đang diễn ra</Badge>;
  };

  const getEventTypeBadge = (event: Event) => {
    const typeLabel = event.type === "PUBLIC" ? "Công khai" : "Nội bộ";
    const pricingLabel = event.pricingType === "FREE" ? "Miễn phí" : "Tính phí";
    
    if (event.type === "PUBLIC" && event.pricingType === "FREE") {
      return <Badge className="bg-blue-500/20 text-blue-600">{typeLabel} - {pricingLabel}</Badge>;
    }
    if (event.type === "PUBLIC" && event.pricingType === "PAID") {
      return <Badge className="bg-purple-500/20 text-purple-600">{typeLabel} - {pricingLabel}</Badge>;
    }
    if (event.type === "INTERNAL" && event.pricingType === "FREE") {
      return <Badge className="bg-green-500/20 text-green-600">{typeLabel} - {pricingLabel}</Badge>;
    }
    if (event.type === "INTERNAL" && event.pricingType === "PAID") {
      return <Badge className="bg-orange-500/20 text-orange-600">{typeLabel} - {pricingLabel}</Badge>;
    }
    return <Badge variant="outline">{typeLabel} - {pricingLabel}</Badge>;
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
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                    </TableCell>
                  </TableRow>
                ) : events.length === 0 ? (
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
                      <TableCell>{getEventTypeBadge(event)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(event.startTime), "dd/MM/yyyy HH:mm", { locale: vi })}
                        </div>
                      </TableCell>
                      <TableCell>
                        {event.format === "ONLINE" ? (
                          <div className="flex items-center gap-1 text-sm">
                            <LinkIcon className="h-3 w-3" />
                            <span className="line-clamp-1 max-w-[200px]">{event.onlineLink || "Chưa có link"}</span>
                          </div>
                        ) : event.location ? (
                          <div className="flex items-center gap-1 text-sm">
                            <MapPin className="h-3 w-3" />
                            <span className="line-clamp-1 max-w-[200px]">{event.location}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">Chưa cập nhật</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Users className="h-3 w-3" />
                          {event.capacity 
                            ? `${event.attendees}/${event.capacity}` 
                            : `${event.attendees} (Không giới hạn)`}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(event)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => navigate(`/club-leader/${clubId}/events/${event.id}/manage`)}
                          >
                            Quản lý
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
          <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>{editingEvent ? "Chỉnh sửa sự kiện" : "Tạo sự kiện mới"}</DialogTitle>
              <DialogDescription>Điền thông tin chi tiết về sự kiện</DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form id="event-form" onSubmit={form.handleSubmit(editingEvent ? handleUpdate : handleCreate)} className="space-y-4 py-4 px-4 overflow-y-auto flex-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                <p className="text-sm text-muted-foreground mb-2">
                  <span className="text-destructive">*</span> Các trường bắt buộc
                </p>
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tên sự kiện <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="VD: Workshop Kỹ năng mềm" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Loại sự kiện <span className="text-destructive">*</span></FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Chọn loại" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="PUBLIC">Công khai</SelectItem>
                            <SelectItem value="INTERNAL">Nội bộ</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="pricingType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hình thức thanh toán <span className="text-destructive">*</span></FormLabel>
                        <Select onValueChange={(value) => {
                          field.onChange(value);
                          if (value === "FREE") {
                            form.setValue("price", 0);
                            setPriceDisplay("");
                          }
                        }} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Chọn hình thức" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="FREE">Miễn phí</SelectItem>
                            <SelectItem value="PAID">Tính phí</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="format"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hình thức tổ chức <span className="text-destructive">*</span></FormLabel>
                        <Select onValueChange={(value) => {
                          field.onChange(value);
                          if (value === "ONLINE") {
                            form.setValue("location", "");
                          } else {
                            form.setValue("onlineLink", "");
                          }
                        }} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Chọn hình thức" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="OFFLINE">Offline</SelectItem>
                            <SelectItem value="ONLINE">Online</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                {form.watch("pricingType") === "PAID" && (
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => {
                      // Always show formatted value, or raw value when editing
                      const currentValue = field.value || 0;
                      const displayValue = priceDisplay !== "" 
                        ? priceDisplay 
                        : (currentValue > 0 ? formatVND(currentValue) : "");
                      
                      return (
                        <FormItem>
                          <FormLabel>Giá vé (VNĐ) <span className="text-destructive">*</span></FormLabel>
                          <FormControl>
                            <Input 
                              type="text" 
                              value={displayValue} 
                              onChange={(e) => {
                                // Remove all non-digit characters
                                const rawValue = e.target.value.replace(/[^\d]/g, '');
                                const numValue = parseInt(rawValue) || 0;
                                
                                // Update form value
                                field.onChange(numValue);
                                
                                // Auto-format as user types
                                if (rawValue) {
                                  setPriceDisplay(formatVND(numValue));
                                } else {
                                  setPriceDisplay("");
                                }
                              }}
                              onFocus={(e) => {
                                // When focused, show raw number for easier editing
                                const rawValue = field.value ? field.value.toString() : "";
                                setPriceDisplay(rawValue);
                                // Select all text for easy replacement
                                setTimeout(() => e.target.select(), 0);
                              }}
                              onBlur={(e) => {
                                // Ensure formatted on blur
                                const rawValue = e.target.value.replace(/[^\d]/g, '');
                                const numValue = parseInt(rawValue) || 0;
                                if (numValue > 0) {
                                  setPriceDisplay(formatVND(numValue));
                                } else {
                                  setPriceDisplay("");
                                }
                                field.onBlur();
                              }}
                              placeholder="VD: 50.000"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />
                )}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mô tả</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Chi tiết về sự kiện..." rows={3} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  {form.watch("format") === "OFFLINE" ? (
                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => {
                        const currentLocation = field.value || "";
                        
                        return (
                          <FormItem>
                            <FormLabel>Địa điểm <span className="text-destructive">*</span></FormLabel>
                            <div className="flex gap-2">
                              <FormControl className="flex-1">
                                <Input 
                                  placeholder="VD: Phòng NVH.618 hoặc chọn từ danh sách..." 
                                  value={currentLocation}
                                  onChange={(e) => {
                                    field.onChange(e.target.value);
                                    // Check if it matches a predefined location
                                    const matched = allLocations.find((loc: any) => 
                                      loc.locationName === e.target.value || 
                                      e.target.value.trim() === loc.locationName.trim()
                                    );
                                    if (matched) {
                                      setSelectedLocationCapacity(matched.capacity);
                                      // Auto-populate capacity field with location capacity
                                      form.setValue("capacity", matched.capacity);
                                      // Reset toast tracking when location changes
                                      if (currentLocationForToast !== matched.locationName) {
                                        setHasShownCapacityToast(false);
                                        setCurrentLocationForToast(matched.locationName);
                                      }
                                    } else {
                                      setSelectedLocationCapacity(null);
                                      setHasShownCapacityToast(false);
                                      setCurrentLocationForToast(null);
                                    }
                                  }}
                                />
                              </FormControl>
                              <Popover open={locationOpen} onOpenChange={setLocationOpen}>
                                <PopoverTrigger asChild>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    className="shrink-0"
                                  >
                                    <ChevronsUpDown className="h-4 w-4" />
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent 
                                  className="w-[400px] p-0" 
                                  align="start"
                                  onWheel={(e) => {
                                    // Prevent scroll from bubbling to parent dialog
                                    e.stopPropagation();
                                  }}
                                >
                                  <Command className="h-[400px] flex flex-col">
                                    <CommandInput placeholder="Tìm kiếm địa điểm..." className="border-b" />
                                    <CommandList 
                                      className="flex-1 overflow-y-auto overflow-x-hidden min-h-0"
                                      onWheel={(e) => {
                                        // Stop propagation to prevent dialog scrolling when scrolling the list
                                        e.stopPropagation();
                                      }}
                                    >
                                      <CommandEmpty>Không tìm thấy địa điểm.</CommandEmpty>
                                      {eventLocationsData.campuses.map((campus: any) => (
                                        <CommandGroup key={campus.campus} heading={campus.campus}>
                                          {campus.locations.map((location: any) => (
                                            <CommandItem
                                              key={location.id}
                                              value={`${location.locationName} ${campus.campus}`}
                                              onSelect={() => {
                                                field.onChange(location.locationName);
                                                setSelectedLocationCapacity(location.capacity);
                                                // Auto-populate capacity field with location capacity
                                                form.setValue("capacity", location.capacity);
                                                // Reset toast tracking when location changes
                                                if (currentLocationForToast !== location.locationName) {
                                                  setHasShownCapacityToast(false);
                                                  setCurrentLocationForToast(location.locationName);
                                                }
                                                setLocationOpen(false);
                                              }}
                                            >
                                              <Check
                                                className={cn(
                                                  "mr-2 h-4 w-4",
                                                  field.value === location.locationName
                                                    ? "opacity-100"
                                                    : "opacity-0"
                                                )}
                                              />
                                              <div className="flex-1">
                                                <div className="font-medium">{location.locationName}</div>
                                                <div className="text-xs text-muted-foreground">
                                                  Sức chứa: {location.capacity.toLocaleString('vi-VN')} người
                                                </div>
                                              </div>
                                            </CommandItem>
                                          ))}
                                        </CommandGroup>
                                      ))}
                                    </CommandList>
                                  </Command>
                                </PopoverContent>
                              </Popover>
                            </div>
                            <FormMessage />
                          </FormItem>
                        );
                      }}
                    />
                  ) : (
                    <FormField
                      control={form.control}
                      name="onlineLink"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Link trực tuyến <span className="text-destructive">*</span></FormLabel>
                          <FormControl>
                            <Input placeholder="VD: https://meet.google.com/xxx-xxxx-xxx" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  <FormField
                    control={form.control}
                    name="capacity"
                    render={({ field }) => {
                      const capacityValue = field.value;
                      const exceedsCapacity = selectedLocationCapacity !== null && 
                                              capacityValue !== undefined && 
                                              capacityValue > selectedLocationCapacity;
                      
                      return (
                        <FormItem>
                          <FormLabel>Số người tối đa <span className="text-muted-foreground text-xs">(Để trống = không giới hạn)</span></FormLabel>
                          <FormControl>
                            <div className="space-y-2">
                              <Input 
                                type="number" 
                                min={1}
                                value={field.value || ""}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  if (value === '') {
                                    field.onChange(undefined);
                                  } else {
                                    const numValue = parseInt(value);
                                    if (!isNaN(numValue) && numValue > 0) {
                                      field.onChange(numValue);
                                      
                                      // Show toast warning only once per location when capacity exceeds
                                      if (selectedLocationCapacity !== null && numValue > selectedLocationCapacity && !hasShownCapacityToast) {
                                        toast({
                                          title: "Lưu ý về sức chứa",
                                          description: `Số người tối đa (${numValue.toLocaleString('vi-VN')}) có thể vượt quá sức chứa của địa điểm đã chọn (${selectedLocationCapacity.toLocaleString('vi-VN')} người).`,
                                          variant: "default",
                                        });
                                        setHasShownCapacityToast(true);
                                      }
                                    }
                                  }
                                }}
                                onBlur={field.onBlur}
                                className={exceedsCapacity ? "border-amber-500" : ""}
                              />
                              {exceedsCapacity && (
                                <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/30 p-2 rounded-md border border-amber-200 dark:border-amber-800">
                                  <AlertTriangle className="h-4 w-4" />
                                  <span>
                                    Lưu ý: Số người tối đa ({capacityValue?.toLocaleString('vi-VN')}) có thể vượt quá sức chứa của địa điểm ({selectedLocationCapacity.toLocaleString('vi-VN')} người)
                                  </span>
                                </div>
                              )}
                              {selectedLocationCapacity !== null && !exceedsCapacity && capacityValue && (
                                <div className="text-xs text-muted-foreground">
                                  Sức chứa địa điểm: {selectedLocationCapacity.toLocaleString('vi-VN')} người
                                </div>
                              )}
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="visibleFrom"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ngày mở đăng ký <span className="text-destructive">*</span></FormLabel>
                        <FormControl>
                          <Input 
                            type="datetime-local" 
                            className="[&::-webkit-calendar-picker-indicator]:ml-auto [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-60 hover:[&::-webkit-calendar-picker-indicator]:opacity-100 [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:brightness-0"
                            {...field}
                            onChange={(e) => {
                              field.onChange(e);
                              // Trigger validation for startTime when visibleFrom changes
                              form.trigger("startTime");
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="startTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Thời gian bắt đầu <span className="text-destructive">*</span></FormLabel>
                        <FormControl>
                          <Input 
                            type="datetime-local" 
                            className="[&::-webkit-calendar-picker-indicator]:ml-auto [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-60 hover:[&::-webkit-calendar-picker-indicator]:opacity-100 [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:brightness-0"
                            min={(() => {
                              const now = new Date();
                              const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
                              // Format as YYYY-MM-DDTHH:mm for datetime-local input
                              const year = sevenDaysFromNow.getFullYear();
                              const month = String(sevenDaysFromNow.getMonth() + 1).padStart(2, '0');
                              const day = String(sevenDaysFromNow.getDate()).padStart(2, '0');
                              const hours = String(sevenDaysFromNow.getHours()).padStart(2, '0');
                              const minutes = String(sevenDaysFromNow.getMinutes()).padStart(2, '0');
                              return `${year}-${month}-${day}T${hours}:${minutes}`;
                            })()}
                            {...field}
                            onChange={(e) => {
                              field.onChange(e);
                              // Trigger validation for visibleFrom and endTime when startTime changes
                              form.trigger("visibleFrom");
                              form.trigger("endTime");
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="endTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Thời gian kết thúc</FormLabel>
                        <FormControl>
                          <Input 
                            type="datetime-local" 
                            className="[&::-webkit-calendar-picker-indicator]:ml-auto [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-60 hover:[&::-webkit-calendar-picker-indicator]:opacity-100 [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:brightness-0"
                            {...field}
                            onChange={(e) => {
                              field.onChange(e);
                              // Trigger validation for startTime when endTime changes
                              form.trigger("startTime");
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* Staff Assignment Section */}
                <FormField
                  control={form.control}
                  name="staffIds"
                  render={({ field }) => (
                    <FormItem>
                      <div className="mb-4">
                        <FormLabel className="text-base">Phân công thành viên</FormLabel>
                        <FormDescription>
                          Chọn thành viên CLB để làm nhân viên quản lý sự kiện (có thể chọn nhiều)
                        </FormDescription>
                      </div>
                      {membersLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                      ) : clubMembers.length === 0 ? (
                        <div className="text-sm text-muted-foreground py-4">
                          Không có thành viên nào trong CLB
                        </div>
                      ) : (
                        <div className="border rounded-md p-4 max-h-[200px] overflow-y-auto">
                          <div className="space-y-3">
                            {clubMembers
                              .filter((member: any) => 
                                member.status === "ACTIVE" && member.role !== "LEADER" && member.role !== "TREASURER"
                              )
                              .map((member: any) => {
                                const userId = member.userId || member.user?.id;
                                const userName = member.user?.fullName || "Unknown";
                                const userEmail = member.user?.email || "";
                                const memberRole = member.role || "MEMBER";
                                
                                if (!userId) return null;
                                
                                return (
                                  <div
                                    key={userId}
                                    className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3 hover:bg-muted/50 transition-colors"
                                  >
                                    <Checkbox
                                      checked={field.value?.includes(userId)}
                                      onCheckedChange={(checked) => {
                                        const currentValue = field.value || [];
                                        return checked
                                          ? field.onChange([...currentValue, userId])
                                          : field.onChange(
                                              currentValue.filter((value) => value !== userId)
                                            );
                                      }}
                                    />
                                    <label className="font-normal flex-1 cursor-pointer" onClick={() => {
                                      const currentValue = field.value || [];
                                      const isChecked = currentValue.includes(userId);
                                      if (isChecked) {
                                        field.onChange(currentValue.filter((value) => value !== userId));
                                      } else {
                                        field.onChange([...currentValue, userId]);
                                      }
                                    }}>
                                      <div className="flex items-center justify-between">
                                        <div>
                                          <div className="font-medium">{userName}</div>
                                          <div className="text-xs text-muted-foreground">{userEmail}</div>
                                        </div>
                                        {memberRole !== "MEMBER" && (
                                          <Badge variant="outline" className="ml-2">
                                            {memberRole === "LEADER" ? "Chủ nhiệm" : 
                                             memberRole === "STAFF" ? "Nhân viên" : 
                                             memberRole === "TREASURER" ? "Thủ quỹ" : memberRole}
                                          </Badge>
                                        )}
                                      </div>
                                    </label>
                                  </div>
                                );
                              })}
                          </div>
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Fund Request Section */}
                <div className="border-t pt-6 mt-6">
                  <h3 className="text-lg font-semibold mb-4">Yêu cầu quỹ</h3>
                  
                  <FormField
                    control={form.control}
                    name="fundRequest.title"
                    render={({ field }) => (
                      <FormItem className="mb-4">
                        <FormLabel>Tiêu đề yêu cầu quỹ <span className="text-destructive">*</span></FormLabel>
                        <FormControl>
                          <Input placeholder="VD: Yêu cầu quỹ cho Workshop React Native" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="fundRequest.description"
                    render={({ field }) => (
                      <FormItem className="mb-4">
                        <FormLabel>Mô tả yêu cầu quỹ <span className="text-destructive">*</span></FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Mô tả chi tiết về yêu cầu quỹ và lý do cần thiết..." 
                            rows={3} 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="fundRequest.items"
                    render={({ field }) => {
                      const items = field.value || [];

                      return (
                        <FormItem>
                          <div className="flex items-center justify-between mb-4">
                            <FormLabel>Hạng mục quỹ <span className="text-destructive">*</span></FormLabel>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                isAddingItemRef.current = true;
                                
                                // Get the absolute latest form values to ensure we have everything
                                const currentFormItems = form.getValues("fundRequest.items") || [];
                                
                                // Also get from field.value as backup
                                const fieldItems = field.value || [];
                                
                                // Use whichever has more items (likely the form values)
                                const sourceItems = currentFormItems.length >= fieldItems.length ? currentFormItems : fieldItems;
                                
                                // Create a deep copy with ALL properties preserved
                                const preservedItems = sourceItems.map((item: any) => {
                                  return {
                                    name: item?.name ?? "",
                                    amount: typeof item?.amount === 'number' ? item.amount : (parseInt(String(item?.amount || 0)) || 0),
                                    description: item?.description ?? "",
                                    _tempId: (item as any)?._tempId || undefined
                                  };
                                });
                                
                                // Create new item
                                const newItem = { 
                                  name: "", 
                                  amount: 0, 
                                  description: "", 
                                  _tempId: `item-${Date.now()}-${Math.random()}`
                                };
                                
                                const newItems = [...preservedItems, newItem];
                                
                                // Store for recovery
                                previousItemsRef.current = preservedItems;
                                
                                // ONLY use field.onChange - this is the correct way to update form fields
                                // Using setValue can cause conflicts and state loss
                                field.onChange(newItems);
                                
                                // Initialize display state
                                const newIndex = newItems.length - 1;
                                setFundRequestItemAmounts(prev => ({
                                  ...prev,
                                  [newIndex]: ""
                                }));
                                
                                // Verify values are preserved after a short delay
                                setTimeout(() => {
                                  const verifyItems = form.getValues("fundRequest.items") || [];
                                  // If items were lost or changed, restore them
                                  if (verifyItems.length !== newItems.length) {
                                    // Restore using field.onChange to maintain form connection
                                    field.onChange(newItems);
                                  } else {
                                    // Check if any items lost their data
                                    const needsRestore = verifyItems.some((item: any, idx: number) => {
                                      const expected = preservedItems[idx];
                                      return expected && (
                                        (item?.name || "") !== (expected.name || "") ||
                                        (item?.amount || 0) !== (expected.amount || 0)
                                      );
                                    });
                                    if (needsRestore) {
                                      field.onChange(newItems);
                                    }
                                  }
                                  isAddingItemRef.current = false;
                                }, 100);
                              }}
                            >
                              <Plus className="mr-2 h-4 w-4" />
                              Thêm hạng mục
                            </Button>
                          </div>
                          
                          {items.length === 0 ? (
                            <div className="text-sm text-muted-foreground py-4 border rounded-md text-center">
                              Chưa có hạng mục nào. Vui lòng thêm ít nhất 1 hạng mục.
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {items.map((item, index) => {
                                // Use a stable key - prefer tempId if available, otherwise use index
                                const itemKey = (item as any)._tempId || `item-${index}`;
                                
                                return (
                                  <Card key={itemKey} className="p-4">
                                    <div className="flex items-start justify-between mb-4">
                                      <h4 className="font-medium">Hạng mục {index + 1}</h4>
                                      {items.length > 1 && (
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => {
                                            const newItems = items.filter((_, i) => i !== index);
                                            field.onChange(newItems);
                                            // Reindex amount displays for remaining items
                                            setFundRequestItemAmounts(prev => {
                                              const updated: Record<number, string> = {};
                                              Object.keys(prev).forEach((key) => {
                                                const oldIndex = parseInt(key);
                                                if (oldIndex < index) {
                                                  updated[oldIndex] = prev[oldIndex];
                                                } else if (oldIndex > index) {
                                                  updated[oldIndex - 1] = prev[oldIndex];
                                                }
                                                // Skip the removed index
                                              });
                                              return updated;
                                            });
                                          }}
                                        >
                                          <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                      )}
                                    </div>
                                    
                                    <div className="space-y-4">
                                      <FormField
                                        control={form.control}
                                        name={`fundRequest.items.${index}.name`}
                                        render={({ field: itemField }) => (
                                          <FormItem>
                                            <FormLabel>Tên hạng mục <span className="text-destructive">*</span></FormLabel>
                                            <FormControl>
                                              <Input placeholder="VD: Thuê hội trường" {...itemField} />
                                            </FormControl>
                                            <FormMessage />
                                          </FormItem>
                                        )}
                                      />

                                      <FormField
                                        control={form.control}
                                        name={`fundRequest.items.${index}.amount`}
                                        render={({ field: itemField }) => {
                                          const currentValue = itemField.value || 0;
                                          // Use display state if available, otherwise format from form value
                                          const displayValue = fundRequestItemAmounts[index] !== undefined 
                                            ? fundRequestItemAmounts[index]
                                            : (currentValue > 0 ? formatVND(currentValue) : "");
                                          
                                          return (
                                            <FormItem>
                                              <FormLabel>Số tiền (VNĐ) <span className="text-destructive">*</span></FormLabel>
                                              <FormControl>
                                                <div className="relative">
                                                  <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                                  <Input
                                                    type="text"
                                                    className="pl-9"
                                                    value={displayValue}
                                                    onChange={(e) => {
                                                      const inputValue = e.target.value;
                                                      
                                                      // If user is typing formatted value, extract digits
                                                      const rawValue = inputValue.replace(/[^\d]/g, '');
                                                      const numValue = parseInt(rawValue) || 0;
                                                      
                                                      // Update form value immediately
                                                      itemField.onChange(numValue);
                                                      
                                                      // Update display state - format if has value, otherwise keep what user typed (for deletion)
                                                      if (rawValue) {
                                                        const formatted = formatVND(numValue);
                                                        setFundRequestItemAmounts(prev => ({
                                                          ...prev,
                                                          [index]: formatted
                                                        }));
                                                      } else if (inputValue === "") {
                                                        // User cleared the field
                                                        setFundRequestItemAmounts(prev => ({
                                                          ...prev,
                                                          [index]: ""
                                                        }));
                                                      }
                                                    }}
                                                    onFocus={(e) => {
                                                      // When focused, show raw number for easier editing
                                                      const rawValue = itemField.value ? itemField.value.toString() : "";
                                                      setFundRequestItemAmounts(prev => ({
                                                        ...prev,
                                                        [index]: rawValue
                                                      }));
                                                      // Select all text for easy replacement
                                                      setTimeout(() => e.target.select(), 0);
                                                    }}
                                                    onBlur={(e) => {
                                                      // Ensure formatted on blur
                                                      const rawValue = e.target.value.replace(/[^\d]/g, '');
                                                      const numValue = parseInt(rawValue) || 0;
                                                      if (numValue > 0) {
                                                        setFundRequestItemAmounts(prev => ({
                                                          ...prev,
                                                          [index]: formatVND(numValue)
                                                        }));
                                                      } else {
                                                        setFundRequestItemAmounts(prev => ({
                                                          ...prev,
                                                          [index]: ""
                                                        }));
                                                      }
                                                      itemField.onBlur();
                                                    }}
                                                    placeholder="VD: 2.000.000"
                                                  />
                                                </div>
                                              </FormControl>
                                              <FormMessage />
                                            </FormItem>
                                          );
                                        }}
                                      />

                                      <FormField
                                        control={form.control}
                                        name={`fundRequest.items.${index}.description`}
                                        render={({ field: itemField }) => (
                                          <FormItem>
                                            <FormLabel>Mô tả</FormLabel>
                                            <FormControl>
                                              <Textarea 
                                                placeholder="VD: Chi phí thuê phòng trong 4 giờ" 
                                                rows={2} 
                                                {...itemField} 
                                              />
                                            </FormControl>
                                            <FormMessage />
                                          </FormItem>
                                        )}
                                      />
                                    </div>
                                  </Card>
                                );
                              })}
                              
                              {/* Display total amount reactively */}
                              <FundRequestTotalDisplay form={form} />
                            </div>
                          )}
                          {form.formState.errors.fundRequest?.items && (
                            <p className="text-sm font-medium text-destructive">
                              {(() => {
                                const error = form.formState.errors.fundRequest.items;
                                if (error && typeof error === 'object' && 'message' in error) {
                                  return String(error.message);
                                }
                                if (Array.isArray(error)) {
                                  const firstError = error.find(e => e && typeof e === 'object' && 'message' in e);
                                  return firstError ? String(firstError.message) : "Vui lòng kiểm tra lại các hạng mục quỹ";
                                }
                                return "Vui lòng kiểm tra lại các hạng mục quỹ";
                              })()}
                            </p>
                          )}
                        </FormItem>
                      );
                    }}
                  />
                </div>
              </form>
            </Form>
            <DialogFooter>
              <Button 
                type="button"
                variant="outline" 
                onClick={() => { setShowCreateDialog(false); resetForm(); }} 
                disabled={isSubmitting}
              >
                Hủy
              </Button>
              <Button 
                type="submit"
                form="event-form"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  editingEvent ? "Lưu thay đổi" : "Tạo sự kiện"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
