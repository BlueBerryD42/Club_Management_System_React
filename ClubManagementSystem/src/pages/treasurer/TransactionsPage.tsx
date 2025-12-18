import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { treasurerService } from "@/services/treasurer.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  CreditCard, 
  Search,
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

export default function TransactionsPage() {
  const { clubId } = useParams<{ clubId: string }>();
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const { data: transactionsData, isLoading } = useQuery({
    queryKey: ["treasurer-transactions", clubId, typeFilter, statusFilter, startDate, endDate],
    queryFn: async () => {
      if (!clubId) return null;
      return await treasurerService.getTransactions({
        clubId,
        type: typeFilter !== "all" ? (typeFilter as any) : undefined,
        status: statusFilter !== "all" ? (statusFilter as any) : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
    },
    enabled: !!clubId,
  });

  const transactions = transactionsData?.data || [];

  // Filter by search term
  const filteredTransactions = transactions.filter((tx) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      tx.id.toLowerCase().includes(searchLower) ||
      tx.paymentReference?.toLowerCase().includes(searchLower) ||
      tx.referenceTicket?.event?.title?.toLowerCase().includes(searchLower) ||
      tx.referenceMembership?.club?.name?.toLowerCase().includes(searchLower)
    );
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      SUCCESS: "default",
      PENDING: "secondary",
      FAILED: "destructive",
      CANCELLED: "outline",
      REFUNDED: "outline",
    };
    return (
      <Badge variant={variants[status] || "secondary"}>
        {status === "SUCCESS" && "Thành công"}
        {status === "PENDING" && "Chờ xử lý"}
        {status === "FAILED" && "Thất bại"}
        {status === "CANCELLED" && "Đã hủy"}
        {status === "REFUNDED" && "Đã hoàn tiền"}
      </Badge>
    );
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      MEMBERSHIP: "Phí thành viên",
      EVENT_TICKET: "Vé sự kiện",
      TOPUP: "Nạp tiền",
      REFUND: "Hoàn tiền",
      FUND_REQ: "Yêu cầu quỹ",
    };
    return labels[type] || type;
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
      <div>
        <h1 className="text-3xl font-bold text-foreground">Giao dịch</h1>
        <p className="text-muted-foreground mt-2">
          Theo dõi các giao dịch PayOS của câu lạc bộ
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Loại giao dịch" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="MEMBERSHIP">Phí thành viên</SelectItem>
                <SelectItem value="EVENT_TICKET">Vé sự kiện</SelectItem>
                <SelectItem value="TOPUP">Nạp tiền</SelectItem>
                <SelectItem value="REFUND">Hoàn tiền</SelectItem>
                <SelectItem value="FUND_REQ">Yêu cầu quỹ</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="SUCCESS">Thành công</SelectItem>
                <SelectItem value="PENDING">Chờ xử lý</SelectItem>
                <SelectItem value="FAILED">Thất bại</SelectItem>
                <SelectItem value="CANCELLED">Đã hủy</SelectItem>
                <SelectItem value="REFUNDED">Đã hoàn tiền</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="date"
              placeholder="Từ ngày"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="[&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-100 [&::-webkit-calendar-picker-indicator]:brightness-0 [&::-webkit-calendar-picker-indicator]:contrast-100"
            />
            <Input
              type="date"
              placeholder="Đến ngày"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="[&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-100 [&::-webkit-calendar-picker-indicator]:brightness-0 [&::-webkit-calendar-picker-indicator]:contrast-100"
            />
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      {filteredTransactions.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium text-muted-foreground">
              {searchTerm || typeFilter !== "all" || statusFilter !== "all" || startDate || endDate
                ? "Không tìm thấy giao dịch nào"
                : "Chưa có giao dịch nào"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Tổng cộng: {filteredTransactions.length} giao dịch</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã giao dịch</TableHead>
                  <TableHead>Loại</TableHead>
                  <TableHead>Chi tiết</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Số tiền</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className="font-mono text-sm">
                      {tx.id.slice(0, 8)}...
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{getTypeLabel(tx.type)}</Badge>
                    </TableCell>
                    <TableCell className="max-w-md">
                      {tx.referenceTicket?.event && (
                        <p className="truncate">
                          Sự kiện: {tx.referenceTicket.event.title}
                        </p>
                      )}
                      {tx.referenceMembership?.club && (
                        <p className="truncate">
                          CLB: {tx.referenceMembership.club.name}
                        </p>
                      )}
                      {tx.paymentReference && (
                        <p className="text-xs text-muted-foreground">
                          Ref: {tx.paymentReference}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(tx.status)}</TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatVND(tx.amount)}
                    </TableCell>
                    <TableCell>
                      {format(new Date(tx.createdAt), "dd/MM/yyyy HH:mm", { locale: vi })}
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

