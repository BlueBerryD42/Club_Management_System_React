import { Layout } from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Target, Heart, Award, CheckCircle } from "lucide-react";

const About = () => {
  return (
    <Layout>
      <div className="py-12">
        <div className="container">
          {/* Hero */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
              Về <span className="text-gradient">ClubHub</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              ClubHub là hệ thống quản lý câu lạc bộ sinh viên hiện đại, được phát triển bởi Đoàn Thanh niên - Hội Sinh viên nhằm số hóa và nâng cao hiệu quả hoạt động của các CLB trong trường.
            </p>
          </div>

          {/* Mission & Vision */}
          <div className="grid md:grid-cols-2 gap-8 mb-16">
            <Card className="overflow-hidden">
              <div className="h-2 gradient-primary" />
              <CardContent className="pt-8">
                <div className="h-14 w-14 rounded-2xl gradient-primary flex items-center justify-center mb-6">
                  <Target className="h-7 w-7 text-primary-foreground" />
                </div>
                <h3 className="text-2xl font-bold mb-4">Sứ mệnh</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Xây dựng một nền tảng số toàn diện, giúp sinh viên dễ dàng tiếp cận, tham gia và phát triển thông qua các hoạt động câu lạc bộ. Đồng thời hỗ trợ nhà trường quản lý, giám sát hoạt động CLB một cách minh bạch và hiệu quả.
                </p>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <div className="h-2 gradient-accent" />
              <CardContent className="pt-8">
                <div className="h-14 w-14 rounded-2xl gradient-accent flex items-center justify-center mb-6">
                  <Heart className="h-7 w-7 text-accent-foreground" />
                </div>
                <h3 className="text-2xl font-bold mb-4">Tầm nhìn</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Trở thành nền tảng quản lý CLB sinh viên hàng đầu, kết nối hàng nghìn sinh viên với đam mê, góp phần xây dựng một cộng đồng sinh viên năng động, sáng tạo và đoàn kết.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Features */}
          <div className="mb-16">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">
              Tại sao chọn ClubHub?
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  icon: Users,
                  title: "Dành cho mọi người",
                  description: "Sinh viên, Club Leader và Admin đều có trải nghiệm phù hợp với vai trò của mình.",
                },
                {
                  icon: CheckCircle,
                  title: "Quy trình rõ ràng",
                  description: "Các quy trình phê duyệt, đăng ký, thanh toán được số hóa hoàn toàn.",
                },
                {
                  icon: Award,
                  title: "Minh bạch",
                  description: "Thông tin hoạt động, tài chính CLB được công khai, dễ dàng theo dõi.",
                },
                {
                  icon: Heart,
                  title: "Thân thiện",
                  description: "Giao diện hiện đại, dễ sử dụng trên mọi thiết bị.",
                },
              ].map((item, index) => (
                <Card key={index} className="text-center p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <item.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h4 className="font-semibold mb-2">{item.title}</h4>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </Card>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="rounded-3xl gradient-hero p-12 text-primary-foreground text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-10">Con số ấn tượng</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { value: "50+", label: "Câu lạc bộ" },
                { value: "2000+", label: "Thành viên" },
                { value: "100+", label: "Sự kiện/năm" },
                { value: "95%", label: "Hài lòng" },
              ].map((stat, index) => (
                <div key={index}>
                  <div className="text-4xl md:text-5xl font-bold mb-2">{stat.value}</div>
                  <div className="opacity-80">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default About;
