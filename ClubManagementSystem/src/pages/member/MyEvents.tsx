import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
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
import { 
  Calendar, 
  MapPin, 
  Clock,
  Users,
  QrCode,
  Plus
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
  const loading = false;
  // const navigate = useNavigate();
  const { toast } = useToast();
  const [registrations, setRegistrations] = useState<MyEvent[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [selectedQRCode, setSelectedQRCode] = useState<string | null>(null);
  const [selectedEventTitle, setSelectedEventTitle] = useState<string>("");

  // TODO: Khôi phục auth check khi kết nối API
  // useEffect(() => {
  //   if (!loading && !user) {
  //     navigate("/login");
  //   }
  // }, [user, loading, navigate]);

  // useEffect(() => {
  //   if (user) {
  //     fetchData();
  //   }
  // }, [user]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    try {
      setLoadingData(true);
      const response = await ticketService.getMyTickets();
      console.log("MyEvents - API Response:", response);
      
      const tickets = response.data?.tickets || [];
      console.log("MyEvents - Tickets:", tickets);
      console.log("MyEvents - Tickets count:", tickets.length);
      
      if (!tickets || tickets.length === 0) {
        console.log("MyEvents - No tickets found");
        setRegistrations([]);
        return;
      }
      
      // Map tickets to MyEvent format
      const mappedRegistrations: MyEvent[] = tickets.map((ticket: Ticket) => {
        console.log("MyEvents - Mapping ticket:", ticket.id, "Event:", ticket.event?.title, "QRCode:", ticket.qrCode);
        return {
          id: ticket.id,
          event_id: ticket.event.id,
          status: ticket.status,
          checked_in: !!ticket.usedAt, // Check-in if ticket has been used
          registered_at: ticket.assignedAt || ticket.purchasedAt || ticket.createdAt,
          qrCode: ticket.qrCode || null,
          event_format: ticket.event.format,
          events: {
            id: ticket.event.id,
            title: ticket.event.title,
            description: ticket.event.description,
            location: ticket.event.location,
            start_time: ticket.event.startTime,
            end_time: ticket.event.endTime,
            image_url: null, // Backend doesn't return image_url yet
            current_attendees: null, // Backend doesn't return this yet
            max_attendees: null, // Backend doesn't return this yet
            clubs: {
              name: ticket.event.club.name,
            },
          },
        };
      });
      
      console.log("MyEvents - Mapped registrations:", mappedRegistrations);
      setRegistrations(mappedRegistrations);
    } catch (error: any) {
      console.error("Error fetching tickets:", error);
      console.error("Error details:", error.response?.data);
      toast({
        title: "Lỗi",
        description: error.response?.data?.message || "Không thể tải danh sách sự kiện",
        variant: "destructive",
      });
      setRegistrations([]);
    } finally {
      setLoadingData(false);
    }
  };


  if (loading) {
    return (
      <Layout>
        <div className="container py-8">
          <Skeleton className="h-10 w-48 mb-8" />
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-40" />
            ))}
          </div>
        </div>
      </Layout>
    );
  }

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

    return (
      <Card className="hover:shadow-md transition-shadow">
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
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary">{event.clubs?.name}</Badge>
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
                        <MapPin className="h-4 w-4" />
                        <span>{event.location}</span>
                      </div>
                    )}
                    {event.max_attendees && (
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span>{event.current_attendees || 0}/{event.max_attendees} người tham gia</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-2 flex-shrink-0">
                  {!isPastEvent && (
                    <>
                      {registration.event_format === 'OFFLINE' && registration.qrCode && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="whitespace-nowrap"
                          onClick={() => {
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
              <Plus className="h-4 w-4 mr-2" />
              Tìm sự kiện
            </Link>
          </Button>
        </div>

        <Tabs defaultValue="upcoming" className="space-y-6">
          <TabsList>
            <TabsTrigger value="upcoming">
              Sắp diễn ra ({upcomingEvents.length})
            </TabsTrigger>
            <TabsTrigger value="past">
              Đã qua ({pastEvents.length})
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
