import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Users, Send } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { clubApi } from "@/services/club.service";

export interface JoinClubPayload {
  club_id: string;
  introduction: string | null;
}

interface JoinClubDialogProps {
  readonly clubId: string;
  readonly clubName?: string;
  readonly triggerLabel?: string;
  readonly disabled?: boolean;
  readonly onSubmitted?: (payload: JoinClubPayload) => void;
}

/**
 * Example usage:
 * <JoinClubDialog clubId={club.id} clubName={club.name} onSubmitted={(p) => console.log(p)} />
 */
export default function JoinClubDialog({ clubId, clubName, triggerLabel = "Xin gia nhập", disabled, onSubmitted }: JoinClubDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const applyMutation = useMutation({
    mutationFn: async (payload: { introduction?: string }) => {
      const res = await clubApi.applyToClub(clubId, { introduction: payload.introduction });
      return res.data;
    },
  });

  const handleSubmit = async () => {
    const trimmed = message.trim();
    if (trimmed.length > 500) {
      toast({ title: "Lỗi", description: "Lời nhắn tối đa 500 ký tự", variant: "destructive" });
      return;
    }

    try {
      setSubmitting(true);
      await applyMutation.mutateAsync({ introduction: trimmed || undefined });
      const payload: JoinClubPayload = { club_id: clubId, introduction: trimmed || null };
      onSubmitted?.(payload);
      toast({ title: "Đã gửi đơn", description: "Đơn xin gia nhập đã được tạo và chờ duyệt" });
      setOpen(false);
      setMessage("");
    } catch (err: any) {
      toast({ title: "Gửi đơn thất bại", description: err?.message || "Vui lòng thử lại", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button onClick={() => setOpen(true)} disabled={disabled} variant="default" className="inline-flex items-center gap-2">
        <Users className="h-4 w-4" />
        {triggerLabel}
      </Button>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Xin gia nhập {clubName ? `— ${clubName}` : "CLB"}</DialogTitle>
          <DialogDescription>Gửi đơn xin gia nhập câu lạc bộ. Quản trị sẽ xem xét và phản hồi.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-2">
            <Label htmlFor="message">Lời nhắn (tuỳ chọn)</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Giới thiệu ngắn gọn về bạn và lý do muốn tham gia..."
              rows={4}
            />
            <div className="text-xs text-muted-foreground text-right">
              {message.trim().length}/500
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting}>Hủy</Button>
          <Button onClick={handleSubmit} disabled={submitting} className="inline-flex items-center gap-2">
            <Send className="h-4 w-4" />
            {submitting ? "Đang gửi..." : "Gửi đơn"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
