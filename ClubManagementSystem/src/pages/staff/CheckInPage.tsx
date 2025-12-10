import { useState } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const CheckInPage = () => {
  const [scanning, setScanning] = useState(true);
  const [manualCode, setManualCode] = useState('');
  const [processing, setProcessing] = useState(false);
  const [lastResult, setLastResult] = useState<{
    success: boolean;
    message: string;
    data?: any;
  } | null>(null);
  
  const { toast } = useToast();

  const handleScan = async (result: string) => {
    if (processing) return;
    
    // Prevent rapid double scans
    setProcessing(true);
    setScanning(false);
    
    try {
      // TODO: Replace with actual API call
      console.log('Scanned:', result);
      
      // Mock API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock success logic
      const success = Math.random() > 0.2; // 80% success chance for demo
      
      if (success) {
        setLastResult({
          success: true,
          message: 'Check-in thành công!',
          data: { studentName: 'Nguyễn Văn A', studentId: result }
        });
        toast({
          title: "Thành công",
          description: `Đã check-in cho sinh viên ${result}`,
          variant: "default",
        });
      } else {
        setLastResult({
          success: false,
          message: 'Vé không hợp lệ hoặc đã được sử dụng.',
        });
        toast({
          title: "Lỗi",
          description: "Vé không hợp lệ hoặc đã được sử dụng.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error(error);
      setLastResult({
        success: false,
        message: 'Lỗi hệ thống khi check-in.',
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
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
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="scan">Quét QR</TabsTrigger>
              <TabsTrigger value="manual">Nhập thủ công</TabsTrigger>
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
                    <Input
                      placeholder="Nhập mã vé / MSSV"
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
  result: { success: boolean; message: string; data?: any }; 
  onReset: () => void;
}) => {
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
          {result.success ? "Check-in Thành Công" : "Check-in Thất Bại"}
        </h3>
        <p className="text-muted-foreground">{result.message}</p>
        {result.data && (
          <div className="mt-2 p-3 bg-muted rounded-md text-sm font-mono">
            ID: {result.data.studentId}
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
