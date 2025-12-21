import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { QRCodeSVG } from "qrcode.react";
import { useAppSelector } from "@/store/hooks";
import { useToast } from "@/hooks/use-toast";
import { ticketService, type Ticket } from "@/services/ticket.service";
import { eventService } from "@/services/event.service";
import { transactionApi } from "@/services/transaction.service";
import { useQueryClient } from "@tanstack/react-query";
import { 
  Calendar, 
  MapPin, 
  Clock,
  Users,
  QrCode,
  Link as LinkIcon,
  Search,
  UserCog,
  MessageSquare,
  Star,
  Loader2
} from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

interface MyEvent {
  id: string;
  event_id: string;
  status: string;
  checked_in: boolean;
  registered_at: string;
  qrCode?: string | null;
  event_format?: 'ONLINE' | 'OFFLINE';
  pricing_type?: 'FREE' | 'PAID';
  events: {
    id: string;
    title: string;
    description: string | null;
    location: string | null;
    start_time: string;
    end_time: string | null;
    image_url: string | null;
    current_attendees: number | null;
    max_attendees: number | null;
    clubs: {
      name: string;
    };
  };
}

const MyEvents = () => {
  const user = useAppSelector((s) => s.auth.user);
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedQRCode, setSelectedQRCode] = useState<string | null>(null);
  const [selectedEventTitle, setSelectedEventTitle] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"upcoming" | "past" | "staff">("upcoming");
  const [processingPayment, setProcessingPayment] = useState<string | null>(null);

  // Fetch user tickets with caching
  const { data: ticketsData, isLoading: loadingData, error: ticketsError } = useQuery<MyEvent[]>({
    queryKey: ["my-tickets", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const response = await ticketService.getMyTickets();
      const tickets = response.data?.tickets || [];
      
      if (!tickets || tickets.length === 0) {
        return [];
      }
      
      // Filter out CANCELLED tickets and deduplicate by event (keep most recent active ticket per event)
      const activeTickets = tickets.filter((ticket: Ticket) => ticket.status !== 'CANCELLED' && ticket.status !== 'EXPIRED');
      
      // Group by event ID and keep only the most recent ticket per event
      const eventTicketMap = new Map<string, Ticket>();
      activeTickets.forEach((ticket: Ticket) => {
        const eventId = ticket.event.id;
        const existing = eventTicketMap.get(eventId);
        
        // If no existing ticket for this event, or this ticket is newer, use this one
        if (!existing || new Date(ticket.createdAt) > new Date(existing.createdAt)) {
          eventTicketMap.set(eventId, ticket);
        }
      });
      
      // Map tickets to MyEvent format
      return Array.from(eventTicketMap.values()).map((ticket: Ticket) => {
        const isOnline = ticket.event.format === 'ONLINE';
        const displayLocation = isOnline
          ? (ticket.onlineLink || ticket.event.location)
          : ticket.event.location;

        return {
          id: ticket.id,
          event_id: ticket.event.id,
          status: ticket.status,
          checked_in: !!ticket.usedAt,
          registered_at: ticket.assignedAt || ticket.purchasedAt || ticket.createdAt,
          qrCode: ticket.qrCode || null,
          event_format: ticket.event.format,
          pricing_type: ticket.event.pricingType,
          events: {
            id: ticket.event.id,
            title: ticket.event.title,
            description: ticket.event.description,
            location: displayLocation,
            start_time: ticket.event.startTime,
            end_time: ticket.event.endTime,
            image_url: null,
            current_attendees: null,
            max_attendees: null,
            clubs: {
              name: ticket.event.club.name,
            },
          },
        };
      });
    },
    enabled: !!user,
    staleTime: 2 * 60 * 1000, // Cache for 2 minutes
    retry: 1,
  });

  // Show error toast if query fails
  useEffect(() => {
    if (ticketsError) {
      toast({
        title: "Lỗi",
        description: (ticketsError as any)?.response?.data?.message || "Không thể tải danh sách sự kiện",
        variant: "destructive",
      });
    }
  }, [ticketsError, toast]);

  const registrations = ticketsData || [];

  // Fetch staff events with caching
  const { data: staffEventsData, isLoading: loadingStaffEvents } = useQuery<any[]>({
    queryKey: ["staff-events", user?.id],
    queryFn: async () => {
      if (!user) return [];
      // Include inactive events so staff can see all their assigned events, including ended ones
      const eventsResponse = await eventService.getAll({ includeInactive: 'true' });
      const allEvents = eventsResponse.data || [];
      
      // Filter events where current user is staff
      return allEvents.filter((event: any) => 
        event.staff?.some((staff: any) => staff.userId === user?.id)
      );
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: 1,
  });

  const staffEvents = staffEventsData || [];



  const upcomingEvents = registrations.filter(r => {
    // Event is past if current time is after endTime (or startTime if no endTime)
    const now = new Date();
    const startDate = new Date(r.events.start_time);
    const endDate = r.events.end_time ? new Date(r.events.end_time) : startDate;
    const isPastEvent = now > endDate;
    console.log("MyEvents - Filtering event:", r.events.title, "Start:", startDate, "End:", endDate, "Now:", now, "IsPast:", isPastEvent);
    return !isPastEvent;
  });
  const pastEvents = registrations.filter(r => {
    // Event is past if current time is after endTime (or startTime if no endTime)
    const now = new Date();
    const startDate = new Date(r.events.start_time);
    const endDate = r.events.end_time ? new Date(r.events.end_time) : startDate;
    const isPastEvent = now > endDate;
    return isPastEvent;
  });
  
  console.log("MyEvents - Total registrations:", registrations.length);
  console.log("MyEvents - Upcoming events:", upcomingEvents.length);
  console.log("MyEvents - Past events:", pastEvents.length);

  const EventCard = ({ registration }: { registration: MyEvent }) => {
    const event = registration.events;
    // Event is past if current time is after endTime (or startTime if no endTime)
    const now = new Date();
    const startDate = new Date(event.start_time);
    const endDate = event.end_time ? new Date(event.end_time) : startDate;
    const isPastEvent = now > endDate;
    const isOngoing = now >= startDate && now <= endDate;
    const isOnlineEvent = registration.event_format === 'ONLINE';
    const isOnlineUrl = isOnlineEvent && !!event.location && /^https?:\/\//.test(event.location);

    // Check if user has submitted feedback for this event
    const { data: hasFeedback } = useQuery({
      queryKey: ['event-feedback-check', event.id, user?.id],
      queryFn: async () => {
        if (!isPastEvent || !registration.checked_in || !user) return false;
        try {
          const response = await eventService.getFeedbacks(event.id);
          const feedbacks = response.data?.feedbacks || [];
          // Check if current user has submitted feedback
          const userFeedback = feedbacks.find((f: any) => f.userId === user.id || f.user?.id === user.id);
          return !!userFeedback;
        } catch (error) {
          // If error, assume no feedback yet
          return false;
        }
      },
      enabled: isPastEvent && !!registration.checked_in && !!user,
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    });

    return (
      <Card
        className="hover:shadow-md transition-shadow cursor-pointer"
        onClick={() => navigate(`/events/${event.id}`)}
      >
        <CardContent className="p-0">
          <div className="flex flex-col md:flex-row">
            {/* Image */}
            <div className="md:w-48 h-40 md:h-auto bg-primary/10 flex-shrink-0">
              {event.image_url ? (
                <img 
                  src={event.image_url} 
                  alt={event.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Calendar className="h-12 w-12 text-primary/50" />
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <Badge variant="secondary">{event.clubs?.name}</Badge>
                    {registration.pricing_type === 'PAID' && registration.status !== 'PAID' && registration.status !== 'USED' && (
                      <Badge className="bg-warning/20 text-warning border-warning/30">Chưa thanh toán</Badge>
                    )}
                    {registration.checked_in && (
                      <Badge className="bg-success/20 text-success border-success/30">Đã check-in</Badge>
                    )}
                    {isPastEvent && !registration.checked_in && (
                      <Badge variant="outline">Đã kết thúc</Badge>
                    )}
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{event.title}</h3>
                  
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>
                        {format(new Date(event.start_time), "EEEE, dd/MM/yyyy - HH:mm", { locale: vi })}
                      </span>
                    </div>
                    {event.location && (
                      <div className="flex items-center gap-2">
                        {isOnlineEvent ? (
                          <>
                            <LinkIcon className="h-4 w-4" />
                            {isOnlineUrl ? (
                              <a 
                                href={event.location} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-primary hover:underline break-all"
                              >
                                {event.location}
                              </a>
                            ) : (
                              <span className="break-all">{event.location}</span>
                            )}
                          </>
                        ) : (
                          <>
                            <MapPin className="h-4 w-4" />
                            <span>{event.location}</span>
                          </>
                        )}
                      </div>
                    )}
                    {event.max_attendees && (
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span>{event.current_attendees || 0}/{event.max_attendees} người tham gia</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>
                        Trạng thái:{" "}
                        {isPastEvent
                          ? "Đã kết thúc"
                          : isOngoing
                            ? "Đang diễn ra"
                            : "Sắp diễn ra"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-2 flex-shrink-0">
                  {!isPastEvent && (
                    <>
                      {registration.pricing_type === 'PAID' && registration.status !== 'PAID' && registration.status !== 'USED' && (
                        <Button 
                          size="sm" 
                          variant="default"
                          className="whitespace-nowrap"
                          disabled={processingPayment === registration.id}
                          onClick={async (e) => {
                            e.stopPropagation();
                            // Get transaction ID from ticket - we need to fetch ticket details
                            try {
                              setProcessingPayment(registration.id);
                              const ticketResponse = await ticketService.getMyTickets(event.id);
                              const tickets = ticketResponse.data?.tickets || [];
                              const myTicket = tickets.find((t: Ticket) => t.id === registration.id);
                              
                              if (!myTicket?.transaction?.id) {
                                toast({
                                  title: "Lỗi",
                                  description: "Không tìm thấy thông tin giao dịch.",
                                  variant: "destructive",
                                });
                                return;
                              }
                              
                              // First, try to get existing payment info
                              let paymentLink: string | null = null;
                              let expiresAt: Date | null = null;
                              
                              try {
                                const response = await transactionApi.getPaymentInfo(myTicket.transaction.id);
                                paymentLink = response.data?.data?.paymentLink || response.data?.data?.checkoutUrl || response.data?.paymentLink || response.data?.checkoutUrl;
                                const expiresAtStr = response.data?.data?.expiresAt || response.data?.data?.expires_at || response.data?.expiresAt;
                                expiresAt = expiresAtStr ? new Date(expiresAtStr) : null;
                              } catch (error) {
                                console.log("Could not get payment info, will create new payment link");
                              }
                              
                              // Check if payment link is expired
                              const isExpired = expiresAt ? new Date() > new Date(expiresAt) : false;
                              
                              // If expired or no payment link, create a new one
                              if (isExpired || !paymentLink) {
                                toast({
                                  title: isExpired ? "Link thanh toán đã hết hạn" : "Đang tạo link thanh toán mới",
                                  description: "Vui lòng chờ...",
                                });
                                
                                // Create new payment link
                                const createPaymentResponse = await transactionApi.createPayment({
                                  type: 'EVENT_TICKET',
                                  eventId: event.id,
                                });
                                
                                paymentLink = createPaymentResponse.data?.data?.paymentLink || createPaymentResponse.data?.paymentLink;
                                
                                if (!paymentLink) {
                                  toast({
                                    title: "Lỗi",
                                    description: "Không thể tạo link thanh toán mới. Vui lòng thử lại sau.",
                                    variant: "destructive",
                                  });
                                  return;
                                }
                                
                                toast({
                                  title: "Đã tạo link thanh toán mới",
                                  description: "Link thanh toán mới đã được tạo. Vui lòng hoàn tất thanh toán.",
                                });
                              }
                              
                              if (paymentLink) {
                                window.open(paymentLink, "_blank", "noopener,noreferrer");
                                // Refresh tickets after a delay
                                setTimeout(() => {
                                  queryClient.invalidateQueries({ queryKey: ["my-tickets", user?.id] });
                                }, 2000);
                              }
                            } catch (error: any) {
                              console.error("Error handling payment:", error);
                              toast({
                                title: "Lỗi",
                                description: error.response?.data?.message || "Không thể xử lý thanh toán. Vui lòng thử lại sau.",
                                variant: "destructive",
                              });
                            } finally {
                              setProcessingPayment(null);
                            }
                          }}
                        >
                          {processingPayment === registration.id ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Đang xử lý...
                            </>
                          ) : (
                            <>
                              <Clock className="h-4 w-4 mr-2" />
                              Thanh toán
                            </>
                          )}
                        </Button>
                      )}
                      {registration.event_format === 'OFFLINE' && registration.qrCode && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="whitespace-nowrap"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedQRCode(registration.qrCode!);
                            setSelectedEventTitle(registration.events.title);
                          }}
                        >
                          <QrCode className="h-4 w-4 mr-2" />
                          QR Check-in
                        </Button>
                      )}
                    </>
                  )}
                  {isPastEvent && registration.checked_in && (
                    <>
                      {hasFeedback ? (
                        <Badge className="bg-success/20 text-success border-success/30">
                          <Star className="h-3 w-3 mr-1" />
                          Đã đánh giá
                        </Badge>
                      ) : (
                        <Button 
                          size="sm" 
                          variant="default"
                          className="whitespace-nowrap"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/events/${event.id}/feedback`);
                          }}
                        >
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Đánh giá
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <Layout>
      <div className="container py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Sự kiện của tôi</h1>
            <p className="text-muted-foreground">Quản lý các sự kiện bạn đã đăng ký</p>
          </div>
          <Button asChild>
            <Link to="/events">
              <Search className="h-4 w-4 mr-2" />
              Tìm sự kiện
            </Link>
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "upcoming" | "past" | "staff")} className="space-y-6">
          <TabsList>
            <TabsTrigger value="upcoming">
              Sắp diễn ra ({upcomingEvents.length})
            </TabsTrigger>
            <TabsTrigger value="past">
              Đã qua ({pastEvents.length})
            </TabsTrigger>
            <TabsTrigger value="staff">
              <UserCog className="h-4 w-4 mr-2" />
              Nhân viên ({staffEvents.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming">
            {loadingData ? (
              <div className="grid gap-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-40" />
                ))}
              </div>
            ) : upcomingEvents.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Calendar className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-medium mb-2">Chưa có sự kiện nào</h3>
                  <p className="text-muted-foreground mb-4">Hãy khám phá và đăng ký các sự kiện!</p>
                  <Button asChild>
                    <Link to="/events">Tìm sự kiện</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {upcomingEvents.map((registration) => (
                  <EventCard key={registration.id} registration={registration} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="past">
            {pastEvents.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Clock className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-medium mb-2">Chưa có sự kiện đã qua</h3>
                  <p className="text-muted-foreground">Các sự kiện đã tham gia sẽ hiển thị ở đây</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {pastEvents.map((registration) => (
                  <EventCard key={registration.id} registration={registration} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="staff">
            {loadingStaffEvents ? (
              <div className="grid gap-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-40" />
                ))}
              </div>
            ) : staffEvents.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <UserCog className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-medium mb-2">Chưa được phân công sự kiện nào</h3>
                  <p className="text-muted-foreground">Các sự kiện bạn là nhân viên sẽ hiển thị ở đây</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {staffEvents.map((event) => {
                  const now = new Date();
                  const startDate = new Date(event.startTime);
                  const endDate = event.endTime ? new Date(event.endTime) : startDate;
                  const isPastEvent = now > endDate;
                  const isOngoing = now >= startDate && now <= endDate;
                  const isOnlineEvent = event.format === 'ONLINE';

                  return (
                    <Card
                      key={event.id}
                      className="hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => navigate(`/events/${event.id}`)}
                    >
                      <CardContent className="p-0">
                        <div className="flex flex-col md:flex-row">
                          {/* Image */}
                          <div className="md:w-48 h-40 md:h-auto bg-primary/10 flex-shrink-0">
                            <div className="w-full h-full flex items-center justify-center">
                              <Calendar className="h-12 w-12 text-primary/50" />
                            </div>
                          </div>

                          {/* Content */}
                          <div className="flex-1 p-6">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge variant="secondary">{event.club?.name}</Badge>
                                  <Badge className="bg-blue-100 text-blue-700 border-blue-300">
                                    <UserCog className="h-3 w-3 mr-1" />
                                    Nhân viên
                                  </Badge>
                                  {isPastEvent && (
                                    <Badge variant="outline">Đã kết thúc</Badge>
                                  )}
                                </div>
                                <h3 className="font-semibold text-lg mb-2">{event.title}</h3>
                                
                                <div className="space-y-1 text-sm text-muted-foreground">
                                  <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4" />
                                    <span>
                                      {format(new Date(event.startTime), "EEEE, dd/MM/yyyy - HH:mm", { locale: vi })}
                                    </span>
                                  </div>
                                  {event.location && !isOnlineEvent && (
                                    <div className="flex items-center gap-2">
                                      <MapPin className="h-4 w-4" />
                                      <span>{event.location}</span>
                                    </div>
                                  )}
                                  {event.onlineLink && isOnlineEvent && (
                                    <div className="flex items-center gap-2">
                                      <LinkIcon className="h-4 w-4" />
                                      <a 
                                        href={event.onlineLink} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-primary hover:underline break-all"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        {event.onlineLink}
                                      </a>
                                    </div>
                                  )}
                                  <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    <span>
                                      Trạng thái:{" "}
                                      {isPastEvent
                                        ? "Đã kết thúc"
                                        : isOngoing
                                          ? "Đang diễn ra"
                                          : "Sắp diễn ra"}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-start gap-2 flex-shrink-0">
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/staff/dashboard`);
                                  }}
                                >
                                  <UserCog className="h-4 w-4 mr-2" />
                                  Quản lý
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* QR Code Dialog */}
        <Dialog open={!!selectedQRCode} onOpenChange={(open) => !open && setSelectedQRCode(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Mã QR Check-in</DialogTitle>
              <DialogDescription>
                Hiển thị mã QR này cho nhân viên để check-in vào sự kiện: {selectedEventTitle}
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center gap-4 py-4">
              {selectedQRCode && (
                <div className="p-4 bg-white rounded-lg border-2 border-primary/20">
                  <QRCodeSVG 
                    value={selectedQRCode} 
                    size={256}
                    level="H"
                    includeMargin={true}
                  />
                </div>
              )}
              <div className="text-center">
                <p className="text-sm font-mono text-muted-foreground break-all bg-muted p-2 rounded">
                  {selectedQRCode}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Nhân viên sẽ quét mã QR này để xác nhận check-in của bạn
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default MyEvents;
