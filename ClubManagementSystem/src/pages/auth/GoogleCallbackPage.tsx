import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { authApi } from "@/services/auth.service";
import { useAppDispatch } from "@/store/hooks";
import { setCredentials } from "@/store/slices/authSlice";
import supabase from "@/lib/supabaseClient";

const GoogleCallbackPage = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const [status, setStatus] = useState("Đang xác thực với Google...");
  const [, setCountdown] = useState<number | null>(null);

  useEffect(() => {
    const exchangeAndLogin = async () => {
      if (!supabase) {
        setStatus("Thiếu cấu hình Supabase. Vui lòng kiểm tra env.");
        toast({
          variant: "destructive",
          title: "Thiếu Supabase",
          description: "VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY chưa được cấu hình.",
        });
        return;
      }

      // 1) Lấy mã từ URL
      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");

      // 1a) Nếu có code (PKCE) -> exchange
      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) {
          setStatus("Không thể xác thực Google");
          toast({
            variant: "destructive",
            title: "Lỗi Google",
            description: exchangeError.message,
          });
          return;
        }
      } else {
        // 1b) Nếu không có code, thử lấy access_token/refresh_token từ fragment (#)
        const hashParams = new URLSearchParams(url.hash.replace(/^#/, ''));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');

        if (accessToken && refreshToken) {
          const { error: setError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (setError) {
            setStatus("Không thể xác thực Google");
            toast({
              variant: "destructive",
              title: "Lỗi Google",
              description: setError.message,
            });
            return;
          }
        } else {
          setStatus("Không nhận được mã code/token từ Google. Vui lòng đăng nhập lại.");
          toast({
            variant: "destructive",
            title: "Thiếu mã xác thực",
            description: "Không nhận được code hoặc access token từ Google.",
          });
          return;
        }
      }

      // 2) Lấy email và thông tin từ session Supabase
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;
      const email = user?.email;
      const metadata = user?.user_metadata || {};
      const fullName = metadata.full_name || metadata.name || "";
      const avatarUrl = metadata.avatar_url || metadata.picture || "";

      if (!email) {
        setStatus("Không lấy được email từ Google");
        toast({
          variant: "destructive",
          title: "Lỗi Google",
          description: "Không lấy được email từ Google",
        });
        return;
      }

      try {
        // 3) Gọi BE để lấy JWT (Auto-register nếu chưa có)
        const response = await authApi.loginWithGoogle({
          email,
          fullName,
          avatarUrl
        });
        if (response.data.success) {
          const roleRaw = (response.data.user.role || '').toString().toUpperCase();
          const normalizedRole: 'ADMIN' | 'USER' = roleRaw === 'ADMIN' ? 'ADMIN' : 'USER';

          dispatch(setCredentials({
            token: response.data.accessToken,
            user: { ...response.data.user, role: normalizedRole },
          }));

          toast({
            title: "Đăng nhập Google thành công",
            description: `Chào mừng ${response.data.user.fullName || ''}`,
          });

          navigate(normalizedRole === 'ADMIN' ? '/admin/dashboard' : '/member/dashboard', { replace: true });
        } else {
          setStatus("Không đăng nhập được. Vui lòng thử lại.");
        }
      } catch (err) {
        const axiosErr = err as { response?: { status?: number; data?: { message?: string } } };
        const message = axiosErr.response?.data?.message;

        setStatus(message || "Không đăng nhập được. Vui lòng thử lại.");
        toast({
          variant: "destructive",
          title: "Đăng nhập thất bại",
          description: message || "Có lỗi xảy ra khi đăng nhập Google",
        });
        // Optional: countdown then navigate home for other error types
        const seconds = 5;
        setCountdown(seconds);
        setStatus(`${message || "Có lỗi xảy ra khi đăng nhập Google"}. Tự động quay về trang chủ sau ${seconds}s...`);
        let remaining = seconds;
        const interval = setInterval(() => {
          remaining -= 1;
          setCountdown(remaining);
          setStatus(`${message || "Có lỗi xảy ra khi đăng nhập Google"}. Tự động quay về trang chủ sau ${remaining}s...`);
          if (remaining <= 0) {
            clearInterval(interval);
            navigate('/', { replace: true });
          }
        }, 1000);
      }
    };

    void exchangeAndLogin();
  }, [dispatch, navigate, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle>Đăng nhập Google</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>{status}</span>
        </CardContent>
      </Card>
    </div>
  );
};

export default GoogleCallbackPage;
