import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { treasurerService } from "@/services/treasurer.service";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { formatVND } from "@/lib/utils";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { 
  FileText, 
  Calendar, 
  User, 
  DollarSign,
  Search,
  Eye
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function PendingFundRequestsPage() {
  const { clubId } = useParams<{ clubId: string }>();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: pendingData, isLoading } = useQuery({
    queryKey: ["treasurer-pending-events", clubId],
    queryFn: async () => {
      if (!clubId) return null;
      return await treasurerService.getPendingEvents(clubId);
    },
    enabled: !!clubId,
  });

  const balance = pendingData?.balance || 0;
  // Ensure events is always an array
  const events = Array.isArray(pendingData?.data) ? pendingData.data : [];

  // Filter events by search term
  const filteredEvents = events.filter((event) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      event.title.toLowerCase().includes(searchLower) ||
      event.createdBy.fullName?.toLowerCase().includes(searchLower) ||
      event.fundRequests?.[0]?.title?.toLowerCase().includes(searchLower)
    );
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Yêu cầu chi quỹ</h1>
          <p className="text-muted-foreground mt-2">
            Duyệt hoặc từ chối các yêu cầu chi quỹ từ sự kiện
          </p>
        </div>
      </div>

      {/* Balance Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Số dư hiện tại</p>
              <p className="text-3xl font-bold text-primary mt-1">
                {formatVND(balance)}
              </p>
            </div>
            <DollarSign className="h-12 w-12 text-primary opacity-50" />
          </div>
        </CardContent>
      </Card>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Tìm kiếm theo tên sự kiện, người tạo, hoặc tiêu đề yêu cầu..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Events List */}
      {filteredEvents.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium text-muted-foreground">
              {searchTerm ? "Không tìm thấy yêu cầu nào" : "Không có yêu cầu chi nào đang chờ duyệt"}
            </p>
            {!searchTerm && (
              <p className="text-sm text-muted-foreground mt-2">
                Tất cả các yêu cầu đã được xử lý
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredEvents.map((event) => {
            const fundRequest = event.fundRequests?.[0];
            const requestAmount = fundRequest?.totalAmount || 0;
            const balanceAfter = balance - requestAmount;
            const canApprove = balance >= requestAmount;

            return (
              <Card 
                key={event.id} 
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate(`/treasurer/${clubId}/fund-requests/${event.id}`)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-4">
                      {/* Event Info */}
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-xl font-semibold">{event.title}</h3>
                          <Badge variant="secondary">Chờ duyệt</Badge>
                        </div>
                        {event.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {event.description}
                          </p>
                        )}
                      </div>

                      {/* Fund Request Info */}
                      {fundRequest && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{fundRequest.title}</span>
                          </div>
                          {fundRequest.description && (
                            <p className="text-sm text-muted-foreground ml-6">
                              {fundRequest.description}
                            </p>
                          )}
                          <div className="ml-6 space-y-1">
                            {fundRequest.items?.slice(0, 3).map((item, idx) => (
                              <div key={idx} className="text-sm">
                                <span className="text-muted-foreground">• {item.name}: </span>
                                <span className="font-medium">{formatVND(item.amount)}</span>
                              </div>
                            ))}
                            {fundRequest.items && fundRequest.items.length > 3 && (
                              <p className="text-sm text-muted-foreground">
                                +{fundRequest.items.length - 3} hạng mục khác
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Metadata */}
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {format(new Date(event.startTime), "dd/MM/yyyy HH:mm", { locale: vi })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <span>{event.createdBy.fullName || event.createdBy.email}</span>
                        </div>
                      </div>
                    </div>

                    {/* Amount and Actions */}
                    <div className="flex flex-col items-end gap-4 min-w-[200px]">
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Số tiền yêu cầu</p>
                        <p className="text-2xl font-bold text-primary mt-1">
                          {formatVND(requestAmount)}
                        </p>
                        {!canApprove && (
                          <p className="text-xs text-red-600 mt-1">
                            Thiếu {formatVND(requestAmount - balance)}
                          </p>
                        )}
                        {canApprove && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Số dư sau: {formatVND(balanceAfter)}
                          </p>
                        )}
                      </div>
                      <Button 
                        variant="outline"
                        onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                          e.stopPropagation();
                          navigate(`/treasurer/${clubId}/fund-requests/${event.id}`);
                        }}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Xem chi tiết
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

