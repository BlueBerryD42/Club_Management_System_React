import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { eventService } from "@/services/event.service";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  Link as LinkIcon,
  Loader2,
  Eye,
  Trash2,
  CheckCircle2,
  XCircle,
  Edit,
  Save,
  X,
  Globe,
} from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

const EventDetailManagement = () => {
  const { clubId, eventId } = useParams<{ clubId: string; eventId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [priceDisplay, setPriceDisplay] = useState("");
  const [locationOpen, setLocationOpen] = useState(false);
  const [selectedLocationCapacity, setSelectedLocationCapacity] = useState<number | null>(null);
  
  // Flatten all locations from all campuses
  const allLocations = eventLocationsData.campuses.flatMap((campus: any) =>
    campus.locations.map((loc: any) => ({
      ...loc,
      campus: campus.campus,
      displayName: `${loc.locationName} (${campus.campus}) - Sức chứa: ${loc.capacity.toLocaleString('vi-VN')} người`
    }))
  );

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
    },
  });

  // Fetch event with caching
  const { data: eventData, isLoading: loading, error: eventError } = useQuery({
    queryKey: ["event-details", eventId],
    queryFn: async () => {
      if (!eventId) return null;
      return await eventService.getById(eventId);
    },
    enabled: !!eventId,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: 1,
  });

  const event = eventData || null;

  // Fetch participants with caching
  const { data: participantsData, isLoading: loadingParticipants } = useQuery({
    queryKey: ["event-participants", eventId],
    queryFn: async () => {
      if (!eventId) return null;
      return await eventService.getParticipants(eventId);
    },
    enabled: !!eventId,
    staleTime: 2 * 60 * 1000, // Cache for 2 minutes
  });

  const participants = participantsData?.data?.participants || [];

  // Populate form when event data is loaded
  useEffect(() => {
    if (eventData) {
      const startDate = new Date(eventData.startTime);
      const endDate = eventData.endTime ? new Date(eventData.endTime) : null;
      const visibleFromDate = eventData.visibleFrom ? new Date(eventData.visibleFrom) : null;

      form.reset({
        title: eventData.title,
        description: eventData.description || "",
        location: eventData.location || "",
        onlineLink: eventData.onlineLink || "",
        startTime: format(startDate, "yyyy-MM-dd'T'HH:mm"),
        endTime: endDate ? format(endDate, "yyyy-MM-dd'T'HH:mm") : "",
        capacity: eventData.capacity || undefined,
        type: eventData.type,
        pricingType: eventData.pricingType,
        price: eventData.price || 0,
        format: eventData.format,
        visibleFrom: visibleFromDate ? format(visibleFromDate, "yyyy-MM-dd'T'HH:mm") : "",
      });
      
      // Check if location matches a predefined location and set capacity
      if (eventData.location) {
        const matched = allLocations.find((loc: any) => 
          loc.locationName === eventData.location || 
          eventData.location?.trim() === loc.locationName.trim()
        );
        if (matched) {
          setSelectedLocationCapacity(matched.capacity);
        } else {
          setSelectedLocationCapacity(null);
        }
      }
    }
  }, [eventData, form]);

  // Handle error
  useEffect(() => {
    if (eventError) {
      toast({
        title: "Lỗi",
        description: (eventError as any)?.response?.data?.message || "Không thể tải thông tin sự kiện",
        variant: "destructive",
      });
      navigate(-1);
    }
  }, [eventError, toast, navigate]);

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: EventFormValues) => {
      if (!event) throw new Error("Event not found");
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
      return await eventService.update(event.id, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-details", eventId] });
      queryClient.invalidateQueries({ queryKey: ["leader-events", clubId] });
      setIsEditing(false);
      toast({
        title: "Thành công",
        description: "Đã cập nhật thông tin sự kiện",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: error?.response?.data?.message || "Không thể cập nhật sự kiện",
        variant: "destructive",
      });
    },
  });

  const handleUpdate = async (data: EventFormValues) => {
    if (!event) return;
    setIsSubmitting(true);
    updateMutation.mutate(data, {
      onSettled: () => {
        setIsSubmitting(false);
      },
    });
  };

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!event) throw new Error("Event not found");
      return await eventService.delete(event.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leader-events", clubId] });
      toast({
        title: "Thành công",
        description: "Xóa sự kiện thành công",
      });
      navigate(-1);
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: error?.response?.data?.message || "Không thể xóa sự kiện",
        variant: "destructive",
      });
    },
  });

  const handleDelete = async () => {
    if (!event) return;
    setIsSubmitting(true);
    deleteMutation.mutate(undefined, {
      onSettled: () => {
        setIsSubmitting(false);
        setShowDeleteDialog(false);
      },
    });
  };

  const handleMakePublic = async () => {
    if (!event) return;

    // Validation: visibleFrom must be before startTime
    const now = new Date();
    now.setSeconds(0, 0); // Round to minutes
    const startTime = new Date(event.startTime);

    if (now >= startTime) {
      toast({
        title: "Lỗi",
        description: "Không thể công khai sự kiện. Thời gian hiển thị phải trước thời gian bắt đầu sự kiện.",
        variant: "destructive",
      });
      return;
    }

    // Check if already visible
    if (event.visibleFrom) {
      const visibleFrom = new Date(event.visibleFrom);
      if (now >= visibleFrom) {
        toast({
          title: "Thông báo",
          description: "Sự kiện đã được công khai từ trước.",
          variant: "default",
        });
        return;
      }
    }

    // Make public mutation
    const makePublicMutation = useMutation({
      mutationFn: async () => {
        if (!event) throw new Error("Event not found");
        const payload = {
          visibleFrom: now.toISOString(),
        };
        return await eventService.update(event.id, payload);
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["event-details", eventId] });
        queryClient.invalidateQueries({ queryKey: ["leader-events", clubId] });
        toast({
          title: "Thành công",
          description: "Sự kiện đã được công khai",
        });
      },
      onError: (error: any) => {
        toast({
          title: "Lỗi",
          description: error?.response?.data?.message || "Không thể cập nhật sự kiện",
          variant: "destructive",
        });
      },
    });

    setIsSubmitting(true);
    makePublicMutation.mutate(undefined, {
      onSettled: () => {
        setIsSubmitting(false);
      },
    });
  };

  if (loading) {
    return (
      <div className="container py-8">
        <Skeleton className="h-10 w-48 mb-8" />
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <Skeleton className="h-64 mb-6" />
            <Skeleton className="h-32 mb-4" />
            <Skeleton className="h-32" />
          </div>
          <div>
            <Skeleton className="h-64" />
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="container py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Không tìm thấy sự kiện</h1>
        <Button onClick={() => navigate(-1)} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Quay lại
        </Button>
      </div>
    );
  }

  const currentAttendees = event._count?.tickets || 0;
  // Event is past if it has an endTime and current time is after endTime
  // Note: Dates from backend are in UTC (Z timezone), JavaScript Date automatically converts them
  const now = new Date();
  const startTime = new Date(event.startTime);
  const endTime = event.endTime ? new Date(event.endTime) : null;
  const visibleFrom = event.visibleFrom ? new Date(event.visibleFrom) : null;
  
  // Calculate event status for display
  const getEventStatus = () => {
    if (!event.isActive) {
      return { label: "Đã hủy", variant: "outline" as const, icon: XCircle };
    }
    
    // Check if registration hasn't opened yet
    if (visibleFrom && now < visibleFrom) {
      return { label: "Chưa mở đăng ký", variant: "outline" as const, icon: Clock };
    }
    
    // Check if event hasn't started yet (but registration is open)
    if (now < startTime) {
      return { label: "Sắp diễn ra", variant: "default" as const, icon: CheckCircle2 };
    }
    
    // Check if event is currently happening
    if (endTime && now >= startTime && now < endTime) {
      return { label: "Đang diễn ra", variant: "default" as const, icon: CheckCircle2 };
    }
    
    // Check if event has ended
    if (endTime && now >= endTime) {
      return { label: "Đã kết thúc", variant: "outline" as const, icon: XCircle };
    }
    
    // Fallback: event is happening (no end time specified)
    return { label: "Đang diễn ra", variant: "default" as const, icon: CheckCircle2 };
  };
  
  const eventStatus = getEventStatus();
  
  // Check registration status
  const isRegistrationOpen = (() => {
    if (!event.isActive) return false;
    if (event.approvalStatus && event.approvalStatus !== 'APPROVED') return false;
    if (visibleFrom && now < visibleFrom) return false;
    const oneHourBeforeStart = new Date(startTime.getTime() - 60 * 60 * 1000);
    if (now >= oneHourBeforeStart) return false;
    if (event.capacity && currentAttendees >= event.capacity) return false;
    return true;
  })();
  
  // Check if "Make Public" button should be disabled
  const canMakePublic = (() => {
    if (!event) return false;
    const now = new Date();
    const startTime = new Date(event.startTime);
    // Can't set visibleFrom if current time >= startTime
    if (now >= startTime) return false;
    // Can't set if already visible
    if (event.visibleFrom) {
      const visibleFrom = new Date(event.visibleFrom);
      if (now >= visibleFrom) return false;
    }
    return true;
  })();

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại
          </Button>
        </div>
         {!isEditing && (
           <div className="flex gap-2">
             <Button onClick={() => setIsEditing(true)}>
               <Edit className="h-4 w-4 mr-2" />
               Chỉnh sửa
             </Button>
             <Button
               variant="destructive"
               onClick={() => setShowDeleteDialog(true)}
             >
               <Trash2 className="h-4 w-4 mr-2" />
               Xóa
             </Button>
           </div>
         )}
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          {isEditing ? (
            <Card>
              <CardHeader>
                <CardTitle>Chỉnh sửa sự kiện</CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleUpdate)} className="space-y-4">
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
                            <Select onValueChange={field.onChange} value={field.value} disabled>
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
                            <Select onValueChange={field.onChange} value={field.value} disabled>
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
                            <Select onValueChange={field.onChange} value={field.value} disabled>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Chọn hình thức" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="OFFLINE">Trực tiếp</SelectItem>
                                <SelectItem value="ONLINE">Trực tuyến</SelectItem>
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
                                  disabled
                                  onChange={(e) => {
                                    const rawValue = e.target.value.replace(/[^\d]/g, '');
                                    const numValue = parseInt(rawValue) || 0;
                                    field.onChange(numValue);
                                    if (rawValue) {
                                      setPriceDisplay(formatVND(numValue));
                                    } else {
                                      setPriceDisplay("");
                                    }
                                  }}
                                  onFocus={(e) => {
                                    const rawValue = field.value ? field.value.toString() : "";
                                    setPriceDisplay(rawValue);
                                    setTimeout(() => e.target.select(), 0);
                                  }}
                                  onBlur={(e) => {
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
                                      const matched = allLocations.find(loc => 
                                        loc.locationName === e.target.value || 
                                        e.target.value.trim() === loc.locationName.trim()
                                      );
                                      if (matched) {
                                        setSelectedLocationCapacity(matched.capacity);
                                      } else {
                                        setSelectedLocationCapacity(null);
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
                                  >
                                    <Command className="max-h-[400px] flex flex-col">
                                      <CommandInput placeholder="Tìm kiếm địa điểm..." />
                                      <CommandList 
                                        className="max-h-[300px] overflow-y-auto overscroll-contain"
                                        style={{ scrollBehavior: 'smooth' }}
                                        onWheel={(e) => {
                                          // Check if we're at the boundaries of the command list
                                          const commandList = e.currentTarget as HTMLElement;
                                          
                                          // Small delay to check scroll position after native scroll
                                          setTimeout(() => {
                                            const isAtTop = commandList.scrollTop <= 1;
                                            const isAtBottom = commandList.scrollTop + commandList.clientHeight >= commandList.scrollHeight - 1;
                                            
                                            // Only pass scroll to dialog if at boundary and trying to scroll past
                                            if ((isAtTop && e.deltaY < 0) || (isAtBottom && e.deltaY > 0)) {
                                              const dialog = document.querySelector('[role="dialog"]');
                                              if (dialog) {
                                                const scrollable = dialog.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement || 
                                                                  dialog.querySelector('.overflow-y-auto') as HTMLElement ||
                                                                  dialog as HTMLElement;
                                                if (scrollable && scrollable.scrollHeight > scrollable.clientHeight) {
                                                  scrollable.scrollBy({ top: e.deltaY, behavior: 'auto' });
                                                }
                                              }
                                            }
                                          }, 0);
                                          // Let the command list scroll normally first
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
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mô tả</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Mô tả chi tiết về sự kiện..."
                              className="min-h-[100px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
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
                                className="[&::-webkit-calendar-picker-indicator]:ml-auto [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-60 hover:[&::-webkit-calendar-picker-indicator]:opacity-100 [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:brightness-0"
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
                                className="[&::-webkit-calendar-picker-indicator]:ml-auto [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-60 hover:[&::-webkit-calendar-picker-indicator]:opacity-100 [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:brightness-0"
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
                                className="[&::-webkit-calendar-picker-indicator]:ml-auto [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-60 hover:[&::-webkit-calendar-picker-indicator]:opacity-100 [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:brightness-0"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
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
                                        
                                        // Show warning if exceeds capacity
                                        if (selectedLocationCapacity !== null && numValue > selectedLocationCapacity) {
                                          toast({
                                            title: "Cảnh báo sức chứa",
                                            description: `Số người tối đa (${numValue.toLocaleString('vi-VN')}) vượt quá sức chứa của địa điểm đã chọn (${selectedLocationCapacity.toLocaleString('vi-VN')} người).`,
                                            variant: "destructive",
                                          });
                                        }
                                      }
                                    }
                                  }}
                                  onBlur={field.onBlur}
                                  className={exceedsCapacity ? "border-destructive" : ""}
                                />
                                {exceedsCapacity && (
                                  <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-2 rounded-md">
                                    <AlertTriangle className="h-4 w-4" />
                                    <span>
                                      Số người tối đa ({capacityValue?.toLocaleString('vi-VN')}) vượt quá sức chứa của địa điểm ({selectedLocationCapacity.toLocaleString('vi-VN')} người)
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
                    <div className="flex justify-end gap-2 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsEditing(false);
                          // Reset form to current event data without fetching
                          if (event) {
                            const startDate = new Date(event.startTime);
                            const endDate = event.endTime ? new Date(event.endTime) : null;
                            const visibleFromDate = event.visibleFrom ? new Date(event.visibleFrom) : null;
                            form.reset({
                              title: event.title,
                              description: event.description || "",
                              location: event.location || "",
                              onlineLink: event.onlineLink || "",
                              startTime: format(startDate, "yyyy-MM-dd'T'HH:mm"),
                              endTime: endDate ? format(endDate, "yyyy-MM-dd'T'HH:mm") : "",
                              capacity: event.capacity || undefined,
                              type: event.type,
                              pricingType: event.pricingType,
                              price: event.price || 0,
                              format: event.format,
                              visibleFrom: visibleFromDate ? format(visibleFromDate, "yyyy-MM-dd'T'HH:mm") : "",
                            });
                            setPriceDisplay(event.price && event.price > 0 ? formatVND(event.price) : "");
                          }
                        }}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Hủy
                      </Button>
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Đang lưu...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Lưu thay đổi
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Event Info Card */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Thông tin sự kiện</CardTitle>
                    <div className="flex gap-2">
                      <Badge className={event.type === "PUBLIC" ? "bg-white text-primary border-primary/20" : "bg-white text-accent border-accent/20"}>
                        {event.type === "PUBLIC" ? "Công khai" : "Nội bộ"}
                      </Badge>
                      <Badge className={event.pricingType === "FREE" ? "bg-white text-success border-success/20" : "bg-white text-warning border-warning/20"}>
                        {event.pricingType === "FREE" ? "Miễn phí" : `${event.price?.toLocaleString('vi-VN')} VNĐ`}
                      </Badge>
                      <Badge className={event.format === "ONLINE" ? "bg-white text-blue-600 border-blue-600/20" : "bg-white text-gray-600 border-gray-600/20"}>
                        {event.format === "ONLINE" ? "Trực tuyến" : "Trực tiếp"}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">{event.title}</h3>
                    {event.description && (
                      <p className="text-muted-foreground whitespace-pre-line">{event.description}</p>
                    )}
                  </div>
                  <Separator />
                  <div className="grid grid-cols-3 gap-4">
                    {/* Thời gian hiển thị */}
                    {event.visibleFrom && (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          Ngày mở đăng ký
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(event.visibleFrom), "dd/MM/yyyy HH:mm", { locale: vi })}
                        </div>
                      </div>
                    )}
                    
                    {/* Thời gian bắt đầu */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        Thời gian bắt đầu
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(event.startTime), "dd/MM/yyyy", { locale: vi })}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(event.startTime), "HH:mm", { locale: vi })}
                      </div>
                    </div>

                    {/* Thời gian kết thúc */}
                    {event.endTime ? (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          Thời gian kết thúc
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(event.endTime), "dd/MM/yyyy", { locale: vi })}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(event.endTime), "HH:mm", { locale: vi })}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          Thời gian kết thúc
                        </div>
                        <div className="text-sm text-muted-foreground">Chưa có</div>
                      </div>
                    )}

                    {/* Địa điểm / Link trực tuyến */}
                    {event.format === "OFFLINE" && event.location ? (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          Địa điểm
                        </div>
                        <div className="text-sm text-muted-foreground">{event.location}</div>
                      </div>
                    ) : event.format === "ONLINE" && event.onlineLink ? (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <LinkIcon className="h-4 w-4 text-muted-foreground" />
                          Link trực tuyến
                        </div>
                        <a
                          href={event.onlineLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline break-all line-clamp-2"
                        >
                          {event.onlineLink}
                        </a>
                      </div>
                    ) : null}

                    {/* Sức chứa */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        Sức chứa
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {event.capacity ? `${event.capacity} người` : "Không giới hạn"}
                      </div>
                    </div>

                    {/* Số người đã đăng ký */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        Đã đăng ký
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {currentAttendees} {event.capacity ? `/ ${event.capacity}` : ""} người
                      </div>
                    </div>

                    {/* Giá vé (nếu có) */}
                    {event.pricingType === "PAID" && event.price && event.price > 0 ? (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          Giá vé
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {event.price.toLocaleString('vi-VN')} VNĐ
                        </div>
                      </div>
                    ) : null}
                  </div>

                  <Separator />

                  {/* Thông tin quản lý */}
                  <div className="space-y-3">
                    <div className="text-sm font-medium text-muted-foreground">Thông tin quản lý</div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="font-medium mb-1">Ngày tạo</div>
                        <div className="text-muted-foreground">
                          {format(new Date(event.createdAt), "dd/MM/yyyy HH:mm", { locale: vi })}
                        </div>
                      </div>
                      <div>
                        <div className="font-medium mb-1">Cập nhật lần cuối</div>
                        <div className="text-muted-foreground">
                          {format(new Date(event.updatedAt), "dd/MM/yyyy HH:mm", { locale: vi })}
                        </div>
                      </div>
                      {event.createdBy && (
                        <div>
                          <div className="font-medium mb-1">Người tạo</div>
                          <div className="text-muted-foreground">
                            {event.createdBy.fullName || "N/A"}
                          </div>
                        </div>
                      )}
                    </div>
                    {event.club && (
                      <div className="text-sm">
                        <div className="font-medium mb-1">Câu lạc bộ</div>
                        <div className="text-muted-foreground">{event.club.name}</div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Participants List */}
              <Card>
                <CardHeader>
                  <CardTitle>Danh sách người tham gia ({participants.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingParticipants ? (
                    <div className="space-y-2">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                      ))}
                    </div>
                  ) : participants.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Chưa có người tham gia</p>
                    </div>
                  ) : (
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>STT</TableHead>
                            <TableHead>Họ tên</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Mã sinh viên</TableHead>
                            <TableHead>Ngày đăng ký</TableHead>
                            <TableHead>Trạng thái</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {participants.map((participant: any, index: number) => (
                            <TableRow key={participant.id}>
                              <TableCell>{index + 1}</TableCell>
                              <TableCell className="font-medium">
                                {participant.user?.fullName || "N/A"}
                              </TableCell>
                              <TableCell>{participant.user?.email || "N/A"}</TableCell>
                              <TableCell>{participant.user?.studentCode || "N/A"}</TableCell>
                              <TableCell>
                                {participant.registeredAt
                                  ? format(new Date(participant.registeredAt), "dd/MM/yyyy HH:mm", { locale: vi })
                                  : "N/A"}
                              </TableCell>
                              <TableCell>
                                {participant.isCheckedIn ? (
                                  <Badge className="bg-success/20 text-success border-success/30">
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    Đã check-in
                                  </Badge>
                                ) : (
                                  <Badge variant="outline">Chưa check-in</Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Trạng thái</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-muted-foreground mb-2">Trạng thái sự kiện</div>
                  <Badge 
                    variant={eventStatus.variant} 
                    className={`w-full justify-center ${
                      eventStatus.variant === 'default' 
                        ? 'bg-primary/20 text-primary border-primary/30' 
                        : ''
                    }`}
                  >
                    <eventStatus.icon className="h-4 w-4 mr-2" />
                    {eventStatus.label}
                  </Badge>
                </div>
                <Separator />
                <div>
                  <div className="text-sm text-muted-foreground mb-2">Trạng thái duyệt</div>
                  {event.approvalStatus === 'APPROVED' ? (
                    <Badge className="bg-success/20 text-success border-success/30 w-full justify-center">
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Đã duyệt
                    </Badge>
                  ) : event.approvalStatus === 'REJECTED' ? (
                    <Badge variant="outline" className="w-full justify-center border-destructive text-destructive">
                      <XCircle className="h-4 w-4 mr-2" />
                      Đã từ chối
                    </Badge>
                  ) : (
                    <Badge className="bg-amber-500/20 text-amber-600 border-amber-500/30 w-full justify-center">
                      <Clock className="h-4 w-4 mr-2" />
                      Chờ duyệt
                    </Badge>
                  )}
                </div>
                <Separator />
                <div>
                  <div className="text-sm text-muted-foreground mb-2">Trạng thái đăng ký</div>
                  {isRegistrationOpen ? (
                    <Badge className="bg-success/20 text-success border-success/30 w-full justify-center">
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Đang mở đăng ký
                    </Badge>
                  ) : visibleFrom && now < visibleFrom ? (
                    <Badge variant="outline" className="w-full justify-center">
                      <Clock className="h-4 w-4 mr-2" />
                      Chưa mở đăng ký
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="w-full justify-center">
                      <XCircle className="h-4 w-4 mr-2" />
                      Đã đóng đăng ký
                    </Badge>
                  )}
                </div>
                <Separator />
                <div>
                  <div className="text-sm text-muted-foreground mb-2">Thống kê</div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Đã đăng ký:</span>
                      <span className="font-medium">{currentAttendees}</span>
                    </div>
                    {event.capacity && (
                      <div className="flex justify-between">
                        <span>Sức chứa:</span>
                        <span className="font-medium">{event.capacity}</span>
                      </div>
                    )}
                  </div>
                </div>
                <Separator />
                <div>
                  <div className="text-sm text-muted-foreground mb-2">Nhân viên sự kiện</div>
                  {event.staff && event.staff.length > 0 ? (
                    <div className="space-y-2">
                      {event.staff.map((staffItem) => (
                        <div 
                          key={staffItem.id || staffItem.userId} 
                          className="flex items-center gap-2 text-sm"
                        >
                          {staffItem.user?.avatarUrl ? (
                            <img 
                              src={staffItem.user.avatarUrl} 
                              alt={staffItem.user.fullName || "Staff"} 
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                              {staffItem.user?.fullName?.charAt(0)?.toUpperCase() || staffItem.user?.email?.charAt(0)?.toUpperCase() || "?"}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">
                              {staffItem.user?.fullName || "N/A"}
                            </div>
                            <div className="text-xs text-muted-foreground truncate">
                              {staffItem.user?.email || "N/A"}
                            </div>
                            {staffItem.user?.studentCode && (
                              <div className="text-xs text-muted-foreground">
                                {staffItem.user.studentCode}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">Chưa có nhân viên được phân công</div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Thao tác nhanh</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full"
                onClick={handleMakePublic}
                disabled={isSubmitting || !canMakePublic}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <Globe className="h-4 w-4 mr-2" />
                    Mở đăng ký 
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate(`/club-leader/${clubId}/events/${eventId}/attendees`)}
              >
                <Users className="h-4 w-4 mr-2" />
                Quản lý người tham gia
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate(`/events/${event.id}`)}
              >
                <Eye className="h-4 w-4 mr-2" />
                Xem trang công khai
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa sự kiện</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa sự kiện "{event.title}"? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang xóa...
                </>
              ) : (
                "Xóa"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default EventDetailManagement;

