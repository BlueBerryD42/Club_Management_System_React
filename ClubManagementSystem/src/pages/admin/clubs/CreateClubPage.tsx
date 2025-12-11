import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { FileSpreadsheet, Trash2, Plus, ArrowLeft, Loader2, Info, DollarSign, Crown, Wallet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { formatVND } from '@/lib/utils';

// --- Schema Definitions ---

const memberSchema = z.object({
  fullName: z.string().min(2, "Tên quá ngắn"),
  email: z.string().email("Email không hợp lệ"),
  role: z.enum(["leader", "treasurer", "member"]),
});

const baseClubSchema = z.object({
  name: z.string().min(3, "Tên CLB phải có ít nhất 3 ký tự"),
  category: z.string().min(1, "Vui lòng chọn lĩnh vực"),
  type: z.enum(["free", "paid"]),
  membershipFee: z.coerce.number().optional(),
  description: z.string().min(20, "Mô tả phải chi tiết hơn (tối thiểu 20 ký tự)"),
  logo: z.any().optional(), // File handling logic separate
  members: z.array(memberSchema).refine((members) => {
    return members.length >= 10;
  }, { message: "CLB cần tối thiểu 10 thành viên ban đầu." })
  .refine((members) => {
    return members.filter(m => m.role === 'leader').length === 1;
  }, { message: "Phải có đúng 1 Chủ nhiệm (Leader)." })
  .refine((members) => {
    return members.filter(m => m.role === 'treasurer').length === 1;
  }, { message: "Phải có đúng 1 Thủ quỹ (Treasurer)." })
  .superRefine((members, ctx) => {
    const emailCounts = new Map<string, number[]>();
    
    // Find duplicates
    members.forEach((member, index) => {
      const email = member.email.toLowerCase();
      if (email) {
        const indices = emailCounts.get(email) || [];
        indices.push(index);
        emailCounts.set(email, indices);
      }
    });

    // Add errors for duplicates
    emailCounts.forEach((indices) => {
      if (indices.length > 1) {
        indices.forEach(index => {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Email đã tồn tại trong danh sách",
            path: [index, "email"]
          });
        });
      }
    });
  })
});

const createClubSchema = baseClubSchema.superRefine((data, ctx) => {
  if (data.type === 'paid' && (!data.membershipFee || data.membershipFee < 10000)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Mức phí phải tối thiểu 10.000 VND",
      path: ["membershipFee"]
    });
  }
});

type CreateClubFormValues = z.infer<typeof createClubSchema>;

// --- Component ---

const CreateClubPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [importing, setImporting] = useState(false);

  const form = useForm<CreateClubFormValues>({
    resolver: zodResolver(createClubSchema),
    defaultValues: {
      name: "",
      category: "",
      type: "free",
      membershipFee: 0,
      description: "",
      members: [], // Start empty
    },
    mode: "onChange",
    reValidateMode: "onChange",
    shouldUnregister: false,
    shouldFocusError: false,
    criteriaMode: "all"
  });

  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: "members",
  });

  // Handle Excel Import
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws) as any[];

        // Map Excel columns to Schema (assuming columns: Name, Email, Role)
        const mappedMembers = data.map(row => ({
            fullName: row['Name'] || row['Họ tên'] || row['Ten'],
            email: row['Email'] || row['Mail'],
            role: (row['Role'] || row['Vai trò'] || 'member').toLowerCase(),
        })).filter(m => m.fullName && m.email); // Basic cleanup

        if (mappedMembers.length === 0) {
            toast({ title: "Lỗi file", description: "Không tìm thấy dữ liệu hợp lệ trong file.", variant: "destructive" });
        } else {
            // Append to existing list or replace? Let's replace for clarity or append if preferred.
            // Using replace here to bulk load.
            // Ensure roles match enum
            const validRoles = ["leader", "treasurer", "member"];
            const sanitizedMembers = mappedMembers.map(m => ({
                ...m,
                role: validRoles.includes(m.role) ? m.role : 'member'
            }));

            replace(sanitizedMembers as any);
            toast({ title: "Nhập thành công", description: `Đã tải lên ${sanitizedMembers.length} thành viên.` });
        }
      } catch (error) {
        console.error(error);
        toast({ title: "Lỗi nhập liệu", description: "File không đúng định dạng.", variant: "destructive" });
      } finally {
        setImporting(false);
        // Reset file input
        e.target.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  const onSubmit = async (data: CreateClubFormValues) => {
    setIsSubmitting(true);
    try {
        console.log("Submitting Club Data:", data);
        // Mock API Call
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        toast({
            title: "Tạo CLB thành công!",
            description: `Đã gửi thông tin đăng nhập đến email chủ nhiệm: ${data.members.find(m => m.role === 'leader')?.email}`,
        });
        navigate('/admin/clubs');
    } catch (error) {
        toast({ title: "Lỗi hệ thống", description: "Vui lòng thử lại sau.", variant: "destructive" });
    } finally {
        setIsSubmitting(false);
    }
  };

  // Helper to count roles - use watch to get real-time updates
  const members = form.watch("members");
  const memberStats = {
      total: members?.length || 0,
      leaders: members?.filter((m: any) => m.role === 'leader').length || 0,
      treasurers: members?.filter((m: any) => m.role === 'treasurer').length || 0,
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
            
            {/* Step 1: Club Information */}
            <Card>
                <CardHeader>
                    <CardTitle>1. Thông tin chung</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-6 md:grid-cols-2">
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Tên Câu lạc bộ</FormLabel>
                                <FormControl>
                                    <Input placeholder="Ví dụ: CLB Guitar" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Lĩnh vực hoạt động</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Chọn lĩnh vực" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="academic">Học thuật</SelectItem>
                                        <SelectItem value="arts">Văn hóa - Nghệ thuật</SelectItem>
                                        <SelectItem value="sports">Thể dục - Thể thao</SelectItem>
                                        <SelectItem value="volunteering">Tình nguyện - Xã hội</SelectItem>
                                        <SelectItem value="skills">Kỹ năng mềm</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="type"
                        render={({ field }) => (
                            <FormItem className="space-y-3">
                                <FormLabel>Hình thức tham gia</FormLabel>
                                <FormControl>
                                    <RadioGroup
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                        className="flex flex-col space-y-1"
                                    >
                                        <FormItem className="flex items-center space-x-3 space-y-0">
                                            <FormControl>
                                                <RadioGroupItem value="free" />
                                            </FormControl>
                                            <FormLabel className="font-normal">
                                                Miễn phí tham gia
                                            </FormLabel>
                                        </FormItem>
                                        <FormItem className="flex items-center space-x-3 space-y-0">
                                            <FormControl>
                                                <RadioGroupItem value="paid" />
                                            </FormControl>
                                            <FormLabel className="font-normal">
                                                Thu phí thành viên
                                            </FormLabel>
                                        </FormItem>
                                    </RadioGroup>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {form.watch("type") === "paid" && (
                        <FormField
                            control={form.control}
                            name="membershipFee"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Mức phí gia nhập (VND)</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input 
                                                type="text" 
                                                placeholder="0" 
                                                className="pl-9" 
                                                value={field.value ? formatVND(field.value) : ''}
                                                onChange={(e) => {
                                                    // Remove non-numeric characters (except for potential future decimals, but VND is usually integer)
                                                    const rawValue = e.target.value.replace(/\D/g, '');
                                                    const numberValue = Number(rawValue);
                                                    field.onChange(numberValue);
                                                }}
                                            />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    )}

                    <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                            <FormItem className="md:col-span-2">
                                <FormLabel>Mô tả / Sứ mệnh</FormLabel>
                                <FormControl>
                                    <Textarea 
                                        placeholder="Giới thiệu ngắn gọn về mục đích hoạt động của CLB..." 
                                        className="min-h-[100px]" 
                                        {...field} 
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </CardContent>
            </Card>

            {/* Step 2: Founding Members */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>2. Danh sách thành viên sáng lập</CardTitle>
                            <CardDescription className="pt-2">Tối thiểu 10 thành viên. Bao gồm 1 Chủ nhiệm và 1 Thủ quỹ.</CardDescription>
                        </div>
                        <div className="flex gap-2">
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button type="button" variant="outline" className="relative cursor-pointer" disabled={importing}>
                                            <Input 
                                                type="file" 
                                                accept=".xlsx, .xls" 
                                                className="absolute inset-0 opacity-0 cursor-pointer" 
                                                onChange={handleFileUpload}
                                                disabled={importing}
                                            />
                                            {importing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileSpreadsheet className="mr-2 h-4 w-4 text-green-600" />}
                                            Nhập Excel
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="bottom" className="max-w-sm p-4">
                                        <div className="space-y-2">
                                            <p className="font-semibold">Định dạng Excel được chấp nhận:</p>
                                            <div className="text-xs space-y-1">
                                                <p><strong>Cột bắt buộc:</strong></p>
                                                <ul className="list-disc list-inside ml-2 space-y-0.5">
                                                    <li><strong>Họ tên:</strong> Name, Họ tên, hoặc Ten</li>
                                                    <li><strong>Email:</strong> Email hoặc Mail</li>
                                                </ul>
                                                <p className="mt-2"><strong>Cột tùy chọn:</strong></p>
                                                <ul className="list-disc list-inside ml-2 space-y-0.5">
                                                    <li><strong>Vai trò:</strong> Role hoặc Vai trò</li>
                                                    <li>Giá trị: <code className="bg-muted px-1 rounded">leader</code>, <code className="bg-muted px-1 rounded">treasurer</code>, hoặc <code className="bg-muted px-1 rounded">member</code></li>
                                                    <li>Mặc định: <code className="bg-muted px-1 rounded">member</code> nếu để trống</li>
                                                </ul>
                                                <p className="mt-2 text-muted-foreground">Định dạng file: .xlsx hoặc .xls</p>
                                            </div>
                                        </div>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                            <Button type="button" variant="secondary" onClick={() => append({ fullName: "", email: "", role: "member" })}>
                                <Plus className="mr-2 h-4 w-4" /> Thêm thủ công
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Validation Errors for Members Array */}
                    {form.formState.errors.members?.root && (
                         <Alert variant="destructive">
                            <Info className="h-4 w-4" />
                            <AlertTitle>Lỗi danh sách</AlertTitle>
                            <AlertDescription>{form.formState.errors.members.root.message}</AlertDescription>
                        </Alert>
                    )}
                    
                    {/* Stats Bar */}
                    <div className="flex gap-4 text-sm bg-muted/50 p-3 rounded-md">
                        <div className={memberStats.total < 10 ? "text-destructive font-medium" : "text-green-600 font-medium"}>
                            Tổng: {memberStats.total}/10
                        </div>
                        <div className={memberStats.leaders !== 1 ? "text-destructive font-medium" : "text-green-600 font-medium"}>
                            Chủ nhiệm: {memberStats.leaders}/1
                        </div>
                        <div className={memberStats.treasurers !== 1 ? "text-destructive font-medium" : "text-green-600 font-medium"}>
                            Thủ quỹ: {memberStats.treasurers}/1
                        </div>
                    </div>

                    {/* Member Table */}
                    <div className="border rounded-md">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>STT</TableHead>
                                    <TableHead>Họ và Tên</TableHead>
                                    <TableHead>Email (Tài khoản)</TableHead>
                                    <TableHead>Vai trò</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {fields.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                            Chưa có thành viên nào. Hãy nhập file Excel hoặc thêm thủ công.
                                        </TableCell>
                                    </TableRow>
                                )}
                                {fields.map((field, index) => (
                                    <TableRow key={field.id}>
                                        <TableCell>{index + 1}</TableCell>
                                        <TableCell>
                                            <FormField
                                                control={form.control}
                                                name={`members.${index}.fullName`}
                                                render={({ field }) => {
                                                    return (
                                                        <FormItem>
                                                            <FormControl>
                                                                <Input 
                                                                    placeholder="Họ tên" 
                                                                    {...field}
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    );
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell>
                                             <FormField
                                                control={form.control}
                                                name={`members.${index}.email`}
                                                render={({ field }) => {
                                                    return (
                                                        <FormItem>
                                                            <FormControl>
                                                                <Input 
                                                                    placeholder="Email sinh viên" 
                                                                    type="email"
                                                                    {...field}
                                                                    onChange={(e) => {
                                                                        field.onChange(e);
                                                                        // Trigger validation for the whole members array to check for duplicates
                                                                        form.trigger("members");
                                                                    }}
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    );
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell>
                                             <FormField
                                                control={form.control}
                                                name={`members.${index}.role`}
                                                render={({ field }) => {
                                                    return (
                                                        <FormItem>
                                                            <Select 
                                                                onValueChange={(value) => {
                                                                    field.onChange(value);
                                                                    // Wait for state update to propagate
                                                                    setTimeout(() => {
                                                                        form.trigger("members");
                                                                    }, 0);
                                                                }} 
                                                                value={field.value}
                                                            >
                                                                <FormControl>
                                                                    <SelectTrigger>
                                                                        <SelectValue placeholder="Chọn vai trò" />
                                                                    </SelectTrigger>
                                                                </FormControl>
                                                                <SelectContent>
                                                                    <SelectItem value="leader">
                                                                        <div className="flex items-center">
                                                                            <Crown className="mr-2 h-4 w-4 text-yellow-500" />
                                                                            Chủ nhiệm
                                                                        </div>
                                                                    </SelectItem>
                                                                    <SelectItem value="treasurer">
                                                                        <div className="flex items-center">
                                                                            <Wallet className="mr-2 h-4 w-4 text-green-500" />
                                                                            Thủ quỹ
                                                                        </div>
                                                                    </SelectItem>
                                                                    <SelectItem value="member">
                                                                        <div className="flex items-center">
                                                                            Thành viên
                                                                        </div>
                                                                    </SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                            <FormMessage />
                                                        </FormItem>
                                                    );
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                                                <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
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
