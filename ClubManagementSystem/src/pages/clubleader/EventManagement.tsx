import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
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
import { ArrowLeft, Plus, Calendar, MapPin, Users, Loader2, Link as LinkIcon } from "lucide-react";
import { eventService, type Event as BackendEvent } from "@/services/event.service";
import { clubApi } from "@/services/club.service";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { formatVND } from "@/lib/utils";

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
}

// Zod Schema for Event Form
const eventFormSchema = z.object({
  title: z.string().min(3, "Tên sự kiện phải có ít nhất 3 ký tự").max(200, "Tên sự kiện không được vượt quá 200 ký tự"),
  description: z.string().optional(),
  type: z.enum(["PUBLIC", "INTERNAL"], { required_error: "Vui lòng chọn loại sự kiện" }),
  pricingType: z.enum(["FREE", "PAID"], { required_error: "Vui lòng chọn hình thức thanh toán" }),
  price: z.number().min(0, "Giá vé phải lớn hơn hoặc bằng 0").optional(),
  format: z.enum(["ONLINE", "OFFLINE"], { required_error: "Vui lòng chọn hình thức tổ chức" }),
  location: z.string().optional(),
  onlineLink: z.string().url("Link không hợp lệ").optional().or(z.literal("")),
  startTime: z.string().min(1, "Vui lòng chọn thời gian bắt đầu"),
  endTime: z.string().optional(),
  capacity: z.number().min(1, "Số người tối đa phải lớn hơn 0").optional(),
  visibleFrom: z.string().min(1, "Vui lòng chọn thời gian hiển thị"),
  staffIds: z.array(z.string()).optional(),
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
    },
  });

  useEffect(() => {
    if (clubId) {
      fetchEvents();
    }
  }, [clubId]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await eventService.getAll({ clubId });
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
    });
    setPriceDisplay("");
    setEditingEvent(null);
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

    if (!event.isActive) {
      return <Badge className="bg-destructive/20 text-destructive">Đã hủy</Badge>;
    }

    if (now < startTime) {
      return <Badge className="bg-primary/20 text-primary">Sắp diễn ra</Badge>;
    }

    if (endTime && now >= startTime && now < endTime) {
      return <Badge className="bg-success/20 text-success">Đang diễn ra</Badge>;
    }

    if (endTime && now >= endTime) {
      return <Badge variant="outline">Đã kết thúc</Badge>;
    }

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
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Địa điểm <span className="text-destructive">*</span></FormLabel>
                          <FormControl>
                            <Input placeholder="VD: Hội trường A" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
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
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Số người tối đa <span className="text-muted-foreground text-xs">(Để trống = không giới hạn)</span></FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min={1}
                            {...field}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (value === '') {
                                field.onChange(undefined);
                              } else {
                                const numValue = parseInt(value);
                                if (!isNaN(numValue) && numValue > 0) {
                                  field.onChange(numValue);
                                }
                              }
                            }}
                            value={field.value || ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="visibleFrom"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hiển thị từ <span className="text-destructive">*</span></FormLabel>
                        <FormControl>
                          <Input 
                            type="datetime-local" 
                            className="[&::-webkit-calendar-picker-indicator]:ml-auto [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-60 hover:[&::-webkit-calendar-picker-indicator]:opacity-100 [&::-webkit-calendar-picker-indicator]:invert dark:[&::-webkit-calendar-picker-indicator]:invert-0"
                            {...field}
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
                            className="[&::-webkit-calendar-picker-indicator]:ml-auto [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-60 hover:[&::-webkit-calendar-picker-indicator]:opacity-100 [&::-webkit-calendar-picker-indicator]:invert dark:[&::-webkit-calendar-picker-indicator]:invert-0"
                            {...field}
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
                            className="[&::-webkit-calendar-picker-indicator]:ml-auto [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-60 hover:[&::-webkit-calendar-picker-indicator]:opacity-100 [&::-webkit-calendar-picker-indicator]:invert dark:[&::-webkit-calendar-picker-indicator]:invert-0"
                            {...field}
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
                        <FormLabel className="text-base">Phân công nhân viên</FormLabel>
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
                                member.status === "ACTIVE" && member.role !== "LEADER"
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
