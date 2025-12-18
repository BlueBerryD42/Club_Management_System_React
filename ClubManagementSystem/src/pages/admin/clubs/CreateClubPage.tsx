import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { FileSpreadsheet, ArrowLeft, Loader2, Info, Upload, X, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { clubApi } from '@/services/club.service';
import * as XLSX from 'xlsx';

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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// --- Schema Definitions ---

const createClubSchema = z.object({
  name: z.string().min(3, "Tên CLB phải có ít nhất 3 ký tự"),
  description: z.string().min(20, "Mô tả phải chi tiết hơn (tối thiểu 20 ký tự)"),
  slug: z.string().optional(),
  logoUrl: z.string().url("URL không hợp lệ").optional().or(z.literal("")),
});

type CreateClubFormValues = z.infer<typeof createClubSchema>;

// --- Component ---

interface ParsedMember {
  email: string;
  studentCode?: string;
  phone?: string;
  fullName?: string;
  role?: string;
  isLeader?: boolean | string;
}

const CreateClubPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedMember[]>([]);

  const form = useForm<CreateClubFormValues>({
    resolver: zodResolver(createClubSchema),
    defaultValues: {
      name: "",
      description: "",
      slug: "",
      logoUrl: ""
    }
  });

  // Parse Excel file to preview data
  const parseExcelFile = async (file: File): Promise<ParsedMember[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);

          // Normalize column names (case-insensitive)
          const normalizedData = jsonData.map((row: any) => {
            const normalizedRow: ParsedMember = { email: '' };
            Object.keys(row).forEach(key => {
              const lowerKey = key.toLowerCase().trim();
              if (lowerKey.includes('email')) normalizedRow.email = row[key];
              if (lowerKey.includes('student_code') || lowerKey.includes('studentcode')) normalizedRow.studentCode = row[key];
              if (lowerKey.includes('phone')) normalizedRow.phone = row[key];
              if (lowerKey.includes('full_name') || lowerKey.includes('fullname')) normalizedRow.fullName = row[key];
              if (lowerKey.includes('role')) normalizedRow.role = row[key];
              if (lowerKey.includes('is_leader') || lowerKey.includes('isleader')) normalizedRow.isLeader = row[key];
            });
            return normalizedRow;
          }).filter((row: ParsedMember) => row.email); // Only rows with email

          resolve(normalizedData);
        } catch (error) {
          reject(new Error(`Lỗi đọc file Excel: ${error}`));
        }
      };
      reader.onerror = () => reject(new Error('Lỗi đọc file'));
      reader.readAsBinaryString(file);
    });
  };

  // Validate and process file
  const validateAndSetFile = async (file: File, resetInput?: () => void) => {
    // Validate file type
    const validTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'];
    const validExtensions = ['.xlsx', '.xls'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!validTypes.includes(file.type) && !validExtensions.includes(fileExtension)) {
      toast({ 
        title: "Lỗi file", 
        description: "Vui lòng chọn file Excel (.xlsx hoặc .xls)", 
        variant: "destructive" 
      });
      if (resetInput) resetInput();
      return false;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({ 
        title: "Lỗi file", 
        description: "File không được vượt quá 5MB", 
        variant: "destructive" 
      });
      if (resetInput) resetInput();
      return false;
    }

    // Parse file for preview
    try {
      const parsed = await parseExcelFile(file);
      if (parsed.length === 0) {
        toast({ 
          title: "Lỗi file", 
          description: "File Excel không có dữ liệu hợp lệ", 
          variant: "destructive" 
        });
        if (resetInput) resetInput();
        return false;
      }
      setExcelFile(file);
      setParsedData(parsed);
      toast({ title: "Tải file thành công", description: `Đã chọn file: ${file.name} (${parsed.length} thành viên)` });
    } catch (error: any) {
      toast({ 
        title: "Lỗi đọc file", 
        description: error.message || "Không thể đọc file Excel", 
        variant: "destructive" 
      });
      if (resetInput) resetInput();
      return false;
    }
    return true;
  };

  // Handle Excel File Selection (click)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await validateAndSetFile(file, () => { e.target.value = ''; });
  };

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    
    await validateAndSetFile(file);
  };

  // Download template Excel file
  const handleDownloadTemplate = () => {
    // Create template data with headers and example rows
    const templateData = [
      {
        email: 'student1@fpt.edu.vn',
        student_code: 'SE123456',
        phone: '0901234567',
        full_name: 'Nguyễn Văn A',
        role: 'USER',
        is_leader: 'TRUE'
      },
      {
        email: 'student2@fpt.edu.vn',
        student_code: 'SE123457',
        phone: '0901234568',
        full_name: 'Trần Thị B',
        role: 'USER',
        is_leader: 'FALSE'
      },
      {
        email: 'student3@fpt.edu.vn',
        student_code: 'SE123458',
        phone: '0901234569',
        full_name: 'Lê Văn C',
        role: 'USER',
        is_leader: 'FALSE'
      }
    ];

    // Create workbook and worksheet
    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Members');

    // Generate Excel file buffer
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });

    // Create blob and download
    const blob = new Blob([excelBuffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'template-danh-sach-thanh-vien.xlsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    toast({
      title: "Đã tải template",
      description: "File template đã được tải xuống",
    });
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
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Danh sách thành viên <span className="text-destructive">*</span></CardTitle>
                            <CardDescription>Tải lên file Excel chứa danh sách thành viên sáng lập</CardDescription>
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleDownloadTemplate}
                        >
                            <Download className="h-4 w-4 mr-2" />
                            Tải template
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* File Upload Area with Drag & Drop - Compact */}
                    <div
                        className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
                            isDragging
                                ? 'border-primary bg-primary/5'
                                : 'hover:border-primary'
                        }`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                    >
                        <div className="flex items-center gap-4">
                            <FileSpreadsheet className={`h-8 w-8 transition-colors flex-shrink-0 ${
                                isDragging ? 'text-primary' : 'text-muted-foreground'
                            }`} />
                            <div className="flex-1 text-left">
                                {isDragging ? (
                                    <p className="text-primary font-medium text-sm">
                                        Thả file vào đây để tải lên
                                    </p>
                                ) : (
                                    <>
                                        <div className="flex items-center gap-2">
                                            <Button type="button" variant="secondary" size="sm" className="relative cursor-pointer">
                                                <input 
                                                    type="file" 
                                                    accept=".xlsx, .xls" 
                                                    className="absolute inset-0 opacity-0 cursor-pointer" 
                                                    onChange={handleFileUpload}
                                                />
                                                <Upload className="mr-2 h-3 w-3" />
                                                Chọn file Excel
                                            </Button>
                                            <span className="text-xs text-muted-foreground">hoặc kéo thả</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Hỗ trợ: .xlsx, .xls (tối đa 5MB)
                                        </p>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* File Preview - Compact */}
                    {excelFile && (
                        <>
                            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border">
                                <div className="flex items-center gap-3 flex-1">
                                    <FileSpreadsheet className="h-5 w-5 text-muted-foreground" />
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm truncate">{excelFile.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {(excelFile.size / 1024).toFixed(2)} KB • {parsedData.length} thành viên
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        setExcelFile(null);
                                        setParsedData([]);
                                    }}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>

                            {/* Auto-display Preview Table */}
                            {parsedData.length > 0 && (
                                <div className="border rounded-lg overflow-hidden">
                                    <div className="bg-muted/50 px-4 py-2 border-b">
                                        <p className="text-sm font-medium">Xem trước dữ liệu ({parsedData.length} thành viên)</p>
                                    </div>
                                    <div className="max-h-[400px] overflow-auto">
                                        <Table>
                                            <TableHeader className="sticky top-0 bg-background">
                                                <TableRow>
                                                    <TableHead className="w-[200px]">Email</TableHead>
                                                    <TableHead>Họ tên</TableHead>
                                                    <TableHead>Mã SV</TableHead>
                                                    <TableHead>SĐT</TableHead>
                                                    <TableHead>Vai trò</TableHead>
                                                    <TableHead>Chủ nhiệm</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {parsedData.map((member, index) => (
                                                    <TableRow key={index}>
                                                        <TableCell className="font-medium text-sm">{member.email}</TableCell>
                                                        <TableCell className="text-sm">{member.fullName || '-'}</TableCell>
                                                        <TableCell className="text-sm">{member.studentCode || '-'}</TableCell>
                                                        <TableCell className="text-sm">{member.phone || '-'}</TableCell>
                                                        <TableCell>
                                                            <span className="text-xs px-2 py-1 rounded bg-muted">
                                                                {member.role || 'MEMBER'}
                                                            </span>
                                                        </TableCell>
                                                        <TableCell>
                                                            {member.isLeader === true || member.isLeader === 'true' ? (
                                                                <span className="text-xs px-2 py-1 rounded bg-primary/20 text-primary font-medium">
                                                                    ✓ Có
                                                                </span>
                                                            ) : (
                                                                <span className="text-xs text-muted-foreground">-</span>
                                                            )}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {/* Excel Format Instructions - Compact */}
                    <Alert className="py-3">
                        <Info className="h-4 w-4" />
                        <AlertTitle className="text-sm">Định dạng file Excel</AlertTitle>
                        <AlertDescription className="text-xs mt-1">
                            <p>Các cột: <strong>email</strong> (bắt buộc), student_code, phone, full_name, role, is_leader</p>
                            <p className="mt-1">⚠️ Phải có đúng 1 thành viên có is_leader = TRUE</p>
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
