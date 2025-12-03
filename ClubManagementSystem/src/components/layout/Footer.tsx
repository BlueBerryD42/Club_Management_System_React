import { Link } from "react-router-dom";
import { Users, Mail, Phone, MapPin, Facebook, Instagram, Youtube } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-sidebar text-sidebar-foreground">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2 font-bold text-xl">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-primary">
                <Users className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-sidebar-foreground">ClubHub</span>
            </Link>
            <p className="text-sidebar-foreground/70 text-sm leading-relaxed">
              Hệ thống quản lý câu lạc bộ sinh viên hiện đại, giúp kết nối và phát triển cộng đồng sinh viên năng động.
            </p>
            <div className="flex gap-3">
              <a href="#" className="p-2 rounded-lg bg-sidebar-accent hover:bg-sidebar-primary transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="p-2 rounded-lg bg-sidebar-accent hover:bg-sidebar-primary transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="p-2 rounded-lg bg-sidebar-accent hover:bg-sidebar-primary transition-colors">
                <Youtube className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="font-semibold text-lg">Liên kết nhanh</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/clubs" className="text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors">Danh sách CLB</Link></li>
              <li><Link to="/events" className="text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors">Sự kiện sắp tới</Link></li>
              <li><Link to="/about" className="text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors">Giới thiệu</Link></li>
              <li><Link to="/faq" className="text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors">Câu hỏi thường gặp</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <h4 className="font-semibold text-lg">Hỗ trợ</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/help" className="text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors">Trung tâm trợ giúp</Link></li>
              <li><Link to="/contact" className="text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors">Liên hệ</Link></li>
              <li><Link to="/privacy" className="text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors">Chính sách bảo mật</Link></li>
              <li><Link to="/terms" className="text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors">Điều khoản sử dụng</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h4 className="font-semibold text-lg">Liên hệ</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-3 text-sidebar-foreground/70">
                <MapPin className="h-5 w-5 shrink-0 mt-0.5" />
                <span>123 Đường ABC, Quận XYZ, TP. Hồ Chí Minh</span>
              </li>
              <li className="flex items-center gap-3 text-sidebar-foreground/70">
                <Phone className="h-5 w-5 shrink-0" />
                <span>(028) 1234 5678</span>
              </li>
              <li className="flex items-center gap-3 text-sidebar-foreground/70">
                <Mail className="h-5 w-5 shrink-0" />
                <span>support@clubhub.edu.vn</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-sidebar-border mt-8 pt-8 text-center text-sm text-sidebar-foreground/50">
          <p>© 2024 ClubHub. Bản quyền thuộc về Đoàn Thanh niên - Hội Sinh viên.</p>
        </div>
      </div>
    </footer>
  );
}
