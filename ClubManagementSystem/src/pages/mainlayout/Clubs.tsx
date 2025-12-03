import { useState } from "react";
import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Users, Star, Grid3X3, List } from "lucide-react";

const allClubs = [
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
  {
    id: 5,
    name: "CLB Âm nhạc",
    category: "Nghệ thuật",
    members: 78,
    description: "Nơi giao lưu và phát triển tài năng âm nhạc, tổ chức các buổi biểu diễn.",
    image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&h=300&fit=crop",
    isRecruiting: true,
    rating: 4.5,
  },
  {
    id: 6,
    name: "CLB Thể thao",
    category: "Thể thao",
    members: 189,
    description: "Rèn luyện sức khỏe, tinh thần thể thao qua các hoạt động bóng đá, cầu lông, gym.",
    image: "https://images.unsplash.com/photo-1461896836934- voices-0db7e9?w=400&h=300&fit=crop",
    isRecruiting: false,
    rating: 4.4,
  },
  {
    id: 7,
    name: "CLB Tiếng Anh",
    category: "Học thuật",
    members: 145,
    description: "Nâng cao kỹ năng tiếng Anh thông qua giao tiếp, debate và các hoạt động thú vị.",
    image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&h=300&fit=crop",
    isRecruiting: true,
    rating: 4.7,
  },
  {
    id: 8,
    name: "CLB Sách",
    category: "Văn hóa",
    members: 67,
    description: "Cộng đồng yêu sách, chia sẻ kiến thức và tổ chức các buổi review sách.",
    image: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=300&fit=crop",
    isRecruiting: true,
    rating: 4.8,
  },
];

const categories = ["Tất cả", "Học thuật", "Nghệ thuật", "Xã hội", "Kinh doanh", "Thể thao", "Văn hóa"];

const categoryColors: Record<string, string> = {
  "Học thuật": "bg-primary/10 text-primary",
  "Nghệ thuật": "bg-accent/10 text-accent",
  "Xã hội": "bg-success/10 text-success",
  "Kinh doanh": "bg-warning/10 text-warning",
  "Thể thao": "bg-destructive/10 text-destructive",
  "Văn hóa": "bg-secondary text-secondary-foreground",
};

const Clubs = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Tất cả");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState("members");

  const filteredClubs = allClubs
    .filter((club) => {
      const matchesSearch = club.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        club.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "Tất cả" || club.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (sortBy === "members") return b.members - a.members;
      if (sortBy === "rating") return b.rating - a.rating;
      return a.name.localeCompare(b.name);
    });

  return (
    <Layout>
      <div className="py-8 md:py-12">
        <div className="container">
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              Khám phá <span className="text-gradient">Câu lạc bộ</span>
            </h1>
            <p className="text-muted-foreground text-lg">
              Tìm kiếm và tham gia các CLB phù hợp với sở thích và đam mê của bạn
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-col lg:flex-row gap-4 mb-8">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm câu lạc bộ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12"
              />
            </div>

            {/* Category Filter */}
            <div className="flex gap-2 flex-wrap">
              {categories.map((cat) => (
                <Button
                  key={cat}
                  variant={selectedCategory === cat ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(cat)}
                  className="shrink-0"
                >
                  {cat}
                </Button>
              ))}
            </div>
          </div>

          {/* Sort & View Options */}
          <div className="flex justify-between items-center mb-6">
            <p className="text-muted-foreground">
              Tìm thấy <span className="font-semibold text-foreground">{filteredClubs.length}</span> câu lạc bộ
            </p>
            <div className="flex items-center gap-2">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Sắp xếp" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="members">Nhiều thành viên</SelectItem>
                  <SelectItem value="rating">Đánh giá cao</SelectItem>
                  <SelectItem value="name">Tên A-Z</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex border border-border rounded-lg overflow-hidden">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="icon"
                  onClick={() => setViewMode("grid")}
                  className="rounded-none"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="icon"
                  onClick={() => setViewMode("list")}
                  className="rounded-none"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Clubs Grid/List */}
          {viewMode === "grid" ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredClubs.map((club) => (
                <Link
                  key={club.id}
                  to={`/clubs/${club.id}`}
                  className="group block rounded-2xl bg-card border border-border/50 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2"
                >
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
                    <div className="absolute bottom-3 left-3">
                      <Badge variant="secondary" className={categoryColors[club.category]}>
                        {club.category}
                      </Badge>
                    </div>
                  </div>
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
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      {club.members} thành viên
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredClubs.map((club) => (
                <Link
                  key={club.id}
                  to={`/clubs/${club.id}`}
                  className="group flex gap-6 p-4 rounded-xl bg-card border border-border/50 hover:shadow-lg transition-all duration-300"
                >
                  <div className="relative w-32 h-32 rounded-xl overflow-hidden shrink-0">
                    <img
                      src={club.image}
                      alt={club.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                            {club.name}
                          </h3>
                          {club.isRecruiting && (
                            <Badge className="gradient-accent text-accent-foreground border-0 text-xs">
                              Đang tuyển
                            </Badge>
                          )}
                        </div>
                        <Badge variant="secondary" className={`${categoryColors[club.category]} text-xs`}>
                          {club.category}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1 text-warning">
                        <Star className="h-4 w-4 fill-current" />
                        {club.rating}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {club.description}
                    </p>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      {club.members} thành viên
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {filteredClubs.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Không tìm thấy câu lạc bộ nào phù hợp.</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Clubs;
