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
    image: "data:image/jpeg;base64,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",
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
