import {
  Users,
  Calendar,
  Wallet,
  FileCheck,
  Bell,
  BarChart3,
  Shield,
  Zap
} from "lucide-react";

const features = [
  {
    icon: Users,
    title: "Quản lý Thành viên",
    description: "Duyệt đơn gia nhập, phân quyền vai trò, theo dõi trạng thái hoạt động của từng thành viên.",
    color: "bg-primary",
  },
  {
    icon: Calendar,
    title: "Sự kiện & Hoạt động",
    description: "Tạo và quản lý sự kiện, đăng ký tham gia, check-in bằng QR code, theo dõi điểm danh.",
    color: "gradient-accent",
  },
  {
    icon: Wallet,
    title: "Quản lý Tài chính",
    description: "Thiết lập các loại phí, theo dõi thu chi, xuất báo cáo tài chính CLB.",
    color: "bg-success",
  },
  {
    icon: FileCheck,
    title: "Quy trình Phê duyệt",
    description: "Phê duyệt đơn gia nhập, kế hoạch tuyển thành viên, đề xuất sự kiện một cách minh bạch.",
    color: "bg-warning",
  },
  {
    icon: Bell,
    title: "Thông báo Thông minh",
    description: "Nhận thông báo về sự kiện mới, nhắc đóng phí, cập nhật trạng thái đơn qua email và app.",
    color: "gradient-primary",
  },
  {
    icon: BarChart3,
    title: "Báo cáo & Thống kê",
    description: "Xem báo cáo chi tiết về số lượng thành viên, tỷ lệ tham gia, hiệu quả hoạt động CLB.",
    color: "bg-destructive",
  },
  {
    icon: Shield,
    title: "Phân quyền An toàn",
    description: "Hệ thống phân quyền rõ ràng: Admin, Club Leader, Thủ quỹ, Thành viên với các quyền hạn riêng biệt.",
    color: "bg-secondary",
    iconClass: "text-secondary-foreground",
  },
  {
    icon: Zap,
    title: "Hiệu suất Cao",
    description: "Giao diện thân thiện, tốc độ xử lý nhanh, hoạt động mượt mà trên mọi thiết bị.",
    color: "gradient-hero",
  },
];

export function FeaturesSection() {
  return (
    <section className="py-20 bg-muted/50">
      <div className="container">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Tính năng <span className="text-gradient">nổi bật</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            ClubHub cung cấp đầy đủ công cụ để quản lý và phát triển câu lạc bộ sinh viên một cách hiệu quả.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="group p-6 rounded-2xl bg-card border border-border/50 shadow-sm hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 hover:-translate-y-2 hover:border-primary/30"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className={`h-12 w-12 rounded-xl ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 group-hover:shadow-lg`}>
                  <Icon className={`h-6 w-6 ${feature.iconClass || "text-primary-foreground"}`} />
                </div>
                <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
