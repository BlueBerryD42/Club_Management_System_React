import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  FileBarChart, 
  Download,
  Calendar,
  FileText
} from "lucide-react";

export default function ReportsPage() {
  const { clubId } = useParams<{ clubId: string }>();
  const [reportType, setReportType] = useState("income-statement");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [exportFormat, setExportFormat] = useState<"pdf" | "excel" | "csv">("pdf");

  // Set default date range to current month
  useEffect(() => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    setStartDate(format(firstDay, "yyyy-MM-dd"));
    setEndDate(format(lastDay, "yyyy-MM-dd"));
  }, []);

  const handleExport = async () => {
    if (!startDate || !endDate) {
      alert("Vui lòng chọn khoảng thời gian");
      return;
    }

    if (!clubId) {
      alert("Không tìm thấy CLB");
      return;
    }

    try {
      // TODO: Implement when backend supports
      alert(`Chức năng xuất ${exportFormat.toUpperCase()} sẽ được triển khai khi backend hỗ trợ`);
      // await treasurerService.exportReport(clubId, { startDate, endDate }, exportFormat);
    } catch (error) {
      alert("Lỗi khi xuất báo cáo");
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
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Đến ngày</Label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label>Định dạng xuất</Label>
                <Select 
                  value={exportFormat} 
                  onValueChange={(v) => setExportFormat(v as "pdf" | "excel" | "csv")}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="excel">Excel (XLSX)</SelectItem>
                    <SelectItem value="csv">CSV</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button 
                className="w-full" 
                onClick={handleExport}
                disabled={!startDate || !endDate}
              >
                <Download className="h-4 w-4 mr-2" />
                Xuất báo cáo
              </Button>
            </CardContent>
          </Card>

          {/* Report Preview Placeholder */}
          <Card>
            <CardHeader>
              <CardTitle>Xem trước báo cáo</CardTitle>
              <CardDescription>Báo cáo sẽ được hiển thị ở đây</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg">
                <div className="text-center">
                  <FileBarChart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Chọn loại báo cáo và khoảng thời gian để xem trước</p>
                </div>
              </div>
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

