import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { clubApi } from "@/services/club.service";
import { useAppSelector } from "@/store/hooks";
import { Clock, Building2, Calendar, FileText } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

interface Application {
    id: string;
    clubId: string;
    club: {
        name: string;
        logoUrl?: string;
    };
    userId: string; // Added userId to the interface
    status: string;
    introduction?: string;
    createdAt: string;
}

export default function PendingApplications() {
    const user = useAppSelector((s) => s.auth.user);

    const { data: applicationsResponse, isLoading } = useQuery({
        queryKey: ['my-applications', 'PENDING'],
        queryFn: async () => {
            const response = await clubApi.getMyApplications({ status: 'PENDING' });
            return response.data;
        },
        enabled: !!user,
    });

    // Filter to show only applications submitted BY the current user (not TO their clubs)
    const allApplications: Application[] = applicationsResponse?.data || applicationsResponse?.applications || [];
    const applications = allApplications.filter(app => app.userId === user?.id);

    if (isLoading) {
        return (
            <Layout>
                <div className="container py-8">
                    <Skeleton className="h-10 w-64 mb-6" />
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <Skeleton key={i} className="h-32" />
                        ))}
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="container py-8">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold mb-2">Đơn chờ duyệt</h1>
                    <p className="text-muted-foreground">
                        Danh sách đơn xin gia nhập câu lạc bộ đang chờ phê duyệt
                    </p>
                </div>

                {applications.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold mb-2">Chưa có đơn chờ duyệt</h3>
                            <p className="text-muted-foreground text-center">
                                Bạn chưa có đơn xin gia nhập CLB nào đang chờ phê duyệt
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {applications.map((app) => (
                            <Card key={app.id}>
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                                                <Building2 className="h-6 w-6 text-primary" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-lg">{app.club.name}</CardTitle>
                                                <CardDescription className="flex items-center gap-2 mt-1">
                                                    <Calendar className="h-3 w-3" />
                                                    Gửi {formatDistanceToNow(new Date(app.createdAt), { addSuffix: true, locale: vi })}
                                                </CardDescription>
                                            </div>
                                        </div>
                                        <Badge className="bg-warning/20 text-warning border-warning/30">
                                            <Clock className="h-3 w-3 mr-1" />
                                            Chờ duyệt
                                        </Badge>
                                    </div>
                                </CardHeader>
                                {app.introduction && (
                                    <CardContent>
                                        <div className="flex items-start gap-2 text-sm">
                                            <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                                            <div>
                                                <p className="font-medium text-muted-foreground mb-1">Lời nhắn:</p>
                                                <p className="text-foreground">{app.introduction}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                )}
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </Layout>
    );
}
