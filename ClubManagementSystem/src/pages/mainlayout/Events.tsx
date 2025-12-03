import { useState } from "react";
// Link not used
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, MapPin, Users, Search } from "lucide-react";

const events = [
  {
    id: 1,
    title: "Workshop: React 19 Features",
    club: "CLB Tin học",
    date: "2024-12-15",
    time: "14:00 - 17:00",
    location: "Hội trường A1",
    attendees: 45,
    maxAttendees: 100,
    image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=200&fit=crop",
    category: "Workshop",
    isRegistrationOpen: true,
  },
  {
    id: 2,
    title: "Hackathon: AI for Good",
    club: "CLB Tin học",
    date: "2024-12-20",
    time: "08:00 - 20:00",
    location: "Khu vực sự kiện",
    attendees: 120,
    maxAttendees: 150,
    image: "https://images.unsplash.com/photo-1504384764586-bb4cdc1707b0?w=400&h=200&fit=crop",
    category: "Cuộc thi",
    isRegistrationOpen: true,
  },
  {
    id: 3,
    title: "Triển lãm ảnh: Góc nhìn sinh viên",
    club: "CLB Nhiếp ảnh",
    date: "2024-12-18",
    time: "09:00 - 18:00",
    location: "Sảnh tòa nhà B",
    attendees: 200,
    maxAttendees: 500,
    image: "https://images.unsplash.com/photo-1531058020387-3be344556be6?w=400&h=200&fit=crop",
    category: "Triển lãm",
    isRegistrationOpen: true,
  },
  {
    id: 4,
    title: "Đêm nhạc acoustic",
    club: "CLB Âm nhạc",
    date: "2024-12-22",
    time: "19:00 - 21:30",
    location: "Sân khấu ngoài trời",
    attendees: 89,
    maxAttendees: 200,
    image: "https://images.unsplash.com/photo-1501612780327-45045538702b?w=400&h=200&fit=crop",
    category: "Biểu diễn",
    isRegistrationOpen: true,
  },
  {
    id: 5,
    title: "Tình nguyện mùa đông ấm",
    club: "CLB Tình nguyện",
    date: "2024-12-25",
    time: "07:00 - 17:00",
    location: "Điểm tập kết - Cổng trường",
    attendees: 50,
    maxAttendees: 60,
    image: "https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=400&h=200&fit=crop",
    category: "Tình nguyện",
    isRegistrationOpen: false,
  },
  {
    id: 6,
    title: "Startup Pitching Day",
    club: "CLB Khởi nghiệp",
    date: "2024-12-28",
    time: "13:00 - 18:00",
    location: "Hội trường lớn",
    attendees: 75,
    maxAttendees: 150,
    image: "https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=400&h=200&fit=crop",
    category: "Workshop",
    isRegistrationOpen: true,
  },
];

const categoryColors: Record<string, string> = {
  "Workshop": "bg-primary/10 text-primary",
  "Cuộc thi": "bg-accent/10 text-accent",
  "Triển lãm": "bg-secondary text-secondary-foreground",
  "Biểu diễn": "bg-warning/10 text-warning",
  "Tình nguyện": "bg-success/10 text-success",
};

const Events = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredEvents = events.filter((event) =>
    event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.club.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

          {/* Search */}
          <div className="max-w-xl mx-auto mb-12">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm sự kiện..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-14 text-lg rounded-2xl"
              />
            </div>
          </div>

          {/* Events Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <Card key={event.id} className="group overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={event.image}
                    alt={event.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent" />
                  
                  {/* Date Badge */}
                  <div className="absolute top-4 left-4">
                    <div className="bg-card rounded-lg p-2 text-center min-w-[60px]">
                      <div className="text-2xl font-bold text-primary">
                        {new Date(event.date).getDate()}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Th{new Date(event.date).getMonth() + 1}
                      </div>
                    </div>
                  </div>

                  {/* Category Badge */}
                  <div className="absolute top-4 right-4">
                    <Badge className={categoryColors[event.category]}>
                      {event.category}
                    </Badge>
                  </div>

                  {/* Club name */}
                  <div className="absolute bottom-4 left-4">
                    <span className="text-primary-foreground text-sm font-medium">
                      {event.club}
                    </span>
                  </div>
                </div>

                <CardContent className="p-5">
                  <h3 className="font-semibold text-lg mb-3 group-hover:text-primary transition-colors line-clamp-2">
                    {event.title}
                  </h3>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {event.time}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      {event.location}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      {event.attendees}/{event.maxAttendees} người đăng ký
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mb-4">
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full gradient-primary transition-all duration-500"
                        style={{ width: `${(event.attendees / event.maxAttendees) * 100}%` }}
                      />
                    </div>
                  </div>

                  <Button 
                    className="w-full" 
                    variant={event.isRegistrationOpen ? "hero" : "secondary"}
                    disabled={!event.isRegistrationOpen}
                  >
                    {event.isRegistrationOpen ? "Đăng ký tham gia" : "Đã đóng đăng ký"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredEvents.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Không tìm thấy sự kiện nào phù hợp.</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Events;
