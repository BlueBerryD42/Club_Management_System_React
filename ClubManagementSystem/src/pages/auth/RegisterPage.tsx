import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Mail, Lock, Eye, EyeOff, ArrowRight, User, Hash, Loader2, Phone, GraduationCap } from "lucide-react";
import { useAppSelector } from "@/store/hooks";
import { useToast } from "@/hooks/use-toast";
import { authApi } from "@/services/auth.service";
import { z } from "zod";


const registerSchema = z.object({
  fullName: z.string().min(2, "Họ tên phải có ít nhất 2 ký tự"),
  studentCode: z.string().min(5, "MSSV không hợp lệ"),
  email: z.string().email("Email không hợp lệ"),
  phone: z.string().optional(),
  password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
  confirmPassword: z.string(),
  agreeTerms: z.boolean().refine(val => val === true, "Bạn phải đồng ý với điều khoản"),
}).refine(data => data.password === data.confirmPassword, {
  message: "Mật khẩu xác nhận không khớp",
  path: ["confirmPassword"],
});

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    studentCode: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    agreeTerms: false,
  });
  const navigate = useNavigate();
  const user = useAppSelector((s) => s.auth.user);
  const { toast } = useToast();

  // Redirect if already logged in
  if (user) {
    navigate("/dashboard");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = registerSchema.safeParse(formData);
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
      const registerPayload = {
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName,
        studentCode: formData.studentCode,
        phone: formData.phone || undefined,
      };

      const response = await authApi.register(registerPayload);

      if (response.data.success) {
        toast({
          title: "Đăng ký thành công",
          description: "Vui lòng đăng nhập để tiếp tục.",
        });
        navigate("/login");
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Đăng ký thất bại",
        description: error.response?.data?.message || "Đã có lỗi xảy ra, vui lòng thử lại.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Hero */}
      <div className="hidden lg:flex flex-1 gradient-hero items-center justify-center p-12">
        <div className="max-w-lg text-primary-foreground">
          <h2 className="text-3xl font-bold mb-6">
            Bắt đầu hành trình của bạn
          </h2>
          <p className="text-lg opacity-90 mb-8">
            Đăng ký tài khoản miễn phí để khám phá và tham gia các câu lạc bộ sinh viên năng động.
          </p>
          
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-primary-foreground/10">
              <div className="h-12 w-12 rounded-lg bg-primary-foreground/20 flex items-center justify-center">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <div className="font-semibold">Tham gia CLB</div>
                <div className="text-sm opacity-80">Kết nối với bạn bè cùng sở thích</div>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-xl bg-primary-foreground/10">
              <div className="h-12 w-12 rounded-lg bg-primary-foreground/20 flex items-center justify-center">
                <GraduationCap className="h-6 w-6" />
              </div>
              <div>
                <div className="font-semibold">Phát triển bản thân</div>
                <div className="text-sm opacity-80">Học hỏi kỹ năng mới từ các hoạt động</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
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
            <CardHeader className="space-y-1 pb-4">
              {/* <CardTitle className="text-2xl font-bold">Đăng ký tài khoản</CardTitle>
              <CardDescription>
                Tạo tài khoản mới để bắt đầu khám phá
              </CardDescription> */}
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Họ và tên</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="fullName"
                        placeholder="Nguyễn Văn A"
                        value={formData.fullName}
                        onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                        className="pl-10 h-11"
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="studentCode">MSSV</Label>
                    <div className="relative">
                      <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="studentCode"
                        placeholder="2021001234"
                        value={formData.studentCode}
                        onChange={(e) => setFormData({...formData, studentCode: e.target.value})}
                        className="pl-10 h-11"
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email sinh viên</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="your.email@university.edu.vn"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="pl-10 h-11"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Số điện thoại (tùy chọn)</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="0123456789"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="pl-10 h-11"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Mật khẩu</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      className="pl-10 pr-10 h-11"
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

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                      className="pl-10 h-11"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="flex items-start space-x-2">
                  <Checkbox 
                    id="terms" 
                    checked={formData.agreeTerms}
                    onCheckedChange={(checked) => setFormData({...formData, agreeTerms: checked as boolean})}
                    disabled={isLoading}
                  />
                  <label htmlFor="terms" className="text-sm text-muted-foreground cursor-pointer leading-tight">
                    Tôi đồng ý với{" "}
                    <Link to="/terms" className="text-primary hover:underline">Điều khoản sử dụng</Link>
                    {" "}và{" "}
                    <Link to="/privacy" className="text-primary hover:underline">Chính sách bảo mật</Link>
                  </label>
                </div>

                <Button type="submit" variant="hero" className="w-full h-12" size="lg" disabled={isLoading}>
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      Đăng ký
                      <ArrowRight className="h-5 w-5 ml-1" />
                    </>
                  )}
                </Button>

                <p className="text-center text-sm text-muted-foreground mt-4">
                  Đã có tài khoản?{" "}
                  <Link to="/login" className="text-primary font-medium hover:underline">
                    Đăng nhập
                  </Link>
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Register;
