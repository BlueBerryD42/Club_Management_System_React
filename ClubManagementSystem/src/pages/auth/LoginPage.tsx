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

                <p className="text-center text-sm text-muted-foreground mt-6">
                  Chưa có tài khoản?{" "}
                  <Link to="/register" className="text-primary font-medium hover:underline">
                    Đăng ký ngay
                  </Link>
                </p>
              </form>
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
