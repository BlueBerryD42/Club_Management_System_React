import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { FileSpreadsheet, ArrowLeft, Loader2, Info, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// --- Schema Definitions ---

const createClubSchema = z.object({
  name: z.string().min(3, "Tên CLB phải có ít nhất 3 ký tự"),
  description: z.string().min(20, "Mô tả phải chi tiết hơn (tối thiểu 20 ký tự)"),
  slug: z.string().optional(),
  logoUrl: z.string().url("URL không hợp lệ").optional().or(z.literal("")),
});

type CreateClubFormValues = z.infer<typeof createClubSchema>;

// --- Component ---

const CreateClubPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [excelFile, setExcelFile] = useState<File | null>(null);

  const form = useForm<CreateClubFormValues>({
    resolver: zodResolver(createClubSchema),
    defaultValues: {
      name: "",
      description: "",
      slug: "",
      logoUrl: ""
    }
  });

  // Handle Excel File Selection
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'];
    if (!validTypes.includes(file.type)) {
      toast({ 
        title: "Lỗi file", 
        description: "Vui lòng chọn file Excel (.xlsx hoặc .xls)", 
        variant: "destructive" 
      });
      e.target.value = '';
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({ 
        title: "Lỗi file", 
        description: "File không được vượt quá 5MB", 
        variant: "destructive" 
      });
      e.target.value = '';
      return;
    }

    setExcelFile(file);
    toast({ title: "Tải file thành công", description: `Đã chọn file: ${file.name}` });
  };

  const onSubmit = async (data: CreateClubFormValues) => {
    if (!excelFile) {
      toast({ 
        title: "Thiếu file Excel", 
        description: "Vui lòng tải lên file Excel danh sách thành viên", 
        variant: "destructive" 
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await clubApi.createWithExcel({
        name: data.name,
        description: data.description,
        slug: data.slug,
        logoUrl: data.logoUrl,
        excelFile: excelFile
      });
      
      toast({ 
        title: "Tạo CLB thành công!", 
        description: response.data.message || "CLB đã được tạo và gửi email thông báo đến các thành viên." 
      });
      
      navigate('/admin/clubs');
    } catch (error: any) {
      console.error("Error creating club:", error);
      toast({ 
        title: "Lỗi", 
        description: error.response?.data?.message || "Đã xảy ra lỗi khi tạo CLB.", 
        variant: "destructive" 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/clubs')}>
            <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
            <h2 className="text-3xl font-bold tracking-tight">Thành lập Câu lạc bộ</h2>
            <p className="text-muted-foreground">Điền thông tin và danh sách thành viên sáng lập.</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            
            {/* Club Information */}
            <Card>
                <CardHeader>
                    <CardTitle>Thông tin Câu lạc bộ</CardTitle>
                    <CardDescription>Nhập thông tin cơ bản về CLB</CardDescription>
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

                    <FormField
                        control={form.control}
                        name="logoUrl"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Logo URL</FormLabel>
                                <FormControl>
                                    <Input placeholder="https://example.com/logo.png" {...field} />
                                </FormControl>
                                <FormDescription className="text-xs">
                                    URL hình ảnh logo của CLB
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </CardContent>
            </Card>

            {/* Excel Member Upload */}
            <Card>
                <CardHeader>
                    <CardTitle>Danh sách thành viên <span className="text-destructive">*</span></CardTitle>
                    <CardDescription>Tải lên file Excel chứa danh sách thành viên sáng lập</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* File Upload Area */}
                    <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors">
                        <FileSpreadsheet className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                        <div className="space-y-2">
                            <div className="flex items-center justify-center">
                                <Button type="button" variant="secondary" className="relative cursor-pointer">
                                    <input 
                                        type="file" 
                                        accept=".xlsx, .xls" 
                                        className="absolute inset-0 opacity-0 cursor-pointer" 
                                        onChange={handleFileUpload}
                                    />
                                    <Upload className="mr-2 h-4 w-4" />
                                    Chọn file Excel
                                </Button>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Hỗ trợ: .xlsx, .xls (tối đa 5MB)
                            </p>
                        </div>
                    </div>

                    {/* File Preview */}
                    {excelFile && (
                        <Alert>
                            <FileSpreadsheet className="h-4 w-4" />
                            <AlertTitle>File đã chọn</AlertTitle>
                            <AlertDescription className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium">{excelFile.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {(excelFile.size / 1024).toFixed(2)} KB
                                    </p>
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setExcelFile(null)}
                                >
                                    Thay đổi
                                </Button>
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Excel Format Instructions */}
                    <Alert>
                        <Info className="h-4 w-4" />
                        <AlertTitle>Định dạng file Excel yêu cầu</AlertTitle>
                        <AlertDescription>
                            <div className="space-y-3 mt-2">
                                <div>
                                    <p className="font-medium text-sm mb-1">Các cột bắt buộc:</p>
                                    <ul className="text-xs space-y-1 ml-4 list-disc">
                                        <li><strong>email</strong> - Email sinh viên (bắt buộc, duy nhất)</li>
                                        <li><strong>student_code</strong> - Mã số sinh viên</li>
                                        <li><strong>phone</strong> - Số điện thoại</li>
                                        <li><strong>full_name</strong> - Họ và tên đầy đủ</li>
                                        <li><strong>role</strong> - Vai trò (LEADER, MEMBER, STAFF, TREASURER)</li>
                                        <li><strong>is_leader</strong> - TRUE nếu là chủ nhiệm, FALSE cho các thành viên khác</li>
                                    </ul>
                                </div>
                                <div className="bg-muted/50 p-3 rounded text-xs">
                                    <p className="font-medium mb-1">⚠️ Lưu ý quan trọng:</p>
                                    <ul className="space-y-0.5 ml-4 list-disc">
                                        <li>Phải có <strong>đúng 1 thành viên</strong> có is_leader = TRUE</li>
                                        <li>Email phải hợp lệ và không trùng lặp</li>
                                        <li>Hệ thống sẽ tự động tạo tài khoản với mật khẩu: <code className="bg-background px-1 py-0.5 rounded">Student@123</code></li>
                                        <li>Email chào mừng sẽ được gửi tự động đến các thành viên mới</li>
                                    </ul>
                                </div>
                            </div>
                        </AlertDescription>
                    </Alert>
                </CardContent>
            </Card>

            <div className="flex justify-end gap-4">
                <Button type="button" variant="outline" onClick={() => navigate('/admin/clubs')}>Hủy bỏ</Button>
                <Button type="submit" size="lg" disabled={isSubmitting}>
                    {isSubmitting ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Đang xử lý...
                        </>
                    ) : (
                        'Phê duyệt & Tạo CLB'
                    )}
                </Button>
            </div>
        </form>
      </Form>
    </div>
  );
};

export default CreateClubPage;
