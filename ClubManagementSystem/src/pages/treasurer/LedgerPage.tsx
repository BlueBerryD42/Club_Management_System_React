import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { treasurerService } from "@/services/treasurer.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatVND } from "@/lib/utils";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { 
  BookOpen, 
  TrendingUp, 
  TrendingDown,
  Search,
  Download,
  Loader2
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function LedgerPage() {
  const { clubId } = useParams<{ clubId: string }>();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  const { data: ledgerData, isLoading } = useQuery({
    queryKey: ["treasurer-ledger", clubId, typeFilter, startDate, endDate],
    queryFn: async () => {
      if (!clubId) return null;
      return await treasurerService.getLedgerEntries({
        clubId,
        type: typeFilter !== "all" ? (typeFilter as "INCOME" | "EXPENSE") : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
    },
    enabled: !!clubId,
  });

  const entries = ledgerData?.data || [];

  // Filter by search term
  const filteredEntries = entries.filter((entry) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      entry.note?.toLowerCase().includes(searchLower) ||
      formatVND(entry.amount).toLowerCase().includes(searchLower)
    );
  });

  const handleExport = async () => {
    if (!clubId) {
      toast({
        title: "Lỗi",
        description: "Không tìm thấy CLB",
        variant: "destructive",
      });
      return;
    }

    // Determine report type based on filter
    let reportType = "transaction-summary";
    if (typeFilter === "INCOME") {
      reportType = "income-statement";
    } else if (typeFilter === "EXPENSE") {
      reportType = "expense-report";
    }

    // Use date range if provided, otherwise use all time
    const exportStartDate = startDate || new Date(0).toISOString().split("T")[0];
    const exportEndDate = endDate || new Date().toISOString().split("T")[0];

    setIsExporting(true);
    try {
      const blob = await treasurerService.exportReport(
        clubId,
        reportType,
        { startDate: exportStartDate, endDate: exportEndDate },
        "excel"
      );

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      // Set filename
      const dateRange = startDate && endDate 
        ? `${startDate}_${endDate}` 
        : `all_time`;
      const typeLabel = typeFilter === "all" 
        ? "SoCai" 
        : typeFilter === "INCOME" 
        ? "ThuNhap" 
        : "ChiTieu";
      const fileName = `SoCai_${typeLabel}_${dateRange}.xlsx`;
      link.setAttribute("download", fileName);

      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast({
        title: "Thành công",
        description: "Đã xuất sổ cái thành công",
      });
    } catch (error: any) {
      console.error("Export error:", error);
      toast({
        title: "Lỗi",
        description: error.response?.data?.message || "Lỗi khi xuất sổ cái",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Sổ cái</h1>
          <p className="text-muted-foreground mt-2">
            Lịch sử thu chi của câu lạc bộ
          </p>
        </div>
        <Button 
          onClick={handleExport} 
          variant="outline"
          disabled={isExporting}
        >
          {isExporting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Đang xuất...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Xuất file
            </>
          )}
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative flex flex-col">
              <Label htmlFor="search" className="text-sm font-medium mb-2">Tìm kiếm</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground z-10 pointer-events-none" />
                <Input
                  id="search"
                  placeholder="Tìm kiếm..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex flex-col">
              <Label className="text-sm font-medium mb-2">Loại giao dịch</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Loại giao dịch" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="INCOME">Thu nhập</SelectItem>
                  <SelectItem value="EXPENSE">Chi tiêu</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col">
              <Label htmlFor="start-date" className="text-sm font-medium mb-2">Từ ngày</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="[&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-100 [&::-webkit-calendar-picker-indicator]:brightness-0 [&::-webkit-calendar-picker-indicator]:contrast-100"
              />
            </div>
            <div className="flex flex-col">
              <Label htmlFor="end-date" className="text-sm font-medium mb-2">Đến ngày</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="[&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-100 [&::-webkit-calendar-picker-indicator]:brightness-0 [&::-webkit-calendar-picker-indicator]:contrast-100"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ledger Table */}
      {filteredEntries.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium text-muted-foreground">
              {searchTerm || typeFilter !== "all" || startDate || endDate
                ? "Không tìm thấy giao dịch nào"
                : "Chưa có giao dịch nào"}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              {searchTerm || typeFilter !== "all" || startDate || endDate
                ? "Thử thay đổi bộ lọc để xem thêm"
                : "Các giao dịch sẽ được hiển thị ở đây khi có dữ liệu"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Tổng cộng: {filteredEntries.length} giao dịch</CardTitle>
          </CardHeader>
          <CardContent>
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
                {filteredEntries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>
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
                    <TableCell className="max-w-md">
                      <p className="truncate">{entry.note || "Không có ghi chú"}</p>
                      {entry.transaction && (
                        <p className="text-xs text-muted-foreground">
                          Giao dịch: {entry.transaction.id.slice(0, 8)}...
                        </p>
                      )}
                      {entry.fundRequest && (
                        <p className="text-xs text-muted-foreground">
                          Yêu cầu: {entry.fundRequest.title}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      <span className={entry.type === "INCOME" ? "text-green-600" : "text-red-600"}>
                        {entry.type === "INCOME" ? "+" : "-"}
                        {formatVND(entry.amount)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatVND(entry.balanceAfter)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

