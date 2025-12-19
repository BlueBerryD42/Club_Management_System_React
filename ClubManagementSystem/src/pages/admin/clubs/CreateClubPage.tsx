import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { FileSpreadsheet, ArrowLeft, Loader2, Info, Upload, Download, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { clubApi } from '@/services/club.service';

const createClubSchema = z.object({
  name: z.string().min(3, 'Tên CLB phải có ít nhất 3 ký tự'),
  description: z.string().min(20, 'Mô tả phải chi tiết hơn (tối thiểu 20 ký tự)'),
  slug: z.string().optional(),
  logoUrl: z.string().url('URL không hợp lệ').optional().or(z.literal('')),
});

type CreateClubFormValues = z.infer<typeof createClubSchema>;

interface ParsedMember {
  email: string;
  student_code?: string;
  phone?: string;
  full_name?: string;
  role?: string;
  is_leader?: boolean | string;
}

const CreateClubPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [membersPreview, setMembersPreview] = useState<ParsedMember[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);

  const isValidEmail = (email?: string) => {
    if (!email) return false;
    const trimmed = String(email).trim();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(trimmed);
  };

  const isValidPhone = (phone?: string) => {
    if (!phone) return false;
    const trimmed = String(phone).trim();
    const phonePattern = /^(0[35789])\d{8}$/;
    return phonePattern.test(trimmed);
  };

  const invalidCount = useMemo(() => {
    if (!membersPreview.length) return 0;
    return membersPreview.filter((m) => !isValidEmail(m.email) || !isValidPhone(m.phone)).length;
  }, [membersPreview]);

  const updateMember = (index: number, field: keyof ParsedMember, value: string | boolean) => {
    setMembersPreview((prev) => prev.map((m, i) => (i === index ? { ...m, [field]: value } : m)));
  };

  const formatFileSize = (size: number) => {
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`;
    return `${(size / 1024 / 1024).toFixed(2)} MB`;
  };

  const form = useForm<CreateClubFormValues>({
    resolver: zodResolver(createClubSchema),
    defaultValues: { name: '', description: '', slug: '', logoUrl: '' },
  });

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        email: 'student1@fpt.edu.vn',
        student_code: 'SE123456',
        phone: '0901234567',
        full_name: 'Nguyễn Văn A',
        role: 'LEADER',
        is_leader: 'TRUE',
      },
      {
        email: 'student2@fpt.edu.vn',
        student_code: 'SE123457',
        phone: '0901234568',
        full_name: 'Trần Thị B',
        role: 'MEMBER',
        is_leader: 'FALSE',
      },
      {
        email: 'student3@fpt.edu.vn',
        student_code: 'SE123458',
        phone: '0901234569',
        full_name: 'Lê Văn C',
        role: 'MEMBER',
        is_leader: 'FALSE',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Members');
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = globalThis.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'template-danh-sach-thanh-vien.xlsx';
    document.body.appendChild(link);
    link.click();
    link.remove();
    globalThis.URL.revokeObjectURL(url);
    toast({ title: 'Đã tải template', description: 'File template đã được tải xuống' });
  };

  const handleFileUpload = (file: File) => {
    setExcelFile(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    handleFileUpload(file);
    e.target.value = '';
  };

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

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileUpload(file);
  };

  useEffect(() => {
    const parse = async () => {
      if (!excelFile) {
        setMembersPreview([]);
        return;
      }

      try {
        const buffer = await excelFile.arrayBuffer();
        const wb = XLSX.read(buffer, { type: 'array' });
        const firstSheetName = wb.SheetNames[0];
        const sheet = wb.Sheets[firstSheetName];
        const rows: Array<Record<string, any>> = XLSX.utils.sheet_to_json(sheet, { defval: '' });
        const normalized = rows
          .map((r) => ({
            full_name: r.full_name ?? r.fullName ?? r['full name'] ?? r['Full Name'] ?? '',
            email: r.email ?? r.Email ?? '',
            student_code: r.student_code ?? r.studentCode ?? r['student code'] ?? '',
            phone: r.phone ?? r.Phone ?? '',
            role: r.role ?? r.Role ?? '',
            is_leader: r.is_leader ?? r.isLeader ?? r['is leader'] ?? r['Is Leader'] ?? false,
          }))
          .filter((r) => r.full_name || r.email || r.student_code);
        setMembersPreview(normalized);
      } catch (err) {
        console.error('Failed to parse Excel', err);
        toast({
          title: 'Không thể đọc file Excel',
          description: 'Vui lòng kiểm tra định dạng cột theo hướng dẫn.',
          variant: 'destructive',
        });
        setMembersPreview([]);
      }
    };

    parse();
  }, [excelFile, toast]);

  const onSubmit = async (data: CreateClubFormValues) => {
    if (!excelFile) {
      toast({
        title: 'Thiếu file Excel',
        description: 'Vui lòng tải lên file Excel danh sách thành viên',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      if (membersPreview.length) {
        const leaderCount = membersPreview.filter((m) => {
          const val = String(m.is_leader || '').toUpperCase();
          return val === 'TRUE' || m.is_leader === true;
        }).length;

        if (leaderCount !== 1) {
          toast({
            title: 'Lỗi dữ liệu',
            description: 'Phải có đúng 1 thành viên có is_leader = TRUE',
            variant: 'destructive',
          });
          setIsSubmitting(false);
          return;
        }
      }

      let uploadFile: File = excelFile;

      if (membersPreview.length) {
        const exportRows = membersPreview.map((m) => ({
          email: m.email || '',
          student_code: m.student_code || '',
          phone: m.phone || '',
          full_name: m.full_name || '',
          role: m.role || '',
          is_leader:
            String(m.is_leader || '').toUpperCase() === 'TRUE' || m.is_leader === true ? 'TRUE' : 'FALSE',
        }));

        const sheet = XLSX.utils.json_to_sheet(exportRows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, sheet, 'members');
        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([wbout], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });

        uploadFile = new File([blob], 'members-edited.xlsx', { type: blob.type });
      }

      const response = await clubApi.createWithExcel({
        name: data.name,
        description: data.description,
        slug: data.slug,
        logoUrl: data.logoUrl,
        excelFile: uploadFile,
      });

      toast({
        title: 'Tạo CLB thành công!',
        description: response.data.message || 'CLB đã được tạo và gửi email thông báo đến các thành viên.',
      });
      navigate('/admin/clubs');
    } catch (error: any) {
      console.error('Error creating club:', error);
      toast({
        title: 'Lỗi',
        description: error.response?.data?.message || 'Đã xảy ra lỗi khi tạo CLB.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate('/admin/clubs')}
            className="rounded-xl hover:bg-slate-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
              Thành lập Câu lạc bộ
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">Điền thông tin và danh sách thành viên sáng lập.</p>
          </div>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card className="border-0 shadow-lg overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-orange-50 border-b">
              <CardTitle className="text-lg">Thông tin Câu lạc bộ</CardTitle>
              <CardDescription>Nhập thông tin cơ bản về CLB mới</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-700">
                      Tên Câu lạc bộ <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Ví dụ: CLB Guitar FPT" {...field} className="rounded-xl" />
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
                    <FormLabel className="text-slate-700">
                      Mô tả <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Giới thiệu ngắn gọn về mục đích hoạt động của CLB..."
                        className="min-h-[120px] rounded-xl"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-700">Slug (URL tùy chỉnh)</FormLabel>
                      <FormControl>
                        <Input placeholder="Ví dụ: clb-guitar-fpt" {...field} className="rounded-xl" />
                      </FormControl>
                      <FormDescription className="text-xs">Để trống nếu muốn tự động tạo từ tên CLB</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="logoUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-700">Logo URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://example.com/logo.png" {...field} className="rounded-xl" />
                      </FormControl>
                      <FormDescription className="text-xs">URL hình ảnh logo của CLB</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg overflow-hidden">
            <CardHeader className="bg-slate-50 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
                    Danh sách thành viên <span className="text-destructive">*</span>
                  </CardTitle>
                  <CardDescription>Tải lên file Excel chứa danh sách thành viên sáng lập</CardDescription>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={handleDownloadTemplate} className="rounded-xl">
                  <Download className="h-4 w-4 mr-2" />
                  Tải template
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                className={`border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200 ${
                  isDragging
                    ? 'border-primary bg-primary/5 scale-[1.01]'
                    : 'border-slate-200 hover:border-primary/50 hover:bg-slate-50'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className="flex items-center gap-4">
                  <FileSpreadsheet
                    className={`h-8 w-8 transition-colors flex-shrink-0 ${
                      isDragging ? 'text-primary' : 'text-muted-foreground'
                    }`}
                  />
                  <div className="flex-1 text-left">
                    {isDragging ? (
                      <p className="text-primary font-medium text-sm">Thả file vào đây để tải lên</p>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <Button type="button" variant="secondary" size="sm" className="relative cursor-pointer">
                            <input
                              type="file"
                              accept=".xlsx, .xls"
                              className="absolute inset-0 opacity-0 cursor-pointer"
                              onChange={handleInputChange}
                            />
                            <Upload className="mr-2 h-3 w-3" />
                            Chọn file Excel
                          </Button>
                          <span className="text-xs text-muted-foreground">hoặc kéo thả</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Hỗ trợ: .xlsx, .xls (tối đa 5MB)</p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {excelFile && (
                <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                      <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-slate-900 truncate">{excelFile.name}</p>
                      <p className="text-xs text-emerald-700">
                        ✓ {formatFileSize(excelFile.size)} • {membersPreview.length} thành viên
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-slate-400 hover:text-red-500"
                    onClick={() => {
                      setExcelFile(null);
                      setMembersPreview([]);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {membersPreview.length > 0 && (
                <div className="space-y-2">
                  <div className="border rounded-lg overflow-hidden">
                    <div className="bg-slate-100 px-4 py-2 border-b flex items-center justify-between">
                      <p className="text-sm font-medium">Xem trước dữ liệu ({membersPreview.length} thành viên)</p>
                      <div className="flex items-center gap-2">
                        {invalidCount > 0 ? (
                          <Badge variant="destructive">{invalidCount} hàng không hợp lệ</Badge>
                        ) : (
                          <Badge variant="secondary">Tất cả hợp lệ</Badge>
                        )}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setIsEditMode((v) => !v)}
                          className="rounded-md"
                        >
                          {isEditMode ? 'Xong chỉnh sửa' : 'Chỉnh sửa'}
                        </Button>
                      </div>
                    </div>
                    <div className="max-h-[420px] overflow-auto">
                      <Table>
                        <TableHeader className="sticky top-0 bg-background">
                          <TableRow>
                            <TableHead className="w-[220px]">Email</TableHead>
                            <TableHead>Họ tên</TableHead>
                            <TableHead>Mã SV</TableHead>
                            <TableHead>SĐT</TableHead>
                            <TableHead>Vai trò</TableHead>
                            <TableHead>Chủ nhiệm</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {membersPreview.map((m, idx) => {
                            const leader = String(m.is_leader || '').toUpperCase() === 'TRUE' || m.is_leader === true;
                            const emailValid = isValidEmail(m.email);
                            const phoneValid = isValidPhone(m.phone);

                            return (
                              <TableRow key={`${m.email}-${m.student_code}-${m.full_name}`}>
                                {isEditMode ? (
                                  <>
                                    <TableCell>
                                      <Input
                                        type="email"
                                        value={m.email || ''}
                                        onChange={(e) => updateMember(idx, 'email', e.target.value)}
                                        className={cn('text-sm', emailValid ? '' : 'ring-1 ring-destructive')}
                                      />
                                      {!emailValid && (
                                        <p className="text-[11px] text-destructive">Email không hợp lệ</p>
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      <Input
                                        value={m.full_name || ''}
                                        onChange={(e) => updateMember(idx, 'full_name', e.target.value)}
                                      />
                                    </TableCell>
                                    <TableCell>
                                      <Input
                                        value={m.student_code || ''}
                                        onChange={(e) => updateMember(idx, 'student_code', e.target.value)}
                                      />
                                    </TableCell>
                                    <TableCell>
                                      <Input
                                        value={m.phone || ''}
                                        onChange={(e) => updateMember(idx, 'phone', e.target.value)}
                                        className={cn('text-sm', phoneValid ? '' : 'ring-1 ring-destructive')}
                                      />
                                      {!phoneValid && (
                                        <p className="text-[11px] text-destructive">SĐT không hợp lệ</p>
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      <Select value={m.role || ''} onValueChange={(val) => updateMember(idx, 'role', val)}>
                                        <SelectTrigger className="w-[160px]">
                                          <SelectValue placeholder="Chọn vai trò" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="LEADER">LEADER</SelectItem>
                                          <SelectItem value="MEMBER">MEMBER</SelectItem>
                                          <SelectItem value="STAFF">STAFF</SelectItem>
                                          <SelectItem value="TREASURER">TREASURER</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex items-center gap-2">
                                        <Switch
                                          checked={leader}
                                          onCheckedChange={(val) => updateMember(idx, 'is_leader', val)}
                                        />
                                        <span className="text-xs text-muted-foreground">{leader ? 'TRUE' : 'FALSE'}</span>
                                      </div>
                                    </TableCell>
                                  </>
                                ) : (
                                  <>
                                    <TableCell className={cn('text-sm font-medium', emailValid ? '' : 'text-destructive')}>
                                      {m.email || '-'}
                                      {!emailValid && <p className="text-[11px] text-destructive">Email không hợp lệ</p>}
                                    </TableCell>
                                    <TableCell className="text-sm">{m.full_name || '-'}</TableCell>
                                    <TableCell className="text-sm">{m.student_code || '-'}</TableCell>
                                    <TableCell className={cn('text-sm', phoneValid ? '' : 'text-destructive')}>
                                      {m.phone || '-'}
                                      {!phoneValid && <p className="text-[11px] text-destructive">SĐT không hợp lệ</p>}
                                    </TableCell>
                                    <TableCell>
                                      <span className="text-xs px-2 py-1 rounded bg-muted">
                                        {m.role || 'MEMBER'}
                                      </span>
                                    </TableCell>
                                    <TableCell>
                                      {leader ? (
                                        <span className="text-xs px-2 py-1 rounded bg-primary/20 text-primary font-medium">
                                          ✓ Có
                                        </span>
                                      ) : (
                                        <span className="text-xs text-muted-foreground">-</span>
                                      )}
                                    </TableCell>
                                  </>
                                )}
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>
              )}

              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Định dạng file Excel yêu cầu</AlertTitle>
                <AlertDescription>
                  <div className="space-y-3 mt-2">
                    <div>
                      <p className="font-medium text-sm mb-1">Các cột bắt buộc:</p>
                      <ul className="text-xs space-y-1 ml-4 list-disc">
                        <li>
                          <strong>email</strong> - Email sinh viên (bắt buộc, duy nhất)
                        </li>
                        <li>
                          <strong>student_code</strong> - Mã số sinh viên
                        </li>
                        <li>
                          <strong>phone</strong> - Số điện thoại
                        </li>
                        <li>
                          <strong>full_name</strong> - Họ và tên đầy đủ
                        </li>
                        <li>
                          <strong>role</strong> - Vai trò (LEADER, MEMBER, STAFF, TREASURER)
                        </li>
                        <li>
                          <strong>is_leader</strong> - TRUE nếu là chủ nhiệm, FALSE cho các thành viên khác
                        </li>
                      </ul>
                    </div>
                    <div className="bg-muted/50 p-3 rounded text-xs">
                      <p className="font-medium mb-1">⚠️ Lưu ý quan trọng:</p>
                      <ul className="space-y-0.5 ml-4 list-disc">
                        <li>Phải có <strong>đúng 1 thành viên</strong> có is_leader = TRUE</li>
                        <li>Email phải hợp lệ và không trùng lặp</li>
                        <li>
                          Hệ thống sẽ tự động tạo tài khoản với mật khẩu:
                          <code className="bg-background px-1 py-0.5 rounded">Student@123</code>
                        </li>
                        <li>Email chào mừng sẽ được gửi tự động đến các thành viên mới</li>
                      </ul>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4 pt-4">
            <Button type="button" variant="outline" onClick={() => navigate('/admin/clubs')} className="rounded-xl">
              Hủy bỏ
            </Button>
            <Button
              type="submit"
              size="lg"
              disabled={isSubmitting}
              className="rounded-xl bg-primary hover:bg-primary/90 px-8"
            >
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
