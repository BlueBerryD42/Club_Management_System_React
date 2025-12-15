import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, XCircle, AlertCircle, Loader2, Receipt } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { transactionService } from '@/services/transaction.service';
import { formatVND } from '@/lib/utils';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

const PaymentResultPage = () => {
    const [searchParams] = useSearchParams();
    const statusParam = searchParams.get('status');
    const orderCode = searchParams.get('orderCode');
    const transactionId = searchParams.get('transactionId');

    // Fetch transaction details if we have an ID
    const { data: transactionResponse, isLoading, isError } = useQuery({
        queryKey: ['transaction', transactionId],
        queryFn: () => transactionService.getTransactionById(transactionId!),
        enabled: !!transactionId,
        retry: 1
    });

    const transaction = transactionResponse?.data;
    const finalStatus = transaction?.status || statusParam;

    const [message, setMessage] = useState('');
    const [icon, setIcon] = useState<React.ReactNode>(null);
    const [title, setTitle] = useState('');

    useEffect(() => {
        // If loading, don't set static states yet
        if (isLoading && transactionId) return;

        switch (finalStatus) {
            case 'SUCCESS':
                setTitle('Thanh toán thành công');
                setMessage('Giao dịch của bạn đã được xử lý thành công.');
                setIcon(<CheckCircle2 className="h-16 w-16 text-green-500" />);
                break;
            case 'CANCELLED':
                setTitle('Thanh toán đã hủy');
                setMessage('Bạn đã hủy giao dịch.');
                setIcon(<XCircle className="h-16 w-16 text-red-500" />);
                break;
            case 'FAILED':
                setTitle('Thanh toán thất bại');
                setMessage('Có lỗi xảy ra trong quá trình thanh toán. Vui lòng thử lại.');
                setIcon(<AlertCircle className="h-16 w-16 text-red-500" />);
                break;
            case 'PENDING':
                setTitle('Đang xử lý');
                setMessage('Giao dịch đang chờ xác nhận từ hệ thống.');
                setIcon(<Loader2 className="h-16 w-16 text-blue-500 animate-spin" />);
                break;
            default:
                if (isError) {
                    setTitle('Không tìm thấy giao dịch');
                    setMessage('Không thể tải thông tin giao dịch.');
                    setIcon(<AlertCircle className="h-16 w-16 text-gray-500" />);
                } else if (!transactionId) {
                    setTitle('Trạng thái không xác định');
                    setMessage('Thiếu thông tin giao dịch.');
                    setIcon(<AlertCircle className="h-16 w-16 text-gray-500" />);
                }
        }
    }, [finalStatus, isLoading, isError, transactionId]);

    if (isLoading && transactionId) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                <Card className="w-full max-w-md text-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                    <p className="mt-4 text-muted-foreground">Đang xác thực giao dịch...</p>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">{icon}</div>
                    <CardTitle className="text-2xl">{title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-center text-muted-foreground">{message}</p>
                    
                    {/* Transaction Details Receipt */}
                    {transaction && (
                        <div className="bg-muted/30 p-4 rounded-lg border space-y-3 text-sm">
                            <div className="flex items-center gap-2 font-semibold text-primary pb-2 border-b">
                                <Receipt className="h-4 w-4" />
                                Chi tiết giao dịch
                            </div>
                            
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Mã đơn hàng:</span>
                                <span className="font-mono font-medium">{transaction.paymentReference}</span>
                            </div>
                            
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Số tiền:</span>
                                <span className="font-bold text-lg">{formatVND(transaction.amount)} đ</span>
                            </div>

                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Thời gian:</span>
                                <span>{transaction.createdAt ? format(new Date(transaction.createdAt), 'dd/MM/yyyy HH:mm', { locale: vi }) : '--'}</span>
                            </div>

                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Loại:</span>
                                <span>{transaction.type === 'MEMBERSHIP' ? 'Phí thành viên' : 'Vé sự kiện'}</span>
                            </div>

                            {transaction.club && (
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">CLB:</span>
                                    <span className="font-medium text-right truncate max-w-[200px]">{transaction.club.name}</span>
                                </div>
                            )}
                        </div>
                    )}

                    {!transaction && orderCode && (
                        <p className="text-center text-sm text-gray-500 mt-2">
                            Mã đơn hàng: <span className="font-mono font-medium text-foreground">{orderCode}</span>
                        </p>
                    )}
                </CardContent>
                <CardFooter className="flex flex-col gap-2">
                    {finalStatus === 'SUCCESS' && (
                        <Button asChild className="w-full">
                            <Link to="/member/my-events">Xem vé của tôi</Link>
                        </Button>
                    )}
                    <Button variant="outline" asChild className="w-full">
                        <Link to="/">Về trang chủ</Link>
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
};

export default PaymentResultPage;
