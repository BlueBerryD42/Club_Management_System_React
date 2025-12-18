import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Users, Star } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { clubApi } from "@/services/club.service";

const categoryColors: Record<string, string> = {
  "Học thuật": "bg-primary/10 text-primary",
  "Nghệ thuật": "bg-accent/10 text-accent",
  "Xã hội": "bg-success/10 text-success",
  "Kinh doanh": "bg-warning/10 text-warning",
};

export function ClubsPreview() {
  const { data, isLoading } = useQuery({
    queryKey: ["featured-clubs"],
    queryFn: async () => {
      const res = await clubApi.getAll({ page: 1, limit: 8, isActive: true });
      return res.data;
    },
    staleTime: 60_000,
  });

  const clubs = (data?.data || []).map((c: any) => ({
    id: c.slug || c.id,
    name: c.name,
    category: c.description?.includes('học') ? 'Học thuật' :
              c.description?.includes('nghệ thuật') ? 'Nghệ thuật' :
              c.description?.includes('tình nguyện') ? 'Xã hội' :
              c.description?.includes('kinh doanh') ? 'Kinh doanh' : 'Khác',
    members: c._count?.memberships || 0,
    description: c.description || '',
    image: c.logoUrl || "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&h=300&fit=crop",
    isRecruiting: c.status === 'ACTIVE',
    rating: 4.8,
  }));

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
          {isLoading && (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={`skeleton-${i}`} className="rounded-2xl bg-card border border-border/50 overflow-hidden shadow-sm">
                <Skeleton className="h-48 w-full" />
                <div className="p-5 space-y-3">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                </div>
              </div>
            ))
          )}
          {!isLoading && clubs.map((club: typeof clubs[0], index: number) => (
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
