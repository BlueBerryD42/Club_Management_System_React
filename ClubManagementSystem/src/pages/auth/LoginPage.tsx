import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Mail, Lock, Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setCredentials } from "@/store/slices/authSlice";
import { useToast } from "@/hooks/use-toast";
import { authApi } from "@/services/auth.service";
import supabase from "@/lib/supabaseClient";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
});

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const { toast } = useToast();

  // Redirect if already logged in
  useEffect(() => {
    if (!user) return;
    if (user.role === 'ADMIN') {
      navigate('/admin/dashboard', { replace: true });
    } else {
      navigate('/member/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = loginSchema.safeParse({ email, password });
    if (!validation.success) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: validation.error.issues[0].message,
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await authApi.login({ email, password });
      
      console.log('Login response:', response);
      console.log('Response data:', response.data);
      
      if (response.data.success) {
        const roleRaw = (response.data.user.role || '').toString().toUpperCase();
        const normalizedRole: 'ADMIN' | 'USER' = roleRaw === 'ADMIN' ? 'ADMIN' : 'USER';

        dispatch(setCredentials({
          token: response.data.accessToken,
          user: { ...response.data.user, role: normalizedRole },
        }));

        toast({
          title: "Đăng nhập thành công",
          description: "Chào mừng bạn trở lại!",
        });

        // Navigate based on system role
        if (normalizedRole === 'ADMIN') {
          navigate('/admin/dashboard', { replace: true });
        } else {
          navigate('/member/dashboard', { replace: true });
        }
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast({
        variant: "destructive",
        title: "Đăng nhập thất bại",
        description: err.response?.data?.message || "Email hoặc mật khẩu không đúng",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (!supabase) {
      toast({
        variant: "destructive",
        title: "Thiếu cấu hình Supabase",
        description: "Vui lòng cấu hình VITE_SUPABASE_URL và VITE_SUPABASE_ANON_KEY.",
      });
      return;
    }

    setIsGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (error) {
        toast({
          variant: "destructive",
          title: "Không thể đăng nhập Google",
          description: error.message,
        });
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Không thể đăng nhập Google",
        description: (err as Error).message,
      });
    } finally {
        setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 font-bold text-xl mb-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary">
              <Users className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-gradient">ClubHub</span>
          </Link>

          <Card className="border-0 shadow-xl">
            <CardHeader className="space-y-1 pb-6">
              <CardTitle className="text-2xl font-bold">Đăng nhập</CardTitle>
              <CardDescription>
                Chào mừng trở lại! Đăng nhập để tiếp tục.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="your.email@university.edu.vn"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-12"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="password">Mật khẩu</Label>
                    <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                      Quên mật khẩu?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10 h-12"
                      required
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox id="remember" />
                  <label htmlFor="remember" className="text-sm text-muted-foreground cursor-pointer">
                    Ghi nhớ đăng nhập
                  </label>
                </div>

                <Button type="submit" variant="hero" className="w-full h-12" size="lg" disabled={isLoading}>
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      Đăng nhập
                      <ArrowRight className="h-5 w-5 ml-1" />
                    </>
                  )}
                </Button>

                {/* <p className="text-center text-sm text-muted-foreground mt-6">
                  Chưa có tài khoản?{" "}
                  <Link to="/register" className="text-primary font-medium hover:underline">
                    Đăng ký ngay
                  </Link>
                </p> */}
              </form>

              <div className="mt-6">
                <div className="relative mb-4">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase text-muted-foreground">
                    <span className="bg-card px-2">Hoặc</span>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-12"
                  onClick={handleGoogleLogin}
                  disabled={isLoading || isGoogleLoading}
                >
                  {isGoogleLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <span className="flex items-center gap-2">
                      <svg
                        className="h-5 w-5"
                        viewBox="0 0 533.5 544.3"
                        aria-hidden
                        focusable="false"
                      >
                        <path fill="#EA4335" d="M533.5 278.4c0-17.4-1.6-34.1-4.6-50.4H272v95.4h147.5c-6.4 34.6-25.7 63.9-54.9 83.5v68h88.7c52 47.9 80.2 117.1 80.2 203.9z" transform="translate(0 -69.2)" />
                        <path fill="#34A853" d="M106.7 324.1c-2-11-3.2-22.4-3.2-34.1 0-11.7 1.2-23.1 3.2-34.1v-68H18.1C6.4 205.5 0 227 0 250c0 23 6.4 44.5 18.1 62.9z" transform="translate(0 -69.2)" />
                        <path fill="#4285F4" d="M272 107.9c29.4 0 56.2 10.1 77.2 29.8l58-58C368.4 40.8 322.4 21.8 272 21.8c-104.9 0-195.1 60.3-238.9 148.2l88.7 68c19.2-58.2 74-100.1 138.2-100.1z" transform="translate(0 -69.2)" />
                        <path fill="#FBBC05" d="M272 507.7c50.4 0 96.4-19 130.1-50l-88.7-68c-24.7 16.6-56.3 26.4-88.7 26.4-64.2 0-119-41.9-138.2-100.1l-88.7 68C76.9 447.4 167.1 507.7 272 507.7z" transform="translate(0 -69.2)" />
                      </svg>
                      Đăng nhập với Google
                    </span>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Right Side - Hero */}
      <div className="hidden lg:flex flex-1 gradient-hero items-center justify-center p-12">
        <div className="max-w-lg text-primary-foreground text-center">
          <h2 className="text-3xl font-bold mb-6">
            Kết nối với cộng đồng sinh viên
          </h2>
          <p className="text-lg opacity-90 mb-8">
            Tham gia hàng chục câu lạc bộ đa dạng, khám phá đam mê và phát triển kỹ năng cùng bạn bè.
          </p>
          <div className="flex justify-center gap-8">
            <div>
              <div className="text-4xl font-bold">50+</div>
              <div className="text-sm opacity-80">Câu lạc bộ</div>
            </div>
            <div>
              <div className="text-4xl font-bold">2000+</div>
              <div className="text-sm opacity-80">Thành viên</div>
            </div>
            <div>
              <div className="text-4xl font-bold">100+</div>
              <div className="text-sm opacity-80">Sự kiện/năm</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
