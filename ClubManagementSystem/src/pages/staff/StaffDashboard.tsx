import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppSelector } from "@/store/hooks";
import { staffService } from "@/services/staff.service";
import { eventService } from "@/services/event.service";

const StaffDashboard = () => {
  const user = useAppSelector((s) => s.auth.user);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    todayCheckIns: 0,
    totalCheckIns: 0,
    pendingRequests: 0,
    assignedEvents: 0,
  });

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      
      // Get all events (including inactive/ended ones for staff)
      const eventsResponse = await eventService.getAll({ includeInactive: 'true' });
      const allEvents = eventsResponse.data || [];
      
      // Filter events where current user is staff
      const staffEvents = allEvents.filter((event: any) => 
        event.staff?.some((staff: any) => staff.userId === user?.id)
      );

      // Calculate today's check-ins across all staff events
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      let todayCheckIns = 0;
      let totalCheckIns = 0;

      // Get participants for each event to calculate stats
      for (const event of staffEvents) {
        try {
          const participantsResponse = await staffService.getEventParticipants(event.id);
          const participants = participantsResponse.data?.participants || [];
          
          const checkedInCount = participants.filter((p: any) => p.isCheckedIn).length;
          totalCheckIns += checkedInCount;
          
          // Count today's check-ins
          const todayCheckedIn = participants.filter((p: any) => {
            if (!p.checkedInAt) return false;
            const checkInDate = new Date(p.checkedInAt);
            checkInDate.setHours(0, 0, 0, 0);
            return checkInDate.getTime() === today.getTime();
          }).length;
          
          todayCheckIns += todayCheckedIn;
        } catch (error) {
          console.error(`Error fetching participants for event ${event.id}:`, error);
        }
      }

      setStats({
        todayCheckIns,
        totalCheckIns,
        pendingRequests: 0, // Will be implemented later
        assignedEvents: staffEvents.length,
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold tracking-tight">Bảng điều khiển Nhân sự</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">Bảng điều khiển Nhân sự</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lượt quét hôm nay</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayCheckIns}</div>
            <p className="text-xs text-muted-foreground">
              Check-in trong ngày hôm nay
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng lượt quét</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCheckIns}</div>
            <p className="text-xs text-muted-foreground">
              Tổng số đã check-in
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sự kiện được phân công</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.assignedEvents}</div>
            <p className="text-xs text-muted-foreground">
              Số sự kiện bạn là nhân viên
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Yêu cầu đang chờ</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingRequests}</div>
            <p className="text-xs text-muted-foreground">
              Yêu cầu chi đang xử lý
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StaffDashboard;

