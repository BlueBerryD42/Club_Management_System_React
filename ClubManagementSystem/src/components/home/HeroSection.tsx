import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Users, Calendar, Award, Sparkles } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden py-20 lg:py-32">
      {/* Background Decorations */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/40 rounded-full blur-3xl animate-float" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/10 rounded-full blur-3xl" />
      </div>

      <div className="container">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="space-y-8 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary text-secondary-foreground text-sm font-medium animate-slide-up">
              <Sparkles className="h-4 w-4" />
              Hệ thống quản lý CLB hiện đại
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight animate-slide-up stagger-1">
              Kết nối & Phát triển
              <span className="block text-gradient">Cộng đồng Sinh viên</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0 animate-slide-up stagger-2">
              ClubHub - Nền tảng quản lý câu lạc bộ thông minh, giúp sinh viên dễ dàng tìm kiếm, tham gia và phát triển cùng các CLB yêu thích.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start animate-slide-up stagger-3">
              <Button variant="hero" size="xl" asChild>
                <Link to="/clubs">
                  Khám phá CLB
                  <ArrowRight className="h-5 w-5 ml-1" />
                </Link>
              </Button>
              <Button variant="outline" size="xl" asChild>
                <Link to="/about">
                  Tìm hiểu thêm
                </Link>
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 pt-8 animate-slide-up stagger-4">
              <div className="text-center lg:text-left">
                <div className="text-3xl md:text-4xl font-bold text-primary">50+</div>
                <div className="text-sm text-muted-foreground">Câu lạc bộ</div>
              </div>
              <div className="text-center lg:text-left">
                <div className="text-3xl md:text-4xl font-bold text-primary">2000+</div>
                <div className="text-sm text-muted-foreground">Thành viên</div>
              </div>
              <div className="text-center lg:text-left">
                <div className="text-3xl md:text-4xl font-bold text-primary">100+</div>
                <div className="text-sm text-muted-foreground">Sự kiện/năm</div>
              </div>
            </div>
          </div>

          {/* Illustration */}
          <div className="relative hidden lg:block">
            <div className="relative z-10 grid grid-cols-2 gap-4">
              {/* Card 1 */}
              <div className="p-6 rounded-2xl bg-card shadow-xl border border-border/50 animate-slide-up stagger-2">
                <div className="h-12 w-12 rounded-xl gradient-primary flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="font-semibold mb-2">Quản lý Thành viên</h3>
                <p className="text-sm text-muted-foreground">Dễ dàng theo dõi và quản lý danh sách thành viên CLB</p>
              </div>

              {/* Card 2 */}
              <div className="p-6 rounded-2xl bg-card shadow-xl border border-border/50 mt-8 animate-slide-up stagger-3">
                <div className="h-12 w-12 rounded-xl gradient-accent flex items-center justify-center mb-4">
                  <Calendar className="h-6 w-6 text-accent-foreground" />
                </div>
                <h3 className="font-semibold mb-2">Sự kiện & Hoạt động</h3>
                <p className="text-sm text-muted-foreground">Tổ chức và tham gia các sự kiện một cách thuận tiện</p>
              </div>

              {/* Card 3 */}
              <div className="p-6 rounded-2xl bg-card shadow-xl border border-border/50 animate-slide-up stagger-4">
                <div className="h-12 w-12 rounded-xl bg-success flex items-center justify-center mb-4">
                  <Award className="h-6 w-6 text-success-foreground" />
                </div>
                <h3 className="font-semibold mb-2">Điểm rèn luyện</h3>
                <p className="text-sm text-muted-foreground">Tích lũy điểm hoạt động qua các sự kiện CLB</p>
              </div>

              {/* Card 4 - Notification preview */}
              <div className="p-4 rounded-2xl bg-card shadow-xl border border-border/50 mt-8 animate-slide-up stagger-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-full gradient-primary flex items-center justify-center">
                    <span className="text-sm font-bold text-primary-foreground">IT</span>
                  </div>
                  <div>
                    <div className="font-medium text-sm">CLB IT</div>
                    <div className="text-xs text-muted-foreground">Vừa mở đăng ký</div>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground bg-muted p-2 rounded-lg">
                  🎉 Đợt tuyển thành viên mới đã mở!
                </div>
              </div>
            </div>

            {/* Floating elements */}
            <div className="absolute -top-4 -right-4 p-3 rounded-xl bg-card shadow-lg border border-border/50 animate-float">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-success animate-pulse" />
                <span className="text-sm font-medium">128 đang hoạt động</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
