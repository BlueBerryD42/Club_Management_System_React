import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAppSelector } from "@/store/hooks";
import { eventService } from "@/services/event.service";
import { Star, ArrowLeft, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

const EventFeedback = () => {
  const { id: eventId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const user = useAppSelector((s) => s.auth.user);

  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [comment, setComment] = useState<string>("");

  // Fetch event details
  const { data: event, isLoading: loadingEvent } = useQuery({
    queryKey: ["event", eventId],
    queryFn: async () => {
      if (!eventId) throw new Error("Event ID is required");
      return await eventService.getById(eventId);
    },
    enabled: !!eventId,
  });

  // Check if user has already submitted feedback
  const { data: existingFeedback } = useQuery({
    queryKey: ["event-feedback-check", eventId, user?.id],
    queryFn: async () => {
      if (!eventId || !user) return null;
      try {
        const response = await eventService.getFeedbacks(eventId);
        const feedbacks = response.data?.feedbacks || [];
        // Check if current user has submitted feedback
        const userFeedback = feedbacks.find((f: any) => f.userId === user.id || f.user?.id === user.id);
        return userFeedback || null;
      } catch (error) {
        return null;
      }
    },
    enabled: !!eventId && !!user,
  });

  // Submit feedback mutation
  const submitFeedbackMutation = useMutation({
    mutationFn: async (data: { rating: number; comment?: string }) => {
      if (!eventId) throw new Error("Event ID is required");
      return await eventService.submitFeedback(eventId, data);
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Cảm ơn bạn đã đánh giá sự kiện!",
      });
      queryClient.invalidateQueries({ queryKey: ["event-feedback", eventId] });
      queryClient.invalidateQueries({ queryKey: ["event-feedback-check", eventId] });
      navigate(-1); // Go back to previous page
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: error?.response?.data?.message || "Không thể gửi đánh giá. Vui lòng thử lại.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === 0) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn số sao đánh giá",
        variant: "destructive",
      });
      return;
    }

    submitFeedbackMutation.mutate({
      rating,
      comment: comment.trim() || undefined,
    });
  };

  if (loadingEvent) {
    return (
      <Layout>
        <div className="container py-8">
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardContent className="p-6">
                <div className="text-center">Đang tải...</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </Layout>
    );
  }

  if (!event) {
    return (
      <Layout>
        <div className="container py-8">
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <p className="text-muted-foreground mb-4">Không tìm thấy sự kiện</p>
                  <Button onClick={() => navigate(-1)}>Quay lại</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </Layout>
    );
  }

  // Check if event has ended
  const now = new Date();
  const endTime = event.endTime ? new Date(event.endTime) : new Date(event.startTime);
  const hasEnded = now > endTime;

  return (
    <Layout>
      <div className="container py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Back button */}
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại
          </Button>

          {/* Event Info */}
          <Card>
            <CardHeader>
              <CardTitle>{event.title}</CardTitle>
              <CardDescription>
                {event.club.name} • {format(new Date(event.startTime), "EEEE, dd/MM/yyyy - HH:mm", { locale: vi })}
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Feedback Form */}
          <Card>
            <CardHeader>
              <CardTitle>Đánh giá sự kiện</CardTitle>
              <CardDescription>
                Chia sẻ trải nghiệm của bạn về sự kiện này
              </CardDescription>
            </CardHeader>
            <CardContent>
              {existingFeedback ? (
                <div className="text-center py-8">
                  <CheckCircle2 className="h-16 w-16 mx-auto mb-4 text-success" />
                  <p className="text-lg font-medium mb-2">Bạn đã đánh giá sự kiện này</p>
                  <div className="flex items-center justify-center gap-1 mb-4">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-6 w-6 ${
                          star <= (existingFeedback.rating || 0)
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  {existingFeedback.comment && (
                    <p className="text-muted-foreground mb-4">{existingFeedback.comment}</p>
                  )}
                  <Button onClick={() => navigate(-1)}>Quay lại</Button>
                </div>
              ) : !hasEnded ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">
                    Sự kiện chưa kết thúc. Vui lòng đánh giá sau khi sự kiện kết thúc.
                  </p>
                  <Button onClick={() => navigate(-1)}>Quay lại</Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Rating */}
                  <div className="space-y-2">
                    <Label htmlFor="rating">Đánh giá *</Label>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          className="focus:outline-none transition-transform hover:scale-110"
                          onMouseEnter={() => setHoveredRating(star)}
                          onMouseLeave={() => setHoveredRating(0)}
                          onClick={() => setRating(star)}
                        >
                          <Star
                            className={`h-8 w-8 ${
                              star <= (hoveredRating || rating)
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-300"
                            }`}
                          />
                        </button>
                      ))}
                      {rating > 0 && (
                        <span className="ml-2 text-sm text-muted-foreground">
                          {rating === 1 && "Rất không hài lòng"}
                          {rating === 2 && "Không hài lòng"}
                          {rating === 3 && "Bình thường"}
                          {rating === 4 && "Hài lòng"}
                          {rating === 5 && "Rất hài lòng"}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Comment */}
                  <div className="space-y-2">
                    <Label htmlFor="comment">Nhận xét (tùy chọn)</Label>
                    <Textarea
                      id="comment"
                      placeholder="Chia sẻ thêm về trải nghiệm của bạn..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      rows={5}
                      className="resize-none"
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="flex gap-4">
                    <Button
                      type="submit"
                      disabled={submitFeedbackMutation.isPending || rating === 0}
                      className="flex-1"
                    >
                      {submitFeedbackMutation.isPending ? (
                        "Đang gửi..."
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Gửi đánh giá
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate(-1)}
                      disabled={submitFeedbackMutation.isPending}
                    >
                      Hủy
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default EventFeedback;

