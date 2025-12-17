import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer,
    LineChart,
    Line
} from 'recharts';
import { Users, Tent, Calendar, Loader2 } from 'lucide-react';
import { useQuery } from "@tanstack/react-query";
import { adminService } from "@/services/admin.service";

const DashboardPage = () => {
  const { data: statsResponse, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
        try {
            const response = await adminService.getStats();
            return response.data || response;
        } catch (error) {
            console.error("Failed to fetch stats", error);
            return null;
        }
    }
  });

  const stats = statsResponse || {
    totalClubs: 0,
    newEventsThisMonth: 0,
    activeMembers: 0,
    newUsersThisMonth: 0,
    eventsThisMonth: 0,
    upcomingEvents: 0,
    growthData: []
  };

  if (isLoading) {
      return (
          <div className="flex items-center justify-center h-full min-h-[400px]">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
      );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Tổng quan Hệ thống</h2>
      
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng số CLB</CardTitle>
            <Tent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClubs || 0}</div>
            <p className="text-xs text-muted-foreground">
              +{stats.newEventsThisMonth || 0} sự kiện mới tháng này
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Thành viên Hoạt động</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeMembers || 0}</div>
            <p className="text-xs text-muted-foreground">
              +{stats.newUsersThisMonth || 0} sinh viên mới
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sự kiện tháng này</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.eventsThisMonth || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats.upcomingEvents || 0} sự kiện sắp diễn ra
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-4 md:grid-cols-2 h-[400px]">
        <Card className="col-span-1">
            <CardHeader>
                <CardTitle>Tăng trưởng Thành viên</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={stats?.growthData || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="users" stroke="#2662d9" strokeWidth={2} />
                    </LineChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>

        <Card className="col-span-1">
            <CardHeader>
                <CardTitle>Sự kiện mới</CardTitle>
            </CardHeader>
             <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.growthData || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="events" fill="#f97a1f" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;
