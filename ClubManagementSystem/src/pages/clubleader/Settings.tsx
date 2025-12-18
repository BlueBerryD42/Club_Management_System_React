import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { clubApi } from "@/services/club.service";
import { ArrowLeft, Save, Building2 } from "lucide-react";


const CATEGORIES = [
  "Học thuật",
  "Nghệ thuật",
  "Thể thao",
  "Tình nguyện",
  "Kỹ năng",
  "Giải trí",
  "Khác",
];

export default function ClubSettings() {
  const { clubId } = useParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    description: "",
    slug: "",
    email: "",
    phone: "",
    facebook_url: "",
    instagram_url: "",
    founded_year: new Date().getFullYear(),
    max_members: 100,
    is_recruiting: false,
    membership_fee_enabled: false,
    membership_fee_amount: 0,
  });

  // Fetch club details
  const { data: clubData, isLoading } = useQuery({
    queryKey: ['club-details', clubId],
    queryFn: async () => {
      const response = await clubApi.getById(clubId!);
      return response.data?.data;
    },
    enabled: !!clubId,
  });

  // Update membership fee mutation
  const updateMembershipFeeMutation = useMutation({
    mutationFn: async (data: { membershipFeeEnabled: boolean; membershipFeeAmount?: number }) => {
      return await clubApi.configMembershipFee(clubId!, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['club-details', clubId] });
      toast({ title: "Thành công", description: "Đã cập nhật cấu hình phí thành viên" });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: error.response?.data?.message || "Không thể cập nhật cấu hình phí",
        variant: "destructive"
      });
    },
  });

  // Initialize form data when club data is loaded
  useEffect(() => {
    if (clubData) {
      setFormData({
        name: clubData.name || "",
        category: clubData.category || "",
        description: clubData.description || "",
        slug: clubData.slug || "",
        email: clubData.email || "",
        phone: clubData.phone || "",
        facebook_url: clubData.facebookUrl || clubData.facebook_url || "",
        instagram_url: clubData.instagramUrl || clubData.instagram_url || "",
        founded_year: clubData.foundedYear || clubData.founded_year || new Date().getFullYear(),
        max_members: clubData.maxMembers || clubData.max_members || 100,
        is_recruiting: clubData.isRecruiting ?? clubData.is_recruiting ?? false,
        membership_fee_enabled: clubData.membershipFeeEnabled ?? clubData.membership_fee_enabled ?? false,
        membership_fee_amount: clubData.membershipFeeAmount ?? clubData.membership_fee_amount ?? 0,
      });
    }
  }, [clubData]);

  const handleSave = async () => {
    // Validation tên CLB
    if (!formData.name || formData.name.trim().length < 3) {
      toast({ title: "Lỗi", description: "Tên CLB phải có ít nhất 3 ký tự", variant: "destructive" });
      return;
    }

    if (formData.name.length > 100) {
      toast({ title: "Lỗi", description: "Tên CLB không được vượt quá 100 ký tự", variant: "destructive" });
      return;
    }

    // Validation danh mục
    if (!formData.category) {
      toast({ title: "Lỗi", description: "Vui lòng chọn danh mục CLB", variant: "destructive" });
      return;
    }

    // Validation mô tả
    if (formData.description && formData.description.length > 1000) {
      toast({ title: "Lỗi", description: "Mô tả không được vượt quá 1000 ký tự", variant: "destructive" });
      return;
    }

    // Validation email
    if (formData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        toast({ title: "Lỗi", description: "Email không hợp lệ", variant: "destructive" });
        return;
      }
    }

    // Validation số điện thoại
    if (formData.phone) {
      const phoneRegex = /^(0|\+84)[0-9]{9,10}$/;
      if (!phoneRegex.test(formData.phone.replace(/\s/g, ''))) {
        toast({ title: "Lỗi", description: "Số điện thoại không hợp lệ (10-11 số, bắt đầu bằng 0 hoặc +84)", variant: "destructive" });
        return;
      }
    }

    // Validation Facebook URL
    if (formData.facebook_url && formData.facebook_url.trim()) {
      try {
        const url = new URL(formData.facebook_url);
        if (!url.hostname.includes('facebook.com') && !url.hostname.includes('fb.com')) {
          toast({ title: "Lỗi", description: "Facebook URL không hợp lệ", variant: "destructive" });
          return;
        }
      } catch {
        toast({ title: "Lỗi", description: "Facebook URL không đúng định dạng", variant: "destructive" });
        return;
      }
    }

    // Validation Instagram URL
    if (formData.instagram_url && formData.instagram_url.trim()) {
      try {
        const url = new URL(formData.instagram_url);
        if (!url.hostname.includes('instagram.com')) {
          toast({ title: "Lỗi", description: "Instagram URL không hợp lệ", variant: "destructive" });
          return;
        }
      } catch {
        toast({ title: "Lỗi", description: "Instagram URL không đúng định dạng", variant: "destructive" });
        return;
      }
    }

    // Validation năm thành lập
    const currentYear = new Date().getFullYear();
    if (formData.founded_year < 1900 || formData.founded_year > currentYear) {
      toast({ title: "Lỗi", description: `Năm thành lập phải từ 1900 đến ${currentYear}`, variant: "destructive" });
      return;
    }

    // Validation số thành viên tối đa
    if (!formData.max_members || formData.max_members < 10) {
      toast({ title: "Lỗi", description: "Số thành viên tối đa phải ít nhất là 10", variant: "destructive" });
      return;
    }

    if (formData.max_members > 1000) {
      toast({ title: "Lỗi", description: "Số thành viên tối đa không được vượt quá 1000", variant: "destructive" });
      return;
    }

    // Validation slug
    if (!formData.slug || formData.slug.trim().length < 3) {
      toast({ title: "Lỗi", description: "Slug phải có ít nhất 3 ký tự", variant: "destructive" });
      return;
    }

    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    if (!slugRegex.test(formData.slug)) {
      toast({ title: "Lỗi", description: "Slug chỉ được chứa chữ thường, số và dấu gạch ngang", variant: "destructive" });
      return;
    }

    // Validation phí thành viên
    if (formData.membership_fee_enabled) {
      if (!formData.membership_fee_amount || formData.membership_fee_amount <= 0) {
        toast({ title: "Lỗi", description: "Phí thành viên phải lớn hơn 0", variant: "destructive" });
        return;
      }

      if (formData.membership_fee_amount < 2000) {
        toast({ title: "Lỗi", description: "Phí thành viên tối thiểu là 2,000 VNĐ", variant: "destructive" });
        return;
      }

      if (formData.membership_fee_amount > 10000000) {
        toast({ title: "Lỗi", description: "Phí thành viên không được vượt quá 10,000,000 VNĐ", variant: "destructive" });
        return;
      }
    }

    // Call membership fee API
    updateMembershipFeeMutation.mutate({
      membershipFeeEnabled: formData.membership_fee_enabled,
      membershipFeeAmount: formData.membership_fee_enabled ? formData.membership_fee_amount : 0,
    });
  };

  if (isLoading || !clubData) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Button variant="ghost" asChild className="mb-6">
          <Link to={`/club-leader/${clubId}/dashboard`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại Dashboard
          </Link>
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-6 w-6" />
              Cài đặt CLB
            </CardTitle>
            <CardDescription>
              Cập nhật thông tin và cấu hình câu lạc bộ
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Tên CLB *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Danh mục *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn danh mục" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Mô tả</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Mô tả về CLB..."
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email liên hệ</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="clb@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Số điện thoại</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="0123456789"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="facebook">Facebook URL</Label>
                  <Input
                    id="facebook"
                    value={formData.facebook_url}
                    onChange={(e) => setFormData({ ...formData, facebook_url: e.target.value })}
                    placeholder="https://facebook.com/..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="instagram">Instagram URL</Label>
                  <Input
                    id="instagram"
                    value={formData.instagram_url}
                    onChange={(e) => setFormData({ ...formData, instagram_url: e.target.value })}
                    placeholder="https://instagram.com/..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="founded_year">Năm thành lập</Label>
                  <Input
                    id="founded_year"
                    type="number"
                    value={formData.founded_year}
                    onChange={(e) => setFormData({ ...formData, founded_year: parseInt(e.target.value) || new Date().getFullYear() })}
                    min={1990}
                    max={new Date().getFullYear()}
                    className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max_members">Số thành viên tối đa</Label>
                  <Input
                    id="max_members"
                    type="number"
                    value={formData.max_members}
                    onChange={(e) => setFormData({ ...formData, max_members: parseInt(e.target.value) || 0 })}
                    min={1}
                    className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">Slug (URL thân thiện)</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                  placeholder="ten-clb-url-than-thien"
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div className="space-y-0.5">
                  <Label>Đang tuyển thành viên</Label>
                  <p className="text-sm text-muted-foreground">
                    Cho phép sinh viên gửi đơn gia nhập CLB
                  </p>
                </div>
                <Switch
                  checked={formData.is_recruiting}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_recruiting: checked })}
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div className="space-y-0.5">
                  <Label>Thu phí thành viên</Label>
                  <p className="text-sm text-muted-foreground">
                    Bật tính năng thu phí thành viên
                  </p>
                </div>
                <Switch
                  checked={formData.membership_fee_enabled}
                  onCheckedChange={(checked) => setFormData({ ...formData, membership_fee_enabled: checked })}
                />
              </div>

              {formData.membership_fee_enabled && (
                <div className="space-y-2">
                  <Label htmlFor="membership_fee">Phí thành viên (VNĐ)</Label>
                  <Input
                    id="membership_fee"
                    type="number"
                    value={formData.membership_fee_amount || ''}
                    onChange={(e) => setFormData({ ...formData, membership_fee_amount: parseInt(e.target.value) || 0 })}
                    min={2000}
                    step={1000}
                    placeholder="Tối thiểu 2,000 VNĐ"
                    className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <p className="text-xs text-muted-foreground">Phí phải từ 2,000 VNĐ trở lên</p>
                </div>
              )}

              <Button
                onClick={handleSave}
                className="w-full"
                disabled={updateMembershipFeeMutation.isPending}
              >
                <Save className="mr-2 h-4 w-4" />
                {updateMembershipFeeMutation.isPending ? "Đang lưu..." : "Lưu cấu hình phí"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
