import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
// import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAppSelector } from "@/store/hooks";
// import axios from "axios"; // Use axios for mock API
import { useToast } from "@/hooks/use-toast";
import { 
  Calendar, 
  MapPin, 
  Clock,
  Users,
  QrCode,
  Plus
} from "lucide-react";
import { format, isPast } from "date-fns";
import { vi } from "date-fns/locale";

interface MyEvent {
  id: string;
  event_id: string;
  status: string;
  checked_in: boolean;
  registered_at: string;
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
    fetchData();
  }, []);

  // Replace supabase API with mock data logic
  const fetchData = async () => {
    if (!user) return;
    setLoadingData(true);
    setTimeout(() => {
      setRegistrations([
        {
          id: "1",
          event_id: "event1",
          status: "registered",
          checked_in: false,
          registered_at: new Date(Date.now() - 86400000 * 2).toISOString(),
          events: {
            id: "event1",
            title: "Hội thảo AI",
            description: "Sự kiện về trí tuệ nhân tạo.",
            location: "Hội trường A",
            start_time: new Date(Date.now() + 86400000 * 2).toISOString(),
            end_time: null,
            image_url: null,
            current_attendees: 50,
            max_attendees: 100,
            clubs: { name: "CLB Công nghệ" },
          },
        },
      ]);
      setLoadingData(false);
    }, 800);
  };

  // Replace supabase API with mock logic
  const cancelRegistration = async (registrationId: string) => {
    setRegistrations(prev => prev.filter(r => r.id !== registrationId));
    toast({
      title: "Đã huỷ",
      description: "Đăng ký sự kiện đã được huỷ",
    });
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

  const upcomingEvents = registrations.filter(r => !isPast(new Date(r.events.start_time)));
  const pastEvents = registrations.filter(r => isPast(new Date(r.events.start_time)));

  const EventCard = ({ registration, showCancel = false }: { registration: MyEvent; showCancel?: boolean }) => {
    const event = registration.events;
    const isPastEvent = isPast(new Date(event.start_time));

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

                <div className="flex flex-col gap-2">
                  {!isPastEvent && (
                    <>
                      <Button size="sm" variant="outline">
                        <QrCode className="h-4 w-4 mr-1" />
                        QR Check-in
                      </Button>
                      {showCancel && (
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="text-destructive hover:text-destructive"
                          onClick={() => cancelRegistration(registration.id)}
                        >
                          Hủy đăng ký
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
                  <EventCard key={registration.id} registration={registration} showCancel />
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
      </div>
    </Layout>
  );
};

export default MyEvents;
