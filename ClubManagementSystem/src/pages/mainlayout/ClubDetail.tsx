import { Link, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import JoinClubDialog from "@/components/member/JoinClubDialog";
import { useAppSelector } from "@/store/hooks";
import { clubApi } from '@/services/club.service';
import { eventService } from '@/services/event.service';
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
  Loader2,
} from "lucide-react";



const ClubDetail = () => {
  const { id } = useParams<{ id: string }>();

  // Get current user from Redux (must be called before any early returns)
  const user = useAppSelector((s) => s.auth.user);
  const queryClient = useQueryClient();

  // Fetch club details from API
  const { data: clubResponse, isLoading, error } = useQuery({
    queryKey: ['public-club-detail', id],
    queryFn: async () => {
      const response = await clubApi.getById(id!);
      return response.data;
    },
    enabled: !!id,
  });

  // Fetch user's applications to check pending status
  const { data: applicationsResponse } = useQuery({
    queryKey: ['my-applications'],
    queryFn: async () => {
      const response = await clubApi.getMyApplications();
      return response.data;
    },
    enabled: !!user,
  });

  // Fetch club events (use real clubId after club detail loads)
  const { data: eventsResponse, isLoading: eventsLoading } = useQuery({
    queryKey: ['club-events', clubResponse?.data?.id],
    queryFn: async () => {
      const response = await eventService.getAll({ clubId: clubResponse?.data?.id });
      return response;
    },
    enabled: !!clubResponse?.data?.id,
  });

  // Fetch club members (use real clubId after club detail loads)
  const { data: membersResponse, isLoading: membersLoading } = useQuery({
    queryKey: ['club-members', clubResponse?.data?.id],
    queryFn: async () => {
      const response = await clubApi.getMembers(clubResponse?.data?.id, { limit: 8 });
      return response.data;
    },
    enabled: !!clubResponse?.data?.id,
  });

  // Show loading state
  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  // Show error state
  if (error || !clubResponse?.data) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <p className="text-muted-foreground">Không tìm thấy thông tin câu lạc bộ</p>
          <Button asChild>
            <Link to="/clubs">Quay lại danh sách</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  // Map backend data to frontend format
  const club = clubResponse.data;
  const clubData = {
    id: club.id,
    name: club.name,
    category: club.description?.includes('học') ? 'Học thuật' :
      club.description?.includes('nghệ thuật') ? 'Nghệ thuật' :
        club.description?.includes('tình nguyện') ? 'Xã hội' :
          club.description?.includes('thể thao') ? 'Thể thao' : 'Văn hóa',
    members: club._count?.memberships || 0,
    description: club.description || '',
    longDescription: club.description || '',
    image: club.logoUrl || "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&h=400&fit=crop",
    isRecruiting: club.isActive === true, // Allow joining if club is active
    rating: 4.8,
    totalReviews: 45,
    foundedYear: new Date(club.createdAt).getFullYear(),
    leader: {
      name: club.leader?.fullName || club.leader?.email?.split('@')[0] || 'Chưa có',
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(club.leader?.fullName || club.leader?.email || 'User')}&background=random`,
      role: "Chủ nhiệm CLB",
    },
    contacts: {
      email: club.leader?.email || "contact@university.edu.vn",
      phone: "0123 456 789",
      facebook: `facebook.com/${club.slug}`,
      instagram: `@${club.slug}`,
    },
    achievements: [
      "Giải Nhất Hackathon Quốc gia 2023",
      "Top 10 CLB xuất sắc toàn quốc",
      "200+ thành viên tìm được việc làm",
    ],
    upcomingEvents: (eventsResponse?.data || [])
      .filter((event: any) => !clubResponse?.data?.id || event.clubId === clubResponse.data.id)
      .map((event: any) => ({
      id: event.id,
      title: event.title,
      date: event.startTime,
      time: new Date(event.startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      location: event.location || event.onlineLink || 'Chưa xác định',
      attendees: event._count?.tickets || 0,
    })),
    recentMembers: ((membersResponse?.data?.data) || membersResponse?.data || []).slice(0, 4).map((member: any) => ({
      id: member.userId,
      name: member.user?.fullName || member.user?.email?.split('@')[0] || 'Thành viên',
      avatar: member.user?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.user?.fullName || member.user?.email || 'User')}&background=random`,
    })),
  };

  // Check if user is already a member of this club
  const isMember = !!user?.memberships?.some(m => m.clubId === clubData.id && m.status === 'ACTIVE');

  // Check if user has a pending application
  const hasPendingApplication = !!(applicationsResponse?.data || applicationsResponse?.applications)?.some(
    (app: any) => app.clubId === clubData.id && app.status === 'PENDING'
  );

  // Determine button state
  const getButtonState = () => {
    if (isMember) return { label: "Bạn đã là thành viên", disabled: true };
    if (hasPendingApplication) return { label: "Đã gửi đơn - Chờ duyệt", disabled: true };
    return { label: "Đăng ký tham gia", disabled: !clubData.isRecruiting };
  };

  const buttonState = getButtonState();

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
                      {eventsLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                      ) : clubData.upcomingEvents.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Calendar className="h-12 w-12 mx-auto mb-2 opacity-30" />
                          <p>Chưa có sự kiện nào sắp tới</p>
                        </div>
                      ) : (
                        clubData.upcomingEvents.map((event) => (
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
                        ))
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="members" className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Thành viên mới tham gia</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {membersLoading ? (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                          </div>
                        ) : clubData.recentMembers.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            <Users className="h-12 w-12 mx-auto mb-2 opacity-30" />
                            <p>Chưa có thành viên nào</p>
                          </div>
                        ) : (
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
                            {clubData.members > 4 && (
                              <div className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl bg-muted/50 min-w-[100px]">
                                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                                  +{clubData.members - 4}
                                </div>
                                <span className="text-sm text-muted-foreground">thành viên</span>
                              </div>
                            )}
                          </div>
                        )}
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
                  <div className="w-full">
                    <JoinClubDialog
                      clubId={clubData.id}
                      clubName={clubData.name}
                      triggerLabel={buttonState.label}
                      disabled={buttonState.disabled}
                      onSubmitted={() => {
                        // Refresh applications list after successful submission
                        queryClient.invalidateQueries({ queryKey: ['my-applications'] });
                      }}
                    />
                  </div>
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
