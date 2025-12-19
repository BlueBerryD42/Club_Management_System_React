import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { clubApi } from '@/services/club.service';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';

// --- Schema Definitions ---

const editClubSchema = z.object({
  name: z.string().min(3, "Tên CLB phải có ít nhất 3 ký tự"),
  description: z.string().min(20, "Mô tả phải chi tiết hơn (tối thiểu 20 ký tự)"),
  slug: z.string().optional(),
});

type EditClubFormValues = z.infer<typeof editClubSchema>;

// --- Component ---

const EditClubPage = () => {
  const navigate = useNavigate();
  const { clubId } = useParams<{ clubId: string }>();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch club details
  const { data: clubData, isLoading: isLoadingClub } = useQuery({
    queryKey: ['club-detail', clubId],
    queryFn: async () => {
      const response = await clubApi.getById(clubId!);
      return response.data;
    },
    enabled: !!clubId
  });

  const form = useForm<EditClubFormValues>({
    resolver: zodResolver(editClubSchema),
    defaultValues: {
      name: "",
      description: "",
      slug: "",
    }
  });

  // Update form when data is loaded
  useEffect(() => {
    if (clubData) {
      form.reset({
        name: clubData.name || "",
        description: clubData.description || "",
        slug: clubData.slug || "",
      });
    }
  }, [clubData, form]);

  const onSubmit = async (data: EditClubFormValues) => {
    setIsSubmitting(true);
    try {
      await clubApi.update(clubId!, {
        name: data.name,
        description: data.description,
        slug: data.slug,
      });
      
      toast({ 
        title: "Cập nhật thành công!", 
        description: "Thông tin CLB đã được cập nhật." 
      });
      
      navigate('/admin/clubs');
    } catch (error) {
      console.error("Error updating club:", error);
      toast({ 
        title: "Lỗi", 
        description: (error as any).response?.data?.message || "Đã xảy ra lỗi khi cập nhật CLB.", 
        variant: "destructive" 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingClub) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/clubs')}>
            <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
            <h2 className="text-3xl font-bold tracking-tight">Chỉnh sửa Câu lạc bộ</h2>
            <p className="text-muted-foreground">Cập nhật thông tin cơ bản của CLB.</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            
            {/* Club Information */}
            <Card>
                <CardHeader>
                    <CardTitle>Thông tin Câu lạc bộ</CardTitle>
                    <CardDescription>Chỉnh sửa thông tin cơ bản về CLB</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Tên Câu lạc bộ <span className="text-destructive">*</span></FormLabel>
                                <FormControl>
                                    <Input placeholder="Ví dụ: CLB Guitar FPT" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Mô tả <span className="text-destructive">*</span></FormLabel>
                                <FormControl>
                                    <Textarea 
                                        placeholder="Giới thiệu ngắn gọn về mục đích hoạt động của CLB..." 
                                        className="min-h-[120px]" 
                                        {...field} 
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="slug"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Slug (URL tùy chỉnh)</FormLabel>
                                <FormControl>
                                    <Input placeholder="Ví dụ: clb-guitar-fpt" {...field} />
                                </FormControl>
                                <FormDescription className="text-xs">
                                    Để trống nếu muốn tự động tạo từ tên CLB
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </CardContent>
            </Card>

            <div className="flex justify-end gap-4">
                <Button type="button" variant="outline" onClick={() => navigate('/admin/clubs')}>Hủy bỏ</Button>
                <Button type="submit" size="lg" disabled={isSubmitting}>
                    {isSubmitting ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Đang lưu...
                        </>
                    ) : (
                        'Lưu thay đổi'
                    )}
                </Button>
            </div>
        </form>
      </Form>
    </div>
  );
};

export default EditClubPage;
