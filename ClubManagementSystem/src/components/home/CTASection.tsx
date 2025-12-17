import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Building2 } from "lucide-react";
// import { ArrowRight, UserPlus } from "lucide-react";

export function CTASection() {
  return (
    <section className="py-20 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 gradient-hero -z-10" />
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-10 left-10 w-32 h-32 bg-primary-foreground/10 rounded-full blur-2xl" />
        <div className="absolute bottom-10 right-10 w-48 h-48 bg-primary-foreground/10 rounded-full blur-3xl" />
      </div>

      <div className="container">
        <div className="max-w-3xl mx-auto text-center text-primary-foreground">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
            Sẵn sàng tham gia cộng đồng CLB?
          </h2>
          <p className="text-lg md:text-xl opacity-90 mb-10">
            Khám phá hàng chục câu lạc bộ đa dạng, kết nối với bạn bè cùng đam mê và phát triển bản thân.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {/* <Button
              size="xl"
              className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all"
              asChild
            >
              <Link to="/register">
                <UserPlus className="h-5 w-5 mr-2" />
                Đăng ký tài khoản
                <ArrowRight className="h-5 w-5 ml-2" />
              </Link>
            </Button> */}
            <Button
              variant="outline"
              size="xl"
              className="border-primary-foreground/30 text-primary-foreground bg-primary-foreground/10 hover:bg-primary-foreground/20 hover:text-primary-foreground"
              asChild
            >
              <Link to="/clubs">
                <Building2 className="h-5 w-5 mr-2" />
                Tham gia CLB  
              </Link>
            </Button>
          </div>

          <div className="mt-12 grid grid-cols-2 gap-8 max-w-md mx-auto">
            <div>
              <div className="text-3xl md:text-4xl font-bold">100%</div>
              <div className="text-sm opacity-80">Miễn phí</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold">24/7</div>
              <div className="text-sm opacity-80">Hỗ trợ</div>
            </div>
            {/* <div>
              <div className="text-3xl md:text-4xl font-bold">5 phút</div>
              <div className="text-sm opacity-80">Đăng ký</div>
            </div> */}
          </div>
        </div>
      </div>
    </section>
  );
}
