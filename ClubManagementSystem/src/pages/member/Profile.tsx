import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useAppDispatch } from "@/store/hooks";
import { updateUser } from "@/store/slices/authSlice";
import { userApi } from "@/services/user.service";
import {
  User,
  Mail,
  Phone,
  Hash,
  Camera,
  Save,
  Loader2,
  Calendar,
  Building2,
  Clock
} from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

const Profile = () => {
  const { toast } = useToast();
  const dispatch = useAppDispatch();
  const { user, isLoading, refetch } = useUserProfile();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    studentCode: "",
    avatarUrl: "",
  });
  const [activities, setActivities] = useState<{
    id: string;
    type: string;
    title: string;
    date: string;
    description: string;
  }[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(true);

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || "",
        phone: user.phone || "",
        studentCode: user.studentCode || "",
        avatarUrl: user.avatarUrl || "",
      });
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      setLoadingActivities(true);
      setTimeout(() => {
        setActivities([
          { id: "1", type: "event", title: "Hội thảo AI", date: new Date().toISOString(), description: "Đăng ký tham gia sự kiện" },
          { id: "2", type: "club", title: "CLB Công nghệ", date: new Date(Date.now() - 86400000 * 10).toISOString(), description: "Gia nhập câu lạc bộ" },
          { id: "3", type: "request", title: "CLB Văn nghệ", date: new Date(Date.now() - 86400000 * 5).toISOString(), description: "Đơn xin gia nhập - Đang chờ" },
        ]);
        setLoadingActivities(false);
      }, 800);
    }
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      // Call API to update profile
      const response = await userApi.updateProfile({
        fullName: formData.fullName,
        phone: formData.phone,
        studentCode: formData.studentCode,
        avatarUrl: formData.avatarUrl,
      });

      // Update Redux state with new user data
      if (response.data?.data) {
        dispatch(updateUser(response.data.data));
      }

      // Refresh user profile from server
      await refetch();

      toast({
        title: "Thành công",
        description: "Thông tin cá nhân đã được cập nhật",
      });
    } catch (error: any) {
      console.error('Update profile error:', error);
      toast({
        title: "Lỗi",
        description: error.response?.data?.message || "Cập nhật thất bại",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container py-8">
          <Skeleton className="h-10 w-48 mb-8" />
          <div className="grid gap-6">
            <Skeleton className="h-64" />
          </div>
        </div>
      </Layout>
    );
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "event":
        return <Calendar className="h-4 w-4" />;
      case "club":
        return <Building2 className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <Layout>
      <div className="container py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8">Hồ sơ cá nhân</h1>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList>
            <TabsTrigger value="profile">Thông tin</TabsTrigger>
            <TabsTrigger value="activity">Lịch sử hoạt động</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <div className="grid gap-6">
              {/* Profile Card */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-6">
                    <div className="relative">
                      <Avatar className="h-24 w-24">
                        <AvatarImage src={user?.avatarUrl || ""} />
                        <AvatarFallback className="text-2xl gradient-primary text-primary-foreground">
                          {user?.fullName?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <Button
                        size="icon"
                        variant="secondary"
                        className="absolute bottom-0 right-0 h-8 w-8 rounded-full"
                      >
                        <Camera className="h-4 w-4" />
                      </Button>
                    </div>
                    <div>
                      <CardTitle className="text-2xl">{user?.fullName}</CardTitle>
                      <CardDescription className="text-base">{user?.email}</CardDescription>
                      <Badge variant="secondary" className="mt-2">Sinh viên</Badge>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              {/* Edit Form */}
              <Card>
                <CardHeader>
                  <CardTitle>Chỉnh sửa thông tin</CardTitle>
                  <CardDescription>Cập nhật thông tin cá nhân của bạn</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="fullName">Họ và tên</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                          <Input
                            id="fullName"
                            value={formData.fullName}
                            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                            className="pl-10"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="studentId">MSSV</Label>
                        <div className="relative">
                          <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                          <Input
                            id="studentId"
                            value={formData.studentCode}
                            onChange={(e) => setFormData({ ...formData, studentCode: e.target.value })}
                            className="pl-10"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                          <Input
                            id="email"
                            value={user?.email || ""}
                            disabled
                            className="pl-10 bg-muted"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Số điện thoại</Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                          <Input
                            id="phone"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="pl-10"
                            placeholder="0123456789"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="avatarUrl">Avatar URL</Label>
                      <div className="relative">
                        <Camera className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                          id="avatarUrl"
                          value={formData.avatarUrl}
                          onChange={(e) => setFormData({ ...formData, avatarUrl: e.target.value })}
                          className="pl-10"
                          placeholder="https://example.com/avatar.png"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">Dán URL ảnh đại diện của bạn</p>
                    </div>

                    <Button onClick={handleSave} disabled={saving} className="w-fit">
                      {saving ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      Lưu thay đổi
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle>Lịch sử hoạt động</CardTitle>
                <CardDescription>Các hoạt động gần đây của bạn trong hệ thống</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingActivities ? (
                  <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Skeleton key={i} className="h-16" />
                    ))}
                  </div>
                ) : activities.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Clock className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">Chưa có hoạt động nào</p>
                    <p className="text-sm">Hãy tham gia câu lạc bộ và sự kiện để bắt đầu!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activities.map((activity) => (
                      <div key={activity.id} className="flex items-center gap-4 p-4 rounded-lg border">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${activity.type === "event" ? "bg-success/20 text-success" :
                          activity.type === "club" ? "bg-primary/20 text-primary" :
                            "bg-warning/20 text-warning"
                          }`}>
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium">{activity.title}</p>
                          <p className="text-sm text-muted-foreground">{activity.description}</p>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(activity.date), "dd/MM/yyyy", { locale: vi })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Profile;
