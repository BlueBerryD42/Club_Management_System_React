import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Users,
  Star,
  Calendar,
  MapPin,
  Clock,
  ArrowLeft,
  Share2,
  Heart,
  MessageCircle,
  Facebook,
  Instagram,
  Mail,
  Phone,
  Award,
  FileText,
} from "lucide-react";

// Mock data
const clubData = {
  id: 1,
  name: "CLB Tin học",
  category: "Học thuật",
  members: 156,
  description: "CLB Tin học là nơi hội tụ của những sinh viên đam mê công nghệ, lập trình và phát triển phần mềm. Chúng tôi tổ chức các workshop, hackathon và các buổi chia sẻ kiến thức về các công nghệ mới nhất.",
  longDescription: `
    CLB Tin học được thành lập với sứ mệnh kết nối và phát triển cộng đồng sinh viên yêu thích công nghệ thông tin. 
    
    Với hơn 5 năm hoạt động, CLB đã tổ chức hàng trăm sự kiện, workshop và cuộc thi lập trình, giúp hàng nghìn sinh viên nâng cao kỹ năng và có cơ hội việc làm tốt hơn.

    Các hoạt động chính:
    - Workshop về các công nghệ mới: React, AI/ML, Cloud Computing
    - Hackathon hàng năm với giải thưởng hấp dẫn
    - Mentorship program với các anh chị senior
    - Kết nối doanh nghiệp và cơ hội thực tập
  `,
  image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&h=400&fit=crop",
  isRecruiting: true,
  rating: 4.8,
  totalReviews: 45,
  foundedYear: 2019,
  leader: {
    name: "Nguyễn Văn An",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
    role: "Chủ nhiệm CLB",
  },
  contacts: {
    email: "clbtinhoc@university.edu.vn",
    phone: "0123 456 789",
    facebook: "facebook.com/clbtinhoc",
    instagram: "@clbtinhoc",
  },
  achievements: [
    "Giải Nhất Hackathon Quốc gia 2023",
    "Top 10 CLB xuất sắc toàn quốc",
    "200+ thành viên tìm được việc làm",
  ],
  upcomingEvents: [
    {
      id: 1,
      title: "Workshop: React 19 Features",
      date: "2024-12-15",
      time: "14:00",
      location: "Hội trường A1",
      attendees: 45,
    },
    {
      id: 2,
      title: "Hackathon: AI for Good",
      date: "2024-12-20",
      time: "08:00",
      location: "Khu vực sự kiện",
      attendees: 120,
    },
  ],
  recentMembers: [
    { id: 1, name: "Trần Thị B", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop" },
    { id: 2, name: "Lê Văn C", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop" },
    { id: 3, name: "Phạm Thị D", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop" },
    { id: 4, name: "Hoàng Văn E", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop" },
  ],
};

const ClubDetail = () => {
  // const { id } = useParams();

  return (
    <Layout>
      <div className="pb-12">
        {/* Hero Banner */}
        <div className="relative h-64 md:h-80 overflow-hidden">
          <img
            src={clubData.image}
            alt={clubData.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/40 to-transparent" />
          
          {/* Back Button */}
          <div className="absolute top-4 left-4">
            <Button variant="secondary" size="sm" asChild>
              <Link to="/clubs">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Quay lại
              </Link>
            </Button>
          </div>

          {/* Share & Favorite */}
          <div className="absolute top-4 right-4 flex gap-2">
            <Button variant="secondary" size="icon">
              <Heart className="h-4 w-4" />
            </Button>
            <Button variant="secondary" size="icon">
              <Share2 className="h-4 w-4" />
            </Button>
          </div>

          {/* Club Info Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-6 container">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary" className="bg-primary/20 text-primary-foreground">
                    {clubData.category}
                  </Badge>
                  {clubData.isRecruiting && (
                    <Badge className="gradient-accent text-accent-foreground border-0">
                      Đang tuyển thành viên
                    </Badge>
                  )}
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-2">
                  {clubData.name}
                </h1>
                <div className="flex flex-wrap items-center gap-4 text-primary-foreground/80 text-sm">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {clubData.members} thành viên
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-warning text-warning" />
                    {clubData.rating} ({clubData.totalReviews} đánh giá)
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Thành lập {clubData.foundedYear}
                  </div>
                </div>
              </div>
              <Button variant="hero" size="lg">
                Đăng ký tham gia
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="container mt-8">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              <Tabs defaultValue="about" className="w-full">
                <TabsList className="w-full justify-start bg-muted/50 p-1">
                  <TabsTrigger value="about">Giới thiệu</TabsTrigger>
                  <TabsTrigger value="events">Sự kiện</TabsTrigger>
                  <TabsTrigger value="members">Thành viên</TabsTrigger>
                  <TabsTrigger value="fees">Phí hoạt động</TabsTrigger>
                </TabsList>

                <TabsContent value="about" className="mt-6 space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Về câu lạc bộ</CardTitle>
                    </CardHeader>
                    <CardContent className="prose prose-sm max-w-none text-muted-foreground whitespace-pre-line">
                      {clubData.longDescription}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Award className="h-5 w-5 text-warning" />
                        Thành tựu nổi bật
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3">
                        {clubData.achievements.map((achievement, index) => (
                          <li key={index} className="flex items-center gap-3">
                            <div className="h-2 w-2 rounded-full gradient-primary" />
                            <span className="text-muted-foreground">{achievement}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="events" className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Sự kiện sắp tới</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {clubData.upcomingEvents.map((event) => (
                        <div
                          key={event.id}
                          className="flex gap-4 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                        >
                          <div className="w-16 h-16 rounded-lg gradient-primary flex flex-col items-center justify-center text-primary-foreground">
                            <span className="text-2xl font-bold">{new Date(event.date).getDate()}</span>
                            <span className="text-xs">Th{new Date(event.date).getMonth() + 1}</span>
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold mb-1">{event.title}</h4>
                            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {event.time}
                              </span>
                              <span className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                {event.location}
                              </span>
                              <span className="flex items-center gap-1">
                                <Users className="h-4 w-4" />
                                {event.attendees} tham gia
                              </span>
                            </div>
                          </div>
                          <Button variant="outline" size="sm">
                            Đăng ký
                          </Button>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="members" className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Thành viên mới tham gia</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-4">
                        {clubData.recentMembers.map((member) => (
                          <div key={member.id} className="flex flex-col items-center gap-2 p-3 rounded-xl bg-muted/50">
                            <Avatar className="h-16 w-16">
                              <AvatarImage src={member.avatar} alt={member.name} />
                              <AvatarFallback>{member.name[0]}</AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium">{member.name}</span>
                          </div>
                        ))}
                        <div className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl bg-muted/50 min-w-[100px]">
                          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                            +{clubData.members - 4}
                          </div>
                          <span className="text-sm text-muted-foreground">thành viên</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="fees" className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Phí hoạt động
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="p-4 rounded-xl bg-muted/50">
                        <div className="flex justify-between items-center">
                          <div>
                            <h4 className="font-semibold">Phí sinh hoạt kỳ</h4>
                            <p className="text-sm text-muted-foreground">Thu 1 lần/học kỳ</p>
                          </div>
                          <span className="text-xl font-bold text-primary">50.000đ</span>
                        </div>
                      </div>
                      <div className="p-4 rounded-xl bg-muted/50">
                        <div className="flex justify-between items-center">
                          <div>
                            <h4 className="font-semibold">Phí sự kiện đặc biệt</h4>
                            <p className="text-sm text-muted-foreground">Tùy theo sự kiện</p>
                          </div>
                          <span className="text-xl font-bold text-primary">Theo thông báo</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Leader Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Ban điều hành</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={clubData.leader.avatar} alt={clubData.leader.name} />
                      <AvatarFallback>{clubData.leader.name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{clubData.leader.name}</p>
                      <p className="text-sm text-muted-foreground">{clubData.leader.role}</p>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full mt-4">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Nhắn tin
                  </Button>
                </CardContent>
              </Card>

              {/* Contact Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Liên hệ</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <a href={`mailto:${clubData.contacts.email}`} className="flex items-center gap-3 text-sm text-muted-foreground hover:text-primary transition-colors">
                    <Mail className="h-4 w-4" />
                    {clubData.contacts.email}
                  </a>
                  <a href={`tel:${clubData.contacts.phone}`} className="flex items-center gap-3 text-sm text-muted-foreground hover:text-primary transition-colors">
                    <Phone className="h-4 w-4" />
                    {clubData.contacts.phone}
                  </a>
                  <a href="#" className="flex items-center gap-3 text-sm text-muted-foreground hover:text-primary transition-colors">
                    <Facebook className="h-4 w-4" />
                    {clubData.contacts.facebook}
                  </a>
                  <a href="#" className="flex items-center gap-3 text-sm text-muted-foreground hover:text-primary transition-colors">
                    <Instagram className="h-4 w-4" />
                    {clubData.contacts.instagram}
                  </a>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="gradient-primary text-primary-foreground">
                <CardContent className="pt-6">
                  <h3 className="font-semibold text-lg mb-2">Tham gia ngay!</h3>
                  <p className="text-sm opacity-90 mb-4">
                    CLB đang mở đợt tuyển thành viên mới. Đăng ký để không bỏ lỡ cơ hội!
                  </p>
                  <Button className="w-full bg-primary-foreground text-primary hover:bg-primary-foreground/90">
                    Gửi đơn đăng ký
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ClubDetail;
