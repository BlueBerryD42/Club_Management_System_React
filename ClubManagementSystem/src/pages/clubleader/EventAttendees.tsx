import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Search, Check, Loader2, Filter } from "lucide-react";
import { eventService } from "@/services/event.service";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

interface Participant {
  id: string;
  userId: string;
  user: {
    id: string;
    email: string;
    fullName: string | null;
    studentCode: string | null;
    phone: string | null;
  };
  registeredAt: string;
  checkedInAt: string | null;
  isCheckedIn: boolean;
  checkinMethod: string | null;
}

interface EventData {
  id: string;
  title: string;
  format: string;
  startTime: string;
  endTime: string | null;
  club: {
    id: string;
    name: string;
  };
}

export default function EventAttendees() {
  const { eventId } = useParams<{ clubId: string; eventId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [checkInFilter, setCheckInFilter] = useState<string>("all");
  const [checkingIn, setCheckingIn] = useState<string | null>(null);
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");

  // Fetch event details with caching
  const { data: eventData, isLoading: loadingEvent } = useQuery({
    queryKey: ["event-details", eventId],
    queryFn: async () => {
      if (!eventId) return null;
      return await eventService.getById(eventId);
    },
    enabled: !!eventId,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Transform event data
  const event: EventData | null = eventData ? {
    id: eventData.id,
    title: eventData.title,
    format: eventData.format,
    startTime: eventData.startTime,
    endTime: eventData.endTime,
    club: eventData.club,
  } : null;

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: participantsData, isLoading: loadingParticipants } = useQuery({
    queryKey: ["event-participants", eventId, debouncedSearchQuery, checkInFilter],
    queryFn: async () => {
      if (!eventId) return null;
      return await eventService.getParticipants(eventId, {
        search: debouncedSearchQuery || undefined,
        checkedIn: checkInFilter !== "all" ? checkInFilter : undefined,
      });
    },
    enabled: !!eventId,
    staleTime: 2 * 60 * 1000, // Cache for 2 minutes (shorter since this changes more often)
  });

  const attendees = participantsData?.data?.participants || [];
  const loading = loadingEvent || loadingParticipants;

  // Check-in mutation
  const checkInMutation = useMutation({
    mutationFn: async ({ email, eventId }: { email: string; eventId: string }) => {
      return await eventService.checkInByEmail(eventId, email);
    },
    onSuccess: () => {
      // Invalidate and refetch participants data
      queryClient.invalidateQueries({ queryKey: ["event-participants", eventId] });
      toast({
        title: "Thành công",
        description: "Đã điểm danh thành công",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: error?.response?.data?.message || "Không thể điểm danh",
        variant: "destructive",
      });
    },
  });

  const handleCheckIn = async (email: string, participantId: string) => {
    if (!eventId) return;
    setCheckingIn(participantId);
    checkInMutation.mutate({ email, eventId }, {
      onSettled: () => {
        setCheckingIn(null);
      },
    });
  };

  const stats = {
    total: attendees.length,
    registered: attendees.length, // All participants are registered
    checked_in: attendees.filter((a: Participant) => a.isCheckedIn).length,
    pending: 0, // Backend doesn't have pending status
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Quay lại
        </Button>

        {loading ? (
          <div className="space-y-4 mb-8">
            <Skeleton className="h-9 w-64" />
            <Skeleton className="h-5 w-48" />
          </div>
        ) : event ? (
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">{event.title}</h1>
            <p className="text-muted-foreground mt-2">Quản lý người tham dự sự kiện</p>
          </div>
        ) : null}

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Tổng đăng ký</p>
                <p className="text-2xl font-bold mt-2">{stats.registered}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Đã điểm danh</p>
                <p className="text-2xl font-bold mt-2 text-success">{stats.checked_in}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Chưa điểm danh</p>
                <p className="text-2xl font-bold mt-2 text-warning">{stats.total - stats.checked_in}</p>
              </CardContent>
            </Card>
          </div>
        )}

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex items-center gap-2 flex-1">
                <Search className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                <Input
                  placeholder="Tìm kiếm theo tên, email hoặc MSSV..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="border-0"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                <Select value={checkInFilter} onValueChange={setCheckInFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Lọc theo trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    <SelectItem value="true">Đã điểm danh</SelectItem>
                    <SelectItem value="false">Chưa điểm danh</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Họ tên</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>MSSV</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Điểm danh</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <>
                    {[1, 2, 3].map((i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                      </TableRow>
                    ))}
                  </>
                ) : attendees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      {searchQuery ? "Không tìm thấy người tham dự nào" : "Chưa có người tham dự"}
                    </TableCell>
                  </TableRow>
                ) : (
                  attendees.map((attendee: Participant) => (
                    <TableRow key={attendee.id}>
                      <TableCell className="font-medium">
                        {attendee.user.fullName || "N/A"}
                      </TableCell>
                      <TableCell>{attendee.user.email}</TableCell>
                      <TableCell>{attendee.user.studentCode || "N/A"}</TableCell>
                      <TableCell>
                        <Badge className="bg-success/20 text-success">Đã đăng ký</Badge>
                      </TableCell>
                      <TableCell>
                        {attendee.isCheckedIn ? (
                          <div className="flex items-center gap-1">
                            <Check className="h-4 w-4 text-success" />
                            <span className="text-sm">
                              {attendee.checkedInAt
                                ? format(new Date(attendee.checkedInAt), "HH:mm", { locale: vi })
                                : ""}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">Chưa điểm danh</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {!attendee.isCheckedIn ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCheckIn(attendee.user.email, attendee.id)}
                            disabled={checkingIn === attendee.id}
                            className="text-success border-success hover:bg-success/10"
                          >
                            {checkingIn === attendee.id ? (
                              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                            ) : (
                              <Check className="h-4 w-4 mr-1" />
                            )}
                            Điểm danh
                          </Button>
                        ) : (
                          <Badge className="bg-success/20 text-success">
                            <Check className="h-3 w-3 mr-1" />
                            Đã điểm danh
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
