import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Users, Star } from "lucide-react";

const featuredClubs = [
  {
    id: 1,
    name: "CLB Tin học",
    category: "Học thuật",
    members: 156,
    description: "Nơi hội tụ đam mê công nghệ, lập trình và phát triển kỹ năng IT cho sinh viên.",
    image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&h=300&fit=crop",
    isRecruiting: true,
    rating: 4.8,
  },
  {
    id: 2,
    name: "CLB Nhiếp ảnh",
    category: "Nghệ thuật",
    members: 89,
    description: "Khám phá nghệ thuật nhiếp ảnh, ghi lại những khoảnh khắc đẹp trong cuộc sống.",
    image: "https://images.unsplash.com/photo-1452780212940-6f5c0d14d848?w=400&h=300&fit=crop",
    isRecruiting: true,
    rating: 4.9,
  },
  {
    id: 3,
    name: "CLB Tình nguyện",
    category: "Xã hội",
    members: 234,
    description: "Lan tỏa yêu thương, kết nối cộng đồng qua các hoạt động tình nguyện ý nghĩa.",
    image: "https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=400&h=300&fit=crop",
    isRecruiting: false,
    rating: 4.7,
  },
  {
    id: 4,
    name: "CLB Khởi nghiệp",
    category: "Kinh doanh",
    members: 112,
    description: "Ươm mầm ý tưởng kinh doanh, phát triển tư duy khởi nghiệp cho sinh viên.",
    image: "https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=400&h=300&fit=crop",
    isRecruiting: true,
    rating: 4.6,
  },
];

const categoryColors: Record<string, string> = {
  "Học thuật": "bg-primary/10 text-primary",
  "Nghệ thuật": "bg-accent/10 text-accent",
  "Xã hội": "bg-success/10 text-success",
  "Kinh doanh": "bg-warning/10 text-warning",
};

export function ClubsPreview() {
  return (
    <section className="py-20">
      <div className="container">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-12">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-2">
              Câu lạc bộ <span className="text-gradient">nổi bật</span>
            </h2>
            <p className="text-muted-foreground">
              Khám phá các CLB đang thu hút nhiều sinh viên tham gia
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link to="/clubs">
              Xem tất cả
              <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredClubs.map((club, index) => (
            <Link
              key={club.id}
              to={`/clubs/${club.id}`}
              className="group block rounded-2xl bg-card border border-border/50 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Image */}
              <div className="relative h-48 overflow-hidden">
                <img
                  src={club.image}
                  alt={club.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                {club.isRecruiting && (
                  <div className="absolute top-3 right-3">
                    <Badge className="gradient-accent text-accent-foreground border-0">
                      Đang tuyển
                    </Badge>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent" />
                <div className="absolute bottom-3 left-3 right-3">
                  <Badge variant="secondary" className={categoryColors[club.category]}>
                    {club.category}
                  </Badge>
                </div>
              </div>

              {/* Content */}
              <div className="p-5">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                    {club.name}
                  </h3>
                  <div className="flex items-center gap-1 text-sm text-warning">
                    <Star className="h-4 w-4 fill-current" />
                    {club.rating}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                  {club.description}
                </p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {club.members} thành viên
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
