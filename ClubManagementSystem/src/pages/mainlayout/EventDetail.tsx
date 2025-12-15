import { useParams, Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { eventService, type Event } from "@/services/event.service";
import { ticketService } from "@/services/ticket.service";
import { useToast } from "@/hooks/use-toast";
import { useAppSelector } from "@/store/hooks";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  Link as LinkIcon,
  Loader2,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

const categoryColors: Record<string, string> = {
  PUBLIC:
    "bg-white text-primary border-primary/20 hover:bg-white hover:text-primary cursor-default",
  INTERNAL:
    "bg-white text-accent border-accent/20 hover:bg-white hover:text-accent cursor-default",
  FREE:
    "bg-white text-success border-success/20 hover:bg-white hover:text-success cursor-default",
  PAID:
    "bg-white text-warning border-warning/20 hover:bg-white hover:text-warning cursor-default",
  ONLINE:
    "bg-white text-blue-600 border-blue-600/20 hover:bg-white hover:text-blue-600 cursor-default",
  OFFLINE:
    "bg-white text-gray-600 border-gray-600/20 hover:bg-white hover:text-gray-600 cursor-default",
};

const EventDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const user = useAppSelector((s) => s.auth.user);
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [hasRegistered, setHasRegistered] = useState(false);

  useEffect(() => {
    if (id) {
      fetchEvent();
    }
  }, [id]);

  const fetchEvent = async () => {
    try {
      setLoading(true);
      const eventData = await eventService.getById(id!);
      setEvent(eventData);
      
      // Check if user has registered
      if (user) {
        await checkRegistrationStatus(eventData.id);
      }
    } catch (error: any) {
      console.error("Error fetching event:", error);
      toast({
        title: "Lỗi",
        description: error.response?.data?.message || "Không thể tải thông tin sự kiện",
        variant: "destructive",
      });
      navigate("/events");
    } finally {
      setLoading(false);
    }
  };

  const checkRegistrationStatus = async (eventId: string) => {
    if (!user) return;
    try {
      const response = await ticketService.getMyTickets(eventId);
      const tickets = response.data.tickets || [];
      // Chỉ tính là đã đăng ký nếu có vé còn hiệu lực (không bị huỷ / hết hạn / thất bại)
      const activeTickets = tickets.filter((t: any) =>
        ["PAID", "RESERVED", "USED"].includes(t.status)
      );
      setHasRegistered(activeTickets.length > 0);
    } catch (error: any) {
      // If error, assume not registered
      console.error("Error checking registration:", error);
      setHasRegistered(false);
    }
  };

  const isRegistrationOpen = (event: Event) => {
    if (!event.isActive) return false;
    const now = new Date();
    const startTime = new Date(event.startTime);
    const visibleFrom = event.visibleFrom ? new Date(event.visibleFrom) : null;

    // Event is hidden if current time is before visibleFrom
    if (visibleFrom && now < visibleFrom) return false;

    // Registration closes when event starts
    if (now >= startTime) return false;

    // Check capacity
    const currentAttendees = event._count?.tickets || 0;
    if (event.capacity && currentAttendees >= event.capacity) return false;

    return true;
  };

  const handleRegister = async () => {
    if (!user) {
      toast({
        title: "Cần đăng nhập",
        description: "Vui lòng đăng nhập để đăng ký sự kiện",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    if (!event) return;

    try {
      setRegistering(true);
      const response = await eventService.register(event.id);

      // FREE event: registered immediately
      if (event.pricingType === "FREE") {
        toast({
          title: "Thành công",
          description: "Đăng ký sự kiện thành công!",
        });
      } else {
        // PAID event: redirect to PayOS payment link
        const paymentLink = response?.data?.paymentLink;

        if (paymentLink) {
          toast({
            title: "Chuyển đến trang thanh toán",
            description: "Vui lòng hoàn tất thanh toán trên PayOS để xác nhận đăng ký.",
          });
          // Open PayOS payment page in a new tab
          window.open(paymentLink, "_blank", "noopener,noreferrer");
        } else {
          // Fallback if no paymentLink returned
          toast({
            title: "Lỗi",
            description: "Không lấy được link thanh toán. Vui lòng thử lại sau.",
            variant: "destructive",
          });
        }
      }

      // Refresh event data to update attendee count
      await fetchEvent();
      // Check registration status again
      if (user && event) {
        await checkRegistrationStatus(event.id);
      }
    } catch (error: any) {
      console.error("Error registering:", error);
      toast({
        title: "Lỗi",
        description: error.response?.data?.message || "Không thể đăng ký sự kiện",
        variant: "destructive",
      });
    } finally {
      setRegistering(false);
    }
  };

  const handleAddToCalendar = () => {
    if (!event) return;

    // Format dates for Google Calendar (YYYYMMDDTHHmmssZ)
    const formatDateForGoogle = (date: Date): string => {
      const year = date.getUTCFullYear();
      const month = String(date.getUTCMonth() + 1).padStart(2, '0');
      const day = String(date.getUTCDate()).padStart(2, '0');
      const hours = String(date.getUTCHours()).padStart(2, '0');
      const minutes = String(date.getUTCMinutes()).padStart(2, '0');
      const seconds = String(date.getUTCSeconds()).padStart(2, '0');
      return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
    };

    const startDate = new Date(event.startTime);
    const endDate = event.endTime ? new Date(event.endTime) : new Date(startDate.getTime() + 2 * 60 * 60 * 1000); // Default 2 hours if no end time
    
    const startFormatted = formatDateForGoogle(startDate);
    const endFormatted = formatDateForGoogle(endDate);

    // Build Google Calendar URL
    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: event.title,
      dates: `${startFormatted}/${endFormatted}`,
      details: event.description || '',
      location: event.format === 'OFFLINE' ? (event.location || '') : (event.onlineLink || ''),
    });

    const googleCalendarUrl = `https://calendar.google.com/calendar/render?${params.toString()}`;
    
    // Open in new tab
    window.open(googleCalendarUrl, '_blank');
  };

  if (loading) {
    return (
      <Layout>
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
      </Layout>
    );
  }

  if (!event) {
    return (
      <Layout>
        <div className="container py-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Không tìm thấy sự kiện</h1>
          <Button onClick={() => navigate("/events")} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại danh sách
          </Button>
        </div>
      </Layout>
    );
  }

  const registrationOpen = isRegistrationOpen(event);
  const currentAttendees = event._count?.tickets || 0;
  
  // Event status logic using startTime and endTime
  // Note: Dates from backend are in UTC (Z timezone), JavaScript Date automatically
  // converts them to local timezone for comparison. Comparisons use underlying timestamps.
  const now = new Date(); // Current local time
  const startTime = new Date(event.startTime); // UTC string parsed to local Date
  const endTime = event.endTime ? new Date(event.endTime) : null; // UTC string parsed to local Date
  
  // Event is past if it has an endTime and current time is after endTime
  const isPast = endTime ? now > endTime : false;
  
  // Event is happening if:
  // - Has endTime: now >= startTime && now <= endTime
  // - No endTime: now >= startTime (ongoing event)
  const isHappening = endTime 
    ? (now >= startTime && now <= endTime)
    : (now >= startTime);

  return (
    <Layout>
      <div className="container py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate("/events")}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Quay lại
        </Button>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-6">
            {/* Event Image/Header */}
            <Card>
              <div className="relative h-64 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-t-lg overflow-hidden">
                <div className="absolute top-4 right-4 flex flex-col gap-2">
                  <Badge className={categoryColors[event.type] || "bg-white text-primary border-primary/20"}>
                    {event.type === "PUBLIC" ? "Công khai" : "Nội bộ"}
                  </Badge>
                  <Badge className={categoryColors[event.pricingType] || "bg-white text-success border-success/20"}>
                    {event.pricingType === "FREE" ? "Miễn phí" : `${event.price?.toLocaleString('vi-VN')} VNĐ`}
                  </Badge>
                  <Badge className={event.format === "ONLINE" ? "bg-white text-blue-600 border-blue-600/20" : "bg-white text-gray-600 border-gray-600/20"}>
                    {event.format === "ONLINE" ? "Trực tuyến" : "Trực tiếp"}
                  </Badge>
                </div>
                <div className="absolute bottom-4 left-4">
                  <Link to={`/clubs/${event.clubId}`}>
                    <Badge variant="secondary" className="bg-white/90">
                      {event.club.name}
                    </Badge>
                  </Link>
                </div>
              </div>
              <CardContent className="p-6">
                <h1 className="text-3xl font-bold mb-4">{event.title}</h1>
                {event.description && (
                  <div className="prose max-w-none mb-6">
                    <p className="text-muted-foreground whitespace-pre-line">
                      {event.description}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Event Details */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">Thông tin chi tiết</h2>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <div className="font-medium">Thời gian</div>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(event.startTime), "EEEE, dd/MM/yyyy", { locale: vi })}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        <Clock className="h-4 w-4" />
                        {format(new Date(event.startTime), "HH:mm", { locale: vi })}
                        {event.endTime && ` - ${format(new Date(event.endTime), "HH:mm", { locale: vi })}`}
                      </div>
                    </div>
                  </div>

                  {event.format === "OFFLINE" && event.location && (
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <div className="font-medium">Địa điểm</div>
                        <div className="text-sm text-muted-foreground">{event.location}</div>
                      </div>
                    </div>
                  )}

                  {event.format === "ONLINE" && event.onlineLink && (
                    <div className="flex items-start gap-3">
                      <LinkIcon className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <div className="font-medium">Link trực tuyến</div>
                        <a
                          href={event.onlineLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline"
                        >
                          {event.onlineLink}
                        </a>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-3">
                    <Users className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <div className="font-medium">Số người tham gia</div>
                      <div className="text-sm text-muted-foreground">
                        {currentAttendees} {event.capacity ? `/ ${event.capacity}` : ""} người
                        {!event.capacity && " (Không giới hạn)"}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-muted-foreground mb-2">Trạng thái sự kiện</div>
                    {isPast ? (
                      <Badge variant="outline" className="w-full justify-center">
                        <XCircle className="h-4 w-4 mr-2" />
                        Đã kết thúc
                      </Badge>
                    ) : !event.isActive ? (
                      <Badge variant="outline" className="w-full justify-center">
                        <XCircle className="h-4 w-4 mr-2" />
                        Đã tắt
                      </Badge>
                    ) : isHappening ? (
                      <Badge className="bg-primary/20 text-primary border-primary/30 w-full justify-center">
                        <Clock className="h-4 w-4 mr-2" />
                        Sự kiện đang diễn ra
                      </Badge>
                    ) : registrationOpen ? (
                      <Badge className="bg-success/20 text-success border-success/30 w-full justify-center">
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Đang mở đăng ký
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="w-full justify-center">
                        <XCircle className="h-4 w-4 mr-2" />
                        Đã đóng đăng ký
                      </Badge>
                    )}
                  </div>

                  {!isPast && (
                    <>
                      {hasRegistered ? (
                        <Button
                          disabled
                          className="w-full"
                          size="lg"
                          variant="secondary"
                        >
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Đã đăng ký
                        </Button>
                      ) : (
                        <Button
                          onClick={handleRegister}
                          disabled={!registrationOpen || registering}
                          className="w-full"
                          size="lg"
                        >
                          {registering ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Đang xử lý...
                            </>
                          ) : registrationOpen ? (
                            "Đăng ký tham gia"
                          ) : isHappening ? (
                            "Sự kiện đang diễn ra"
                          ) : (
                            "Đã đóng đăng ký"
                          )}
                        </Button>
                      )}
                    </>
                  )}

                  {event.pricingType === "PAID" && (
                    <div className="text-center text-sm text-muted-foreground">
                      Giá vé: <span className="font-semibold text-foreground">
                        {event.price?.toLocaleString('vi-VN')} VNĐ
                      </span>
                    </div>
                  )}

                  {hasRegistered && (
                    <Button
                      onClick={handleAddToCalendar}
                      variant="outline"
                      className="w-full"
                      size="sm"
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      Thêm vào Google Calendar
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Club Info */}
            <Card>
              <CardContent className="p-6">
                <div className="text-sm text-muted-foreground mb-2">Tổ chức bởi</div>
                <Link to={`/clubs/${event.clubId}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                  {event.club.logoUrl && (
                    <img
                      src={event.club.logoUrl}
                      alt={event.club.name}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                  )}
                  <div>
                    <div className="font-medium">{event.club.name}</div>
                    <div className="text-sm text-muted-foreground">Xem chi tiết CLB</div>
                  </div>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default EventDetail;

