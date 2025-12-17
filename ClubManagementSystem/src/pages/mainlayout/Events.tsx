import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, MapPin, Users, Search, Loader2, Globe, Link as LinkIcon, Filter } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { eventService, type Event } from "@/services/event.service";
import { ticketService } from "@/services/ticket.service";
import { useToast } from "@/hooks/use-toast";
import { useAppSelector } from "@/store/hooks";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { CheckCircle2 } from "lucide-react";

const categoryColors: Record<string, string> = {
  "PUBLIC": "bg-white text-primary border-primary/20",
  "INTERNAL": "bg-white text-accent border-accent/20",
  "FREE": "bg-white text-success border-success/20",
  "PAID": "bg-white text-warning border-warning/20",
};

const Events = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [registeredEventIds, setRegisteredEventIds] = useState<Set<string>>(new Set());
  const [pricingFilter, setPricingFilter] = useState<string>("all");
  const [formatFilter, setFormatFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const navigate = useNavigate();
  const { toast } = useToast();
  const user = useAppSelector((s) => s.auth.user);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        // Build query params - don't pass type if "all" to let backend return both PUBLIC and INTERNAL (if user is member)
        const params: any = {};
        if (typeFilter !== "all") {
          params.type = typeFilter;
        }
        if (pricingFilter !== "all") {
          params.pricingType = pricingFilter;
        }
        
        const response = await eventService.getAll(params);
        setEvents(response.data || []);
        
        // Check registration status for all events if user is logged in
        if (user) {
          await checkRegistrations();
        }
      } catch (error: any) {
        console.error("Error fetching events:", error);
        toast({
          title: "Lỗi",
          description: "Không thể tải danh sách sự kiện. Vui lòng thử lại sau.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [toast, user, typeFilter, pricingFilter]);

  const checkRegistrations = async () => {
    if (!user) return;
    try {
      const response = await ticketService.getMyTickets();
      const tickets = response.data.tickets || [];
      // Chỉ tính là đã đăng ký nếu có vé còn hiệu lực (PAID / RESERVED / USED)
      const activeTickets = tickets.filter((ticket: any) =>
        ["PAID", "RESERVED", "USED"].includes(ticket.status)
      );
      const registeredIds = new Set(activeTickets.map((ticket: any) => ticket.event.id));
      setRegisteredEventIds(registeredIds);
    } catch (error: any) {
      console.error("Error checking registrations:", error);
      // Don't show error toast, just continue without registration status
    }
  };

  // Filter events:
  // - Only show events that are visible (now >= visibleFrom or visibleFrom is null)
  // - Hide events that have already ended
  const visibleEvents = events.filter((event) => {
    const now = new Date();
    const visibleFrom = event.visibleFrom ? new Date(event.visibleFrom) : null;
    const startTime = new Date(event.startTime);
    const endTime = event.endTime ? new Date(event.endTime) : null;
    
    // Hide if event has ended
    if (endTime ? now > endTime : now > startTime) {
      return false;
    }

    // Show event if visibleFrom is null or if current time >= visibleFrom
    if (!visibleFrom) return true;
    return now >= visibleFrom;
  });

  const filteredEvents = visibleEvents.filter((event) => {
    // Search filter
    const matchesSearch = 
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.club.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    // Pricing filter
    if (pricingFilter !== "all" && event.pricingType !== pricingFilter) return false;

    // Format filter
    if (formatFilter !== "all" && event.format !== formatFilter) return false;

    return true;
  });

  const formatEventTime = (startTime: string, endTime: string | null) => {
    const start = new Date(startTime);
    const startFormatted = format(start, "HH:mm", { locale: vi });
    
    if (endTime) {
      const end = new Date(endTime);
      const endFormatted = format(end, "HH:mm", { locale: vi });
      return `${startFormatted} - ${endFormatted}`;
    }
    return startFormatted;
  };

  const getEventLocation = (event: Event) => {
    if (event.format === "ONLINE" && event.onlineLink) {
      return event.onlineLink;
    }
    return event.location || "Chưa cập nhật";
  };

  const isRegistrationOpen = (event: Event) => {
    if (!event.isActive) return false;
    
    // Event must be approved for registration to be open (matching backend logic)
    if (event.approvalStatus && event.approvalStatus !== 'APPROVED') return false;
    
    const now = new Date();
    const startTime = new Date(event.startTime);
    const visibleFrom = event.visibleFrom ? new Date(event.visibleFrom) : null;
    
    // Event is hidden if current time is before visibleFrom
    if (visibleFrom && now < visibleFrom) return false;
    
    // Registration closes 1 hour before event starts (matching backend logic)
    const oneHourBeforeStart = new Date(startTime.getTime() - 60 * 60 * 1000);
    if (now >= oneHourBeforeStart) return false;
    
    // Check capacity (only if capacity is set, not null/unlimited)
    if (event.capacity != null) {
      const currentAttendees = event._count?.tickets || 0;
      if (currentAttendees >= event.capacity) return false;
    }
    
    return true;
  };

  const handleCardClick = (event: Event) => {
    navigate(`/events/${event.id}`);
  };

  const handleRegister = (event: Event, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click when clicking button
    navigate(`/events/${event.id}`);
  };

  return (
    <Layout>
      <div className="py-8 md:py-12">
        <div className="container">
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              Sự kiện <span className="text-gradient">sắp diễn ra</span>
            </h1>
            <p className="text-muted-foreground text-lg">
              Khám phá và đăng ký tham gia các sự kiện hấp dẫn từ các CLB trong trường
            </p>
          </div>

          {/* Search and Filters */}
          <div className="max-w-6xl mx-auto mb-12">
            <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm sự kiện..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-14 text-lg rounded-2xl"
                />
              </div>

              {/* Filters (compact dropdown) */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    Bộ lọc
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 space-y-2">
                  <DropdownMenuLabel className="text-xs text-muted-foreground">
                    Chọn bộ lọc
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <div className="space-y-2 px-1">
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground">Loại sự kiện</span>
                      <Select value={typeFilter} onValueChange={setTypeFilter}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Loại sự kiện" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tất cả</SelectItem>
                          <SelectItem value="PUBLIC">Công khai</SelectItem>
                          <SelectItem value="INTERNAL">Nội bộ</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground">Giá vé</span>
                      <Select value={pricingFilter} onValueChange={setPricingFilter}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Giá vé" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tất cả</SelectItem>
                          <SelectItem value="FREE">Miễn phí</SelectItem>
                          <SelectItem value="PAID">Có phí</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground">Hình thức</span>
                      <Select value={formatFilter} onValueChange={setFormatFilter}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Hình thức" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tất cả</SelectItem>
                          <SelectItem value="ONLINE">Trực tuyến</SelectItem>
                          <SelectItem value="OFFLINE">Trực tiếp</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {(typeFilter !== "all" || pricingFilter !== "all" || formatFilter !== "all") && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild className="p-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full justify-center text-muted-foreground"
                          onClick={() => {
                            setTypeFilter("all");
                            setPricingFilter("all");
                            setFormatFilter("all");
                          }}
                        >
                          Xóa bộ lọc
                        </Button>
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Events Grid */}
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEvents.map((event) => {
                  const registrationOpen = isRegistrationOpen(event);
                  const eventDate = new Date(event.startTime);
                  const attendees = event._count?.tickets || 0;
                  const location = getEventLocation(event);
                  
                  // Check if registration is before visibleFrom
                  const now = new Date();
                  const visibleFrom = event.visibleFrom ? new Date(event.visibleFrom) : null;
                  const isBeforeVisibleFrom = visibleFrom && now < visibleFrom;
                  
                  return (
                    <Card 
                      key={event.id} 
                      className="group overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                      onClick={() => handleCardClick(event)}
                    >
                      <div className="relative h-48 overflow-hidden bg-gradient-to-br from-primary/20 to-secondary/20">
                        {event.club.logoUrl ? (
                          <img
                            src={event.club.logoUrl}
                            alt={event.club.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10">
                            <Globe className="h-16 w-16 text-muted-foreground/30" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent" />
                        
                        {/* Date Badge */}
                        <div className="absolute top-4 left-4">
                          <div className="bg-card rounded-lg p-2 text-center min-w-[60px]">
                            <div className="text-2xl font-bold text-primary">
                              {eventDate.getDate()}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Th{eventDate.getMonth() + 1}
                            </div>
                          </div>
                        </div>

                        {/* Type, Pricing & Format Badges */}
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

                        {/* Club name */}
                        <div className="absolute bottom-4 left-4">
                          <span className="text-primary-foreground text-sm font-medium">
                            {event.club.name}
                          </span>
                        </div>
                      </div>

                      <CardContent className="p-5">
                        <h3 className="font-semibold text-lg mb-3 group-hover:text-primary transition-colors line-clamp-2">
                          {event.title}
                        </h3>

                        {event.description && (
                          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                            {event.description}
                          </p>
                        )}

                        <div className="space-y-2 mb-4">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            {formatEventTime(event.startTime, event.endTime)}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            {event.format === "ONLINE" ? (
                              <LinkIcon className="h-4 w-4" />
                            ) : (
                              <MapPin className="h-4 w-4" />
                            )}
                            <span className="line-clamp-1">{location}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Users className="h-4 w-4" />
                            {event.capacity 
                              ? `${attendees}/${event.capacity} người đăng ký`
                              : `${attendees} người đăng ký (Không giới hạn)`}
                          </div>
                        </div>

                        {/* Progress bar */}
                        {event.capacity != null && (
                          <div className="mb-4">
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                              <div 
                                className="h-full gradient-primary transition-all duration-500"
                                style={{ width: `${Math.min((attendees / event.capacity) * 100, 100)}%` }}
                              />
                            </div>
                          </div>
                        )}

                        {registeredEventIds.has(event.id) ? (
                          <Button 
                            className="w-full" 
                            variant="secondary"
                            disabled
                          >
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Đã đăng ký
                          </Button>
                        ) : (
                          <Button 
                            className="w-full" 
                            variant={registrationOpen ? "hero" : "secondary"}
                            disabled={!registrationOpen}
                            onClick={(e) => handleRegister(event, e)}
                          >
                            {registrationOpen 
                              ? event.pricingType === "PAID" 
                                ? `Đăng ký - ${event.price?.toLocaleString('vi-VN')} VNĐ`
                                : "Đăng ký tham gia"
                              : isBeforeVisibleFrom
                              ? "Chưa mở đăng ký"
                              : "Đã đóng đăng ký"}
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {filteredEvents.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    {searchQuery ? "Không tìm thấy sự kiện nào phù hợp." : "Chưa có sự kiện nào."}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Events;
