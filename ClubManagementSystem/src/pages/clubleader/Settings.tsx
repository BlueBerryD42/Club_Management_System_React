import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { clubApi } from "@/services/club.service";
import { ArrowLeft, Save, Building2, Loader2 } from "lucide-react";

// Simplified settings: only fields backed by DB

export default function ClubSettings() {
  const { clubId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    slug: "",
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
      navigate(`/club-leader/${clubId}/dashboard`);
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
        description: clubData.description || "",
        slug: clubData.slug || "",
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

    // Validation mô tả
    if (formData.description && formData.description.length > 1000) {
      toast({ title: "Lỗi", description: "Mô tả không được vượt quá 1000 ký tự", variant: "destructive" });
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
              <div className="space-y-2">
                <Label htmlFor="name">Tên CLB *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
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

              {/* Removed non-DB fields: contact/socials/founded year/max members */}

              <div className="space-y-2">
                <Label htmlFor="slug">Slug (URL thân thiện)</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                  placeholder="ten-clb-url-than-thien"
                />
              </div>

              {/* Removed non-DB field: is_recruiting */}

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
                {updateMembershipFeeMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Lưu cấu hình phí
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
