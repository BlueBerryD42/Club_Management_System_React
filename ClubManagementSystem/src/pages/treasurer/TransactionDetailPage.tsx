import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { treasurerService } from "@/services/treasurer.service";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatVND } from "@/lib/utils";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  ArrowLeft,
  CreditCard,
  Calendar,
  User,
  Building2,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Ban,
  QrCode,
  ExternalLink,
  Copy,
  Check,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function TransactionDetailPage() {
  const { clubId, transactionId } = useParams<{ clubId: string; transactionId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const { data: transactionData, isLoading, error } = useQuery({
    queryKey: ["treasurer-transaction-detail", clubId, transactionId],
    queryFn: async () => {
      if (!clubId || !transactionId) return null;
      const response = await treasurerService.getTransactionDetail(clubId, transactionId);
      return response.data || response;
    },
    enabled: !!clubId && !!transactionId,
  });

  const transaction = transactionData;

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    toast({
      title: "Đã sao chép",
      description: `${fieldName} đã được sao chép vào clipboard`,
    });
    setTimeout(() => setCopiedField(null), 2000);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      SUCCESS: "default",
      PENDING: "secondary",
      FAILED: "destructive",
      CANCELLED: "outline",
      REFUNDED: "outline",
    };

    const icons: Record<string, any> = {
      SUCCESS: CheckCircle,
      PENDING: Clock,
      FAILED: XCircle,
      CANCELLED: Ban,
      REFUNDED: Ban,
    };

    const labels: Record<string, string> = {
      SUCCESS: "Thành công",
      PENDING: "Chờ xử lý",
      FAILED: "Thất bại",
      CANCELLED: "Đã hủy",
      REFUNDED: "Đã hoàn tiền",
    };

    const Icon = icons[status] || Clock;
    const variant = variants[status] || "secondary";

    return (
      <Badge variant={variant} className="gap-2 px-3 py-1">
        <Icon className="h-3 w-3" />
        {labels[status] || status}
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
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-64" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32 mt-2" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !transaction) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Chi tiết giao dịch</h1>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center py-8">
              <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <p className="text-lg font-medium mb-2">Không tìm thấy giao dịch</p>
              <p className="text-muted-foreground">
                Giao dịch không tồn tại hoặc bạn không có quyền xem.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Chi tiết giao dịch</h1>
          <p className="text-muted-foreground">Thông tin đầy đủ về giao dịch</p>
        </div>
      </div>

      {/* Transaction Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-3">
                <CreditCard className="h-5 w-5" />
                Thông tin giao dịch
              </CardTitle>
              <CardDescription className="mt-2">
                Mã giao dịch: {transaction.id}
              </CardDescription>
            </div>
            {getStatusBadge(transaction.status)}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="h-4 w-4" />
                <span>Loại giao dịch</span>
              </div>
              <p className="text-lg font-medium">{getTypeLabel(transaction.type)}</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CreditCard className="h-4 w-4" />
                <span>Số tiền</span>
              </div>
              <p className="text-2xl font-bold text-primary">{formatVND(transaction.amount)}</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Ngày tạo</span>
              </div>
              <p className="text-lg">
                {format(new Date(transaction.createdAt), "dd/MM/yyyy HH:mm:ss", { locale: vi })}
              </p>
            </div>

            {transaction.confirmedAt && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="h-4 w-4" />
                  <span>Ngày xác nhận</span>
                </div>
                <p className="text-lg">
                  {format(new Date(transaction.confirmedAt), "dd/MM/yyyy HH:mm:ss", { locale: vi })}
                </p>
              </div>
            )}
          </div>

          <Separator />

          {/* Transaction ID & Payment Reference */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="h-4 w-4" />
                <span>Mã giao dịch</span>
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-2 bg-muted rounded-md text-sm font-mono">
                  {transaction.id}
                </code>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => copyToClipboard(transaction.id, "Mã giao dịch")}
                >
                  {copiedField === "transactionId" ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {transaction.paymentReference && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  <span>Mã thanh toán (PayOS)</span>
                </div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 px-3 py-2 bg-muted rounded-md text-sm font-mono">
                    {transaction.paymentReference}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => copyToClipboard(transaction.paymentReference!, "Mã thanh toán")}
                  >
                    {copiedField === "paymentReference" ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Payment Info */}
          {transaction.paymentLink && (
            <>
              <Separator />
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Thông tin thanh toán</h3>
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    onClick={() => window.open(transaction.paymentLink, "_blank")}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Mở link thanh toán
                  </Button>
                  {transaction.qrCode && (
                    <div className="flex items-center gap-2">
                      <QrCode className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Có QR Code</span>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* User & Club Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {transaction.user && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Người thực hiện
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Họ và tên</p>
                <p className="font-medium">{transaction.user.fullName || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{transaction.user.email || "N/A"}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {transaction.club && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Câu lạc bộ
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Tên CLB</p>
                <p className="font-medium">{transaction.club.name || "N/A"}</p>
              </div>
              {transaction.club.slug && (
                <div>
                  <p className="text-sm text-muted-foreground">Slug</p>
                  <p className="font-medium">{transaction.club.slug}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Event Ticket Details */}
      {transaction.type === "EVENT_TICKET" && transaction.tickets && transaction.tickets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Thông tin vé</CardTitle>
            <CardDescription>
              {transaction.tickets.length} vé đã được mua trong giao dịch này
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Loại vé</TableHead>
                  <TableHead>Giá</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Sự kiện</TableHead>
                  <TableHead>Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transaction.tickets.map((ticket: any) => (
                  <TableRow key={ticket.id}>
                    <TableCell>
                      <Badge variant="outline">{ticket.ticketType || "Standard"}</Badge>
                    </TableCell>
                    <TableCell className="font-semibold">{formatVND(ticket.price || 0)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          ticket.status === "PAID"
                            ? "default"
                            : ticket.status === "CANCELLED"
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {ticket.status === "PAID" && "Đã thanh toán"}
                        {ticket.status === "RESERVED" && "Đã đặt"}
                        {ticket.status === "CANCELLED" && "Đã hủy"}
                        {ticket.status === "USED" && "Đã sử dụng"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {ticket.event ? (
                        <div>
                          <p className="font-medium">{ticket.event.title}</p>
                          {ticket.event.startTime && (
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(ticket.event.startTime), "dd/MM/yyyy HH:mm", {
                                locale: vi,
                              })}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">N/A</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {ticket.qrCode && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // Open QR code in new window or show modal
                            window.open(
                              `data:image/png;base64,${ticket.qrCode}`,
                              "_blank",
                              "width=400,height=400"
                            );
                          }}
                        >
                          <QrCode className="h-4 w-4 mr-2" />
                          Xem QR
                        </Button>
                      )}
                      {ticket.onlineLink && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(ticket.onlineLink, "_blank")}
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Link tham gia
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Membership Details */}
      {transaction.type === "MEMBERSHIP" && transaction.membership && (
        <Card>
          <CardHeader>
            <CardTitle>Thông tin thành viên</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Trạng thái</p>
              <Badge
                variant={
                  transaction.membership.status === "ACTIVE"
                    ? "default"
                    : transaction.membership.status === "PENDING_PAYMENT"
                    ? "secondary"
                    : "outline"
                }
              >
                {transaction.membership.status === "ACTIVE" && "Đang hoạt động"}
                {transaction.membership.status === "PENDING_PAYMENT" && "Chờ thanh toán"}
                {transaction.membership.status === "INACTIVE" && "Không hoạt động"}
              </Badge>
            </div>
            {transaction.membership.club && (
              <div>
                <p className="text-sm text-muted-foreground">Câu lạc bộ</p>
                <p className="font-medium">{transaction.membership.club.name}</p>
              </div>
            )}
            {transaction.membership.joinedAt && (
              <div>
                <p className="text-sm text-muted-foreground">Ngày tham gia</p>
                <p className="font-medium">
                  {format(new Date(transaction.membership.joinedAt), "dd/MM/yyyy", { locale: vi })}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* PayOS Data (if available) */}
      {transaction.payosData && (
        <Card>
          <CardHeader>
            <CardTitle>Dữ liệu PayOS</CardTitle>
            <CardDescription>Thông tin chi tiết từ hệ thống thanh toán PayOS</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="p-4 bg-muted rounded-md overflow-auto text-xs">
              {JSON.stringify(transaction.payosData, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* Ledger Entry Info */}
      {transaction.ledger && transaction.ledger.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Sổ cái</CardTitle>
            <CardDescription>
              {transaction.ledger.length} bản ghi sổ cái liên quan đến giao dịch này
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Loại</TableHead>
                  <TableHead>Số tiền</TableHead>
                  <TableHead>Số dư sau</TableHead>
                  <TableHead>Ghi chú</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transaction.ledger.map((entry: any) => (
                  <TableRow key={entry.id}>
                    <TableCell>
                      <Badge variant={entry.type === "INCOME" ? "default" : "destructive"}>
                        {entry.type === "INCOME" ? "Thu nhập" : "Chi tiêu"}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-semibold">{formatVND(entry.amount)}</TableCell>
                    <TableCell>{formatVND(entry.balanceAfter)}</TableCell>
                    <TableCell>{entry.note || "N/A"}</TableCell>
                    <TableCell>
                      {format(new Date(entry.createdAt), "dd/MM/yyyy HH:mm", { locale: vi })}
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



