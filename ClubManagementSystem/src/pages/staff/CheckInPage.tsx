import { useState, useEffect } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle2, XCircle, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { staffService } from '@/services/staff.service';
import { eventService } from '@/services/event.service';
import { useAppSelector } from '@/store/hooks';

const CheckInPage = () => {
  const user = useAppSelector((s) => s.auth.user);
  const [scanning, setScanning] = useState(true);
  const [manualCode, setManualCode] = useState('');
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [staffEvents, setStaffEvents] = useState<any[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [participants, setParticipants] = useState<any[]>([]);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [processing, setProcessing] = useState(false);
  const [processingParticipantId, setProcessingParticipantId] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<{
    success: boolean;
    message: string;
    data?: any;
    isAlreadyCheckedIn?: boolean;
  } | null>(null);
  
  const { toast } = useToast();

  useEffect(() => {
    fetchStaffEvents();
  }, []);

  useEffect(() => {
    if (selectedEventId) {
      fetchParticipants();
    } else {
      setParticipants([]);
    }
  }, [selectedEventId]);

  const fetchStaffEvents = async () => {
    try {
      setLoadingEvents(true);
      // Include inactive events so staff can see all their assigned events, including ended ones
      const eventsResponse = await eventService.getAll({ includeInactive: 'true' });
      const allEvents = eventsResponse.data || [];
      
      // Filter events where current user is staff
      const filtered = allEvents.filter((event: any) => 
        event.staff?.some((staff: any) => staff.userId === user?.id)
      );
      
      setStaffEvents(filtered);
      if (filtered.length > 0) {
        setSelectedEventId(filtered[0].id);
      }
    } catch (error) {
      console.error('Error fetching staff events:', error);
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách sự kiện",
        variant: "destructive",
      });
    } finally {
      setLoadingEvents(false);
    }
  };

  const fetchParticipants = async () => {
    if (!selectedEventId) return;
    
    try {
      setLoadingParticipants(true);
      const response = await staffService.getEventParticipants(selectedEventId);
      setParticipants(response.data?.participants || []);
    } catch (error) {
      console.error('Error fetching participants:', error);
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách người tham gia",
        variant: "destructive",
      });
    } finally {
      setLoadingParticipants(false);
    }
  };

  const handleParticipantCheckIn = async (participantEmail: string) => {
    if (!selectedEventId) return;

    setProcessingParticipantId(participantEmail);
    
    try {
      const response = await staffService.checkInByEmail({
        eventId: selectedEventId,
        email: participantEmail,
      });
      
      if (response.success) {
        toast({
          title: "Thành công",
          description: `Đã check-in cho ${response.data?.user?.fullName || participantEmail}`,
          variant: "default",
        });
        
        // Refresh participants list
        await fetchParticipants();
      } else {
        toast({
          title: "Lỗi",
          description: response.message || "Không thể check-in.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error(error);
      const errorMessage = error.response?.data?.message || 'Lỗi hệ thống khi check-in.';
      toast({
        title: "Lỗi",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setProcessingParticipantId(null);
    }
  };

  const handleScan = async (result: string) => {
    if (processing) return;
    
    // Prevent rapid double scans
    setProcessing(true);
    setScanning(false);
    
    try {
      const response = await staffService.checkInByQR({ qrCode: result });
      
      if (response.success) {
        const isAlreadyCheckedIn = response.data?.isAlreadyCheckedIn || false;
        const user = response.data?.user;
        
        setLastResult({
          success: true,
          message: isAlreadyCheckedIn 
            ? 'Người dùng đã được check-in trước đó' 
            : 'Check-in thành công!',
          data: {
            user: user,
            ticketId: response.data?.ticketId,
            scannedAt: response.data?.scannedAt,
          },
          isAlreadyCheckedIn,
        });
        
        toast({
          title: isAlreadyCheckedIn ? "Đã check-in" : "Thành công",
          description: isAlreadyCheckedIn
            ? `Người dùng ${user?.fullName || user?.email || 'N/A'} đã được check-in trước đó`
            : `Đã check-in cho ${user?.fullName || user?.email || 'N/A'}`,
          variant: isAlreadyCheckedIn ? "default" : "default",
        });
      } else {
        setLastResult({
          success: false,
          message: response.message || 'Vé không hợp lệ hoặc đã được sử dụng.',
        });
        toast({
          title: "Lỗi",
          description: response.message || "Vé không hợp lệ hoặc đã được sử dụng.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error(error);
      const errorMessage = error.response?.data?.message || 'Lỗi hệ thống khi check-in.';
      setLastResult({
        success: false,
        message: errorMessage,
      });
      toast({
        title: "Lỗi",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleScan(manualCode);
  };

  const resetScanner = () => {
    setLastResult(null);
    setScanning(true);
    setManualCode('');
  };

  return (
    <div className="space-y-4 pb-20 md:pb-0">
      <h2 className="text-2xl font-bold tracking-tight">Check-in Sự kiện</h2>
      
      <Card className="overflow-hidden">
        <Tabs defaultValue="scan" className="w-full">
          <CardHeader className="pb-2">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="email">Check-in bằng email</TabsTrigger>
              <TabsTrigger value="scan">Quét QR</TabsTrigger>
              <TabsTrigger value="manual">Nhập mã QR</TabsTrigger>

            </TabsList>
          </CardHeader>
          
          <CardContent className="p-4">
            <TabsContent value="scan" className="mt-0 space-y-4">
              {!lastResult ? (
                <div className="relative aspect-square w-full max-w-sm mx-auto bg-black rounded-lg overflow-hidden">
                  {scanning && (
                    <Scanner
                      onScan={(result) => {
                        if (result && result[0] && result[0].rawValue) {
                            handleScan(result[0].rawValue);
                        }
                      }}
                      components={{
                        onOff: true,
                        torch: true,
                      }}
                    />
                  )}
                  {processing && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
                      <Loader2 className="h-10 w-10 animate-spin text-white" />
                    </div>
                  )}
                  <div className="absolute bottom-4 left-0 right-0 text-center text-white text-sm bg-black/50 py-1">
                    Di chuyển camera vào mã QR vé
                  </div>
                </div>
              ) : (
                <ResultCard result={lastResult} onReset={resetScanner} />
              )}
            </TabsContent>
            
            <TabsContent value="manual" className="mt-0 space-y-4">
              {!lastResult ? (
                <form onSubmit={handleManualSubmit} className="space-y-4 py-8">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Nhập mã QR vé</label>
                    <Input
                      placeholder="Nhập mã QR vé"
                      value={manualCode}
                      onChange={(e) => setManualCode(e.target.value)}
                      className="text-center text-lg h-12"
                    />
                  </div>
                  <Button type="submit" className="w-full h-12 text-lg" disabled={processing || !manualCode}>
                    {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Xác nhận Check-in'}
                  </Button>
                </form>
              ) : (
                <ResultCard result={lastResult} onReset={resetScanner} />
              )}
            </TabsContent>
            
            <TabsContent value="email" className="mt-0 space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Chọn sự kiện</label>
                  {loadingEvents ? (
                    <div className="h-12 flex items-center justify-center">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  ) : staffEvents.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Bạn chưa được phân công sự kiện nào</p>
                  ) : (
                    <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Chọn sự kiện" />
                      </SelectTrigger>
                      <SelectContent>
                        {staffEvents.map((event) => (
                          <SelectItem key={event.id} value={event.id}>
                            {event.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {selectedEventId && (
                  <div className="space-y-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Tìm kiếm theo tên, email hoặc mã sinh viên..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>

                    {loadingParticipants ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin" />
                      </div>
                    ) : participants.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <p>Chưa có người tham gia</p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-[500px] overflow-y-auto">
                        {participants
                          .filter((p) => {
                            if (!searchQuery.trim()) return true;
                            const query = searchQuery.toLowerCase();
                            const fullName = p.user?.fullName?.toLowerCase() || '';
                            const email = p.user?.email?.toLowerCase() || '';
                            const studentCode = p.user?.studentCode?.toLowerCase() || '';
                            return fullName.includes(query) || email.includes(query) || studentCode.includes(query);
                          })
                          .map((participant) => (
                            <Card key={participant.id} className="p-4">
                              <div className="flex items-center justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium truncate">
                                    {participant.user?.fullName || 'N/A'}
                                  </div>
                                  <div className="text-sm text-muted-foreground truncate">
                                    {participant.user?.email || 'N/A'}
                                  </div>
                                  {participant.user?.studentCode && (
                                    <div className="text-xs text-muted-foreground">
                                      Mã SV: {participant.user.studentCode}
                                    </div>
                                  )}
                                  {participant.checkedInAt && (
                                    <div className="text-xs text-muted-foreground mt-1">
                                      Đã check-in: {new Date(participant.checkedInAt).toLocaleString('vi-VN')}
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  {participant.isCheckedIn ? (
                                    <Badge className="bg-success/20 text-success border-success/30">
                                      <CheckCircle2 className="h-3 w-3 mr-1" />
                                      Đã check-in
                                    </Badge>
                                  ) : (
                                    <Button
                                      size="sm"
                                      onClick={() => handleParticipantCheckIn(participant.user?.email)}
                                      disabled={processingParticipantId === participant.user?.email}
                                    >
                                      {processingParticipantId === participant.user?.email ? (
                                        <>
                                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                          Đang xử lý...
                                        </>
                                      ) : (
                                        'Check-in'
                                      )}
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </Card>
                          ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>
    </div>
  );
};

const ResultCard = ({ 
  result, 
  onReset 
}: { 
  result: { success: boolean; message: string; data?: any; isAlreadyCheckedIn?: boolean }; 
  onReset: () => void;
}) => {
  const user = result.data?.user;
  
  return (
    <div className="flex flex-col items-center justify-center py-8 space-y-4 animate-in fade-in zoom-in duration-300">
      <div className={cn(
        "rounded-full p-4",
        result.success ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
      )}>
        {result.success ? (
          <CheckCircle2 className="h-16 w-16" />
        ) : (
          <XCircle className="h-16 w-16" />
        )}
      </div>
      
      <div className="text-center space-y-2">
        <h3 className="text-xl font-bold">
          {result.success 
            ? (result.isAlreadyCheckedIn ? "Đã Check-in" : "Check-in Thành Công")
            : "Check-in Thất Bại"}
        </h3>
        <p className="text-muted-foreground">{result.message}</p>
        {user && (
          <div className="mt-2 p-3 bg-muted rounded-md text-sm space-y-1">
            <div><strong>Họ tên:</strong> {user.fullName || "N/A"}</div>
            <div><strong>Email:</strong> {user.email || "N/A"}</div>
            {user.studentCode && (
              <div><strong>Mã SV:</strong> {user.studentCode}</div>
            )}
            {(result.data?.scannedAt || result.data?.checkedInAt) && (
              <div className="text-xs text-muted-foreground mt-2">
                Thời gian: {new Date(result.data.scannedAt || result.data.checkedInAt).toLocaleString('vi-VN')}
              </div>
            )}
          </div>
        )}
      </div>
      
      <Button onClick={onReset} className="w-full max-w-xs mt-4" size="lg">
        Quét tiếp theo
      </Button>
    </div>
  );
};

export default CheckInPage;
