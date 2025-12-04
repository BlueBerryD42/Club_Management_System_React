import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, DollarSign } from 'lucide-react';

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

// Schema Definition
const fundRequestSchema = z.object({
  title: z.string().min(5, { message: "Tiêu đề phải có ít nhất 5 ký tự." }),
  amount: z.coerce.number().min(1000, { message: "Số tiền phải tối thiểu 1,000 VND." }),
  description: z.string().min(10, { message: "Mô tả phải có ít nhất 10 ký tự." }),
  proofImage: z.any() // Refine this in actual implementation for File validation
    .refine((file) => file?.length !== 0, "Vui lòng đính kèm ảnh minh chứng.")
});

type FundRequestFormValues = z.infer<typeof fundRequestSchema>;

const FundRequestPage = () => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<FundRequestFormValues>({
    resolver: zodResolver(fundRequestSchema),
    defaultValues: {
      title: "",
      amount: 0,
      description: "",
    },
  });

  const onSubmit = async (data: FundRequestFormValues) => {
    setIsSubmitting(true);
    try {
      console.log("Submitting:", data);
      
      // Mock API Upload & Submission
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: "Đã gửi yêu cầu",
        description: "Yêu cầu chi của bạn đã được gửi đến thủ quỹ để phê duyệt.",
      });
      
      // Reset Form
      form.reset();
      setPreviewUrl(null);
      
    } catch (error) {
      console.error(error);
      toast({
        title: "Gửi thất bại",
        description: "Vui lòng thử lại sau.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fieldChange: (value: any) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      fieldChange(e.target.files);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Tạo Yêu Cầu Chi</h2>
        <p className="text-muted-foreground">Gửi đề xuất chi tiêu để được duyệt.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Chi tiết yêu cầu</CardTitle>
          <CardDescription>
            Điền thông tin chi tiết về khoản chi. Đính kèm hóa đơn hoặc báo giá hợp lệ.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tên khoản chi</FormLabel>
                    <FormControl>
                      <Input placeholder="Ví dụ: Mua nước cho sự kiện Chào tân" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Số tiền (VND)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input 
                          type="number" 
                          placeholder="0" 
                          className="pl-9" 
                          {...field} 
                        />
                      </div>
                    </FormControl>
                    <FormDescription>Nhập tổng số tiền cần chi.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mô tả / Lý do</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Giải thích lý do khoản chi này là cần thiết..." 
                        className="resize-none min-h-[100px]" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="proofImage"
                render={({ field: { onChange, value, ...rest } }) => (
                  <FormItem>
                    <FormLabel>Minh chứng (Hóa đơn/Báo giá)</FormLabel>
                    <FormControl>
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-full">
                            <Input
                                type="file"
                                accept="image/*"
                                className="cursor-pointer"
                                onChange={(e) => handleFileChange(e, onChange)}
                                {...rest}
                            />
                        </div>
                        
                        {previewUrl && (
                          <div className="relative aspect-video w-full overflow-hidden rounded-lg border bg-muted">
                            <img 
                              src={previewUrl} 
                              alt="Preview" 
                              className="h-full w-full object-cover"
                            />
                          </div>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
                {isSubmitting ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Đang gửi...
                    </>
                ) : (
                    'Gửi yêu cầu'
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default FundRequestPage;
