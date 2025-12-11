import { useState } from 'react';
import { useQuery, useMutation } from "@tanstack/react-query";
import { adminService } from "@/services/admin.service";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import * as XLSX from 'xlsx';

const ImportRecruitmentPage = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [selectedClub, setSelectedClub] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [previewData, setPreviewData] = useState<any[]>([]);
    const [importing, setImporting] = useState(false);

    // Fetch Clubs
    const { data: clubs = [] } = useQuery({
        queryKey: ['admin-clubs-list'],
        queryFn: async () => {
            try {
                // return await adminService.getClubs();
                // Mock
                return [
                    { id: "1", name: "CLB Guitar" },
                    { id: "2", name: "CLB Lập trình" },
                    { id: "3", name: "CLB Bóng rổ" },
                ];
            } catch (error) {
                console.error(error);
                return [];
            }
        }
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        setFile(selectedFile);
        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const bstr = evt.target?.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws);
                setPreviewData(data);
            } catch (error) {
                console.error(error);
                toast({ title: "Lỗi đọc file", description: "File không đúng định dạng.", variant: "destructive" });
            }
        };
        reader.readAsBinaryString(selectedFile);
    };

    const importMutation = useMutation({
        mutationFn: () => adminService.importRecruitmentExcel(file!, selectedClub),
        onSuccess: () => {
            toast({ title: "Thành công", description: "Đã import danh sách và gửi email kích hoạt." });
            navigate("/admin/recruitment");
        },
        onError: () => toast({ title: "Lỗi", description: "Import thất bại.", variant: "destructive" })
    });

    const handleSubmit = () => {
        if (!file || !selectedClub) {
            toast({ title: "Thiếu thông tin", description: "Vui lòng chọn CLB và file Excel.", variant: "destructive" });
            return;
        }
        // importMutation.mutate();
        console.log("Mock import", importMutation);
        setImporting(true);
        setTimeout(() => {
            setImporting(false);
            toast({ title: "Simulation", description: `Imported ${previewData.length} users to Club ID ${selectedClub}` });
            navigate("/admin/recruitment");
        }, 1500);
    };

    return (
        <div className="space-y-6 pb-20">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate('/admin/recruitment')}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Import Danh sách Thành viên</h2>
                    <p className="text-muted-foreground text-sm">Thêm thủ công danh sách trúng tuyển cho CLB.</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>1. Thông tin nhập liệu</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid w-full max-w-sm items-center gap-1.5">
                        <Label htmlFor="club">Câu lạc bộ</Label>
                        <Select onValueChange={setSelectedClub} value={selectedClub}>
                            <SelectTrigger>
                                <SelectValue placeholder="Chọn CLB..." />
                            </SelectTrigger>
                            <SelectContent>
                                {clubs.map((club: any) => (
                                    <SelectItem key={club.id} value={club.id}>{club.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid w-full max-w-sm items-center gap-1.5">
                        <Label htmlFor="excel">File Excel danh sách</Label>
                        <Input id="excel" type="file" accept=".xlsx, .xls" onChange={handleFileChange} />
                        <p className="text-xs text-muted-foreground">Định dạng: Họ tên, Email, SĐT, Ngành</p>
                    </div>
                </CardContent>
            </Card>

            {previewData.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>2. Xem trước ({previewData.length} bản ghi)</CardTitle>
                        <CardDescription>Vui lòng kiểm tra kỹ trước khi xác nhận import.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="border rounded-md max-h-[400px] overflow-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>STT</TableHead>
                                        {Object.keys(previewData[0] || {}).map((header) => (
                                            <TableHead key={header}>{header}</TableHead>
                                        ))}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {previewData.map((row, index) => (
                                        <TableRow key={index}>
                                            <TableCell>{index + 1}</TableCell>
                                            {Object.values(row).map((val: any, idx) => (
                                                <TableCell key={idx}>{val}</TableCell>
                                            ))}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                        
                        <div className="mt-6 flex justify-end">
                            <Button size="lg" onClick={handleSubmit} disabled={importing}>
                                {importing ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang xử lý...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="mr-2 h-4 w-4" /> Xác nhận Import
                                    </>
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default ImportRecruitmentPage;

