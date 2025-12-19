import { useState } from "react";
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
import { Users, Tent, Calendar, Loader2, Plus, Download, RefreshCw } from 'lucide-react';
import { useQuery } from "@tanstack/react-query";
import { adminService } from "@/services/admin.service";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const DashboardPage = () => {
  const { data: statsResponse, isLoading, refetch } = useQuery({
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

  const today = new Date();
  const formattedDate = today.toLocaleDateString('vi-VN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
            Tổng quan Hệ thống
          </h1>
          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {formattedDate}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => refetch()} className="rounded-xl">
            <RefreshCw className="h-4 w-4 mr-2" />
            Làm mới
          </Button>
          <Button variant="outline" size="sm" className="rounded-xl">
            <Download className="h-4 w-4 mr-2" />
            Xuất báo cáo
          </Button>
          <Button size="sm" className="rounded-xl bg-primary hover:bg-primary/90" asChild>
            <Link to="/admin/clubs/create">
              <Plus className="h-4 w-4 mr-2" />
              Tạo CLB mới
            </Link>
          </Button>
        </div>
      </div>

      {/* KPI Cards with Gradients */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent shadow-lg hover:shadow-xl transition-shadow">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
            <CardTitle className="text-sm font-medium">Tổng số CLB</CardTitle>
            <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Tent className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-primary">{stats.totalClubs || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              +{stats.newEventsThisMonth || 0} sự kiện mới tháng này
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent shadow-lg hover:shadow-xl transition-shadow">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
            <CardTitle className="text-sm font-medium">Thành viên Hoạt động</CardTitle>
            <div className="h-10 w-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-blue-600">{stats.activeMembers || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              +{stats.newUsersThisMonth || 0} sinh viên mới
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent shadow-lg hover:shadow-xl transition-shadow">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
            <CardTitle className="text-sm font-medium">Sự kiện tháng này</CardTitle>
            <div className="h-10 w-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-emerald-600">{stats.eventsThisMonth || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.upcomingEvents || 0} sự kiện sắp diễn ra
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="col-span-1 shadow-lg border-0 hover:shadow-xl transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-blue-500" />
              Tăng trưởng Thành viên
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats?.growthData || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: 'none',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="users"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="col-span-1 shadow-lg border-0 hover:shadow-xl transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-primary" />
              Sự kiện mới
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.growthData || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: 'none',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}
                />
                <Bar
                  dataKey="events"
                  fill="#FF8A3D"
                  radius={[6, 6, 0, 0]}
                  className="hover:opacity-80 transition-opacity"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;
