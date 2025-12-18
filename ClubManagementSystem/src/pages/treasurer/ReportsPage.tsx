import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { treasurerService } from "@/services/treasurer.service";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  FileBarChart, 
  Download,
  Loader2,
  TrendingUp,
  TrendingDown
} from "lucide-react";
import { formatVND } from "@/lib/utils";

export default function ReportsPage() {
  const { clubId } = useParams<{ clubId: string }>();
  const { toast } = useToast();
  const [reportType, setReportType] = useState("income-statement");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [exportFormat, setExportFormat] = useState<"excel" | "csv">("excel");
  const [isExporting, setIsExporting] = useState(false);

  // Set default date range to current month
  useEffect(() => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    setStartDate(format(firstDay, "yyyy-MM-dd"));
    setEndDate(format(lastDay, "yyyy-MM-dd"));
  }, []);

  // Fetch preview data
  const { data: ledgerData, isLoading: loadingLedger } = useQuery({
    queryKey: ["treasurer-ledger-preview", clubId, reportType, startDate, endDate],
    queryFn: async () => {
      if (!clubId || !startDate || !endDate) return null;
      const type = reportType === "income-statement" ? "INCOME" : 
                   reportType === "expense-report" ? "EXPENSE" : undefined;
      return await treasurerService.getLedgerEntries({
        clubId,
        type,
        startDate,
        endDate,
        limit: 10, // Show first 10 entries for preview
      });
    },
    enabled: !!clubId && !!startDate && !!endDate && (reportType === "income-statement" || reportType === "expense-report"),
    staleTime: 30 * 1000,
  });

  const { data: transactionsData, isLoading: loadingTransactions } = useQuery({
    queryKey: ["treasurer-transactions-preview", clubId, startDate, endDate],
    queryFn: async () => {
      if (!clubId || !startDate || !endDate) return null;
      return await treasurerService.getTransactions({
        clubId,
        startDate,
        endDate,
        limit: 10, // Show first 10 transactions for preview
      });
    },
    enabled: !!clubId && !!startDate && !!endDate && reportType === "transaction-summary",
    staleTime: 30 * 1000,
  });

  // Calculate summary for balance sheet
  const { data: balanceSheetData, isLoading: loadingBalanceSheet } = useQuery({
    queryKey: ["treasurer-balance-sheet", clubId, startDate, endDate],
    queryFn: async () => {
      if (!clubId || !startDate || !endDate) return null;
      const [incomeData, expenseData] = await Promise.all([
        treasurerService.getLedgerEntries({
          clubId,
          type: "INCOME",
          startDate,
          endDate,
        }),
        treasurerService.getLedgerEntries({
          clubId,
          type: "EXPENSE",
          startDate,
          endDate,
        }),
      ]);
      const totalIncome = incomeData.data.reduce((sum, e) => sum + e.amount, 0);
      const totalExpense = expenseData.data.reduce((sum, e) => sum + e.amount, 0);
      return {
        totalIncome,
        totalExpense,
        netBalance: totalIncome - totalExpense,
      };
    },
    enabled: !!clubId && !!startDate && !!endDate && reportType === "balance-sheet",
    staleTime: 30 * 1000,
  });

  const isLoadingPreview = loadingLedger || loadingTransactions || loadingBalanceSheet;

  const handleExport = async () => {
    if (!startDate || !endDate) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn khoảng thời gian",
        variant: "destructive",
      });
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      toast({
        title: "Lỗi",
        description: "Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc",
        variant: "destructive",
      });
      return;
    }

    if (!clubId) {
      toast({
        title: "Lỗi",
        description: "Không tìm thấy CLB",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);
    try {
      const blob = await treasurerService.exportReport(
        clubId,
        reportType,
        { startDate, endDate },
        exportFormat
      );

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      // Set filename based on format
      const formatExt = exportFormat === "excel" ? "xlsx" : exportFormat;
      const reportTypeNames: Record<string, string> = {
        "income-statement": "BaoCaoThuNhap",
        "expense-report": "BaoCaoChiTieu",
        "balance-sheet": "BangCanDoi",
        "transaction-summary": "TomTatGiaoDich",
      };
      const fileName = `${reportTypeNames[reportType] || "BaoCao"}_${startDate}_${endDate}.${formatExt}`;
      link.setAttribute("download", fileName);

      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast({
        title: "Thành công",
        description: `Đã xuất báo cáo ${exportFormat.toUpperCase()} thành công`,
      });
    } catch (error: any) {
      console.error("Export error:", error);
      toast({
        title: "Lỗi",
        description: error.response?.data?.message || "Lỗi khi xuất báo cáo",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Báo cáo tài chính</h1>
        <p className="text-muted-foreground mt-2">
          Xuất báo cáo tài chính của câu lạc bộ
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Report Configuration */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Cấu hình báo cáo</CardTitle>
              <CardDescription>Chọn loại báo cáo và khoảng thời gian</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Loại báo cáo</Label>
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income-statement">Báo cáo thu nhập</SelectItem>
                    <SelectItem value="expense-report">Báo cáo chi tiêu</SelectItem>
                    <SelectItem value="balance-sheet">Bảng cân đối</SelectItem>
                    <SelectItem value="transaction-summary">Tóm tắt giao dịch</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Từ ngày</Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="mt-1 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-100 [&::-webkit-calendar-picker-indicator]:brightness-0 [&::-webkit-calendar-picker-indicator]:contrast-100"
                  />
                </div>
                <div>
                  <Label>Đến ngày</Label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="mt-1 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-100 [&::-webkit-calendar-picker-indicator]:brightness-0 [&::-webkit-calendar-picker-indicator]:contrast-100"
                  />
                </div>
              </div>

              <div>
                <Label>Định dạng xuất</Label>
                <Select 
                  value={exportFormat} 
                  onValueChange={(v) => setExportFormat(v as "excel" | "csv")}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="excel">Excel (XLSX)</SelectItem>
                    <SelectItem value="csv">CSV</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button 
                className="w-full" 
                onClick={handleExport}
                disabled={!startDate || !endDate || isExporting}
              >
                {isExporting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Đang xuất...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Xuất báo cáo
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Report Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Xem trước báo cáo</CardTitle>
              <CardDescription>
                {startDate && endDate 
                  ? `Dữ liệu từ ${format(new Date(startDate), "dd/MM/yyyy", { locale: vi })} đến ${format(new Date(endDate), "dd/MM/yyyy", { locale: vi })}`
                  : "Chọn loại báo cáo và khoảng thời gian để xem trước"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!startDate || !endDate ? (
                <div className="h-64 flex items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg">
                  <div className="text-center">
                    <FileBarChart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Chọn loại báo cáo và khoảng thời gian để xem trước</p>
                  </div>
                </div>
              ) : isLoadingPreview ? (
                <div className="space-y-4">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-32 w-full" />
                </div>
              ) : reportType === "balance-sheet" ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 border rounded-lg">
                      <div className="text-sm text-muted-foreground mb-1">Tổng thu nhập</div>
                      <div className="text-2xl font-bold text-green-600">
                        {formatVND(balanceSheetData?.totalIncome || 0)}
                      </div>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="text-sm text-muted-foreground mb-1">Tổng chi tiêu</div>
                      <div className="text-2xl font-bold text-red-600">
                        {formatVND(balanceSheetData?.totalExpense || 0)}
                      </div>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="text-sm text-muted-foreground mb-1">Số dư ròng</div>
                      <div className={`text-2xl font-bold ${(balanceSheetData?.netBalance || 0) >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {formatVND(balanceSheetData?.netBalance || 0)}
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    * Báo cáo sẽ bao gồm tất cả các giao dịch trong khoảng thời gian đã chọn
                  </p>
                </div>
              ) : reportType === "transaction-summary" ? (
                <div className="space-y-4">
                  {transactionsData?.data && transactionsData.data.length > 0 ? (
                    <>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Mã giao dịch</TableHead>
                            <TableHead>Loại</TableHead>
                            <TableHead>Trạng thái</TableHead>
                            <TableHead className="text-right">Số tiền</TableHead>
                            <TableHead>Ngày tạo</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {transactionsData.data.slice(0, 5).map((tx) => (
                            <TableRow key={tx.id}>
                              <TableCell className="font-mono text-sm">
                                {tx.id.slice(0, 8)}...
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">{tx.type}</Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant={tx.status === "SUCCESS" ? "default" : "secondary"}>
                                  {tx.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                {formatVND(tx.amount)}
                              </TableCell>
                              <TableCell className="text-sm">
                                {format(new Date(tx.createdAt), "dd/MM/yyyy", { locale: vi })}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      {transactionsData.data.length > 5 && (
                        <p className="text-sm text-muted-foreground text-center">
                          Hiển thị 5/{transactionsData.data.length} giao dịch đầu tiên. Báo cáo đầy đủ sẽ bao gồm tất cả {transactionsData.data.length} giao dịch.
                        </p>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      Không có giao dịch nào trong khoảng thời gian này
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {ledgerData?.data && ledgerData.data.length > 0 ? (
                    <>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Ngày giờ</TableHead>
                            <TableHead>Loại</TableHead>
                            <TableHead>Ghi chú</TableHead>
                            <TableHead className="text-right">Số tiền</TableHead>
                            <TableHead className="text-right">Số dư sau</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {ledgerData.data.slice(0, 5).map((entry) => (
                            <TableRow key={entry.id}>
                              <TableCell className="text-sm">
                                {format(new Date(entry.createdAt), "dd/MM/yyyy HH:mm", { locale: vi })}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={entry.type === "INCOME" ? "default" : "destructive"}
                                  className="flex items-center gap-1 w-fit"
                                >
                                  {entry.type === "INCOME" ? (
                                    <TrendingUp className="h-3 w-3" />
                                  ) : (
                                    <TrendingDown className="h-3 w-3" />
                                  )}
                                  {entry.type === "INCOME" ? "Thu" : "Chi"}
                                </Badge>
                              </TableCell>
                              <TableCell className="max-w-xs truncate">
                                {entry.note || "Không có ghi chú"}
                              </TableCell>
                              <TableCell className={`text-right font-medium ${entry.type === "INCOME" ? "text-green-600" : "text-red-600"}`}>
                                {entry.type === "INCOME" ? "+" : "-"}
                                {formatVND(entry.amount)}
                              </TableCell>
                              <TableCell className="text-right font-semibold">
                                {formatVND(entry.balanceAfter)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      {ledgerData.data.length > 5 && (
                        <p className="text-sm text-muted-foreground text-center">
                          Hiển thị 5/{ledgerData.data.length} giao dịch đầu tiên. Báo cáo đầy đủ sẽ bao gồm tất cả {ledgerData.data.length} giao dịch.
                        </p>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      Không có dữ liệu nào trong khoảng thời gian này
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Report Types Info */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Loại báo cáo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <h4 className="font-medium text-sm mb-1">Báo cáo thu nhập</h4>
                <p className="text-xs text-muted-foreground">
                  Tổng hợp các khoản thu nhập trong kỳ
                </p>
              </div>
              <div>
                <h4 className="font-medium text-sm mb-1">Báo cáo chi tiêu</h4>
                <p className="text-xs text-muted-foreground">
                  Tổng hợp các khoản chi tiêu trong kỳ
                </p>
              </div>
              <div>
                <h4 className="font-medium text-sm mb-1">Bảng cân đối</h4>
                <p className="text-xs text-muted-foreground">
                  Tổng quan tài chính tại một thời điểm
                </p>
              </div>
              <div>
                <h4 className="font-medium text-sm mb-1">Tóm tắt giao dịch</h4>
                <p className="text-xs text-muted-foreground">
                  Danh sách chi tiết các giao dịch
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

