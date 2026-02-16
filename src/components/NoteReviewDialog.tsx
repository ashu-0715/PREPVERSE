import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star } from "lucide-react";
import { toast } from "sonner";

interface Review {
  id: string;
  stars: number;
  review_text: string | null;
  created_at: string;
  user_id: string;
  profile?: { full_name: string; avatar_url?: string };
}

interface NoteReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  noteId: string;
  noteTitle: string;
  userId: string | null;
  canReview: boolean;
}

export function NoteReviewDialog({
  open,
  onOpenChange,
  noteId,
  noteTitle,
  userId,
  canReview,
}: NoteReviewDialogProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [myStars, setMyStars] = useState(0);
  const [myText, setMyText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [hoverStar, setHoverStar] = useState(0);
  const [existingReview, setExistingReview] = useState<Review | null>(null);

  useEffect(() => {
    if (open) {
      fetchReviews();
    }
  }, [open, noteId]);

  const fetchReviews = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("note_reviews")
      .select("*")
      .eq("note_id", noteId)
      .order("created_at", { ascending: false });

    if (data && data.length > 0) {
      const userIds = [...new Set(data.map((r) => r.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", userIds);

      const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);
      const reviewsWithProfiles = data.map((r) => ({
        ...r,
        profile: profileMap.get(r.user_id),
      }));
      setReviews(reviewsWithProfiles);

      // Check for existing review by current user
      if (userId) {
        const mine = reviewsWithProfiles.find((r) => r.user_id === userId);
        if (mine) {
          setExistingReview(mine);
          setMyStars(mine.stars);
          setMyText(mine.review_text || "");
        }
      }
    } else {
      setReviews([]);
    }
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!userId || myStars === 0) return;
    setSubmitting(true);

    try {
      if (existingReview) {
        const { error } = await supabase
          .from("note_reviews")
          .update({ stars: myStars, review_text: myText || null, updated_at: new Date().toISOString() })
          .eq("id", existingReview.id);
        if (error) throw error;
        toast.success("Review updated!");
      } else {
        const { error } = await supabase.from("note_reviews").insert({
          note_id: noteId,
          user_id: userId,
          stars: myStars,
          review_text: myText || null,
        });
        if (error) throw error;
        toast.success("Review submitted!");
      }
      fetchReviews();
    } catch (error: any) {
      toast.error(error.message || "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Reviews — {noteTitle}</DialogTitle>
        </DialogHeader>

        {/* Write/edit review */}
        {canReview && userId && (
          <div className="border rounded-lg p-4 mb-4 bg-muted/30">
            <p className="text-sm font-medium mb-2">
              {existingReview ? "Update your review" : "Write a review"}
            </p>
            <div className="flex gap-1 mb-3">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onMouseEnter={() => setHoverStar(s)}
                  onMouseLeave={() => setHoverStar(0)}
                  onClick={() => setMyStars(s)}
                >
                  <Star
                    className={`w-6 h-6 transition-colors ${
                      s <= (hoverStar || myStars)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-muted-foreground"
                    }`}
                  />
                </button>
              ))}
            </div>
            <Textarea
              value={myText}
              onChange={(e) => setMyText(e.target.value)}
              placeholder="Write your review (optional)..."
              rows={2}
              className="mb-3"
            />
            <Button onClick={handleSubmit} disabled={submitting || myStars === 0} size="sm">
              {submitting ? "Submitting..." : existingReview ? "Update" : "Submit"}
            </Button>
          </div>
        )}

        {/* Reviews list */}
        {loading ? (
          <div className="py-8 text-center text-muted-foreground">Loading reviews...</div>
        ) : reviews.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">No reviews yet</div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="border rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Avatar className="w-6 h-6">
                    <AvatarImage src={review.profile?.avatar_url} />
                    <AvatarFallback className="text-xs">
                      {review.profile?.full_name?.[0] || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">{review.profile?.full_name || "User"}</span>
                  <div className="flex gap-0.5 ml-auto">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-3.5 h-3.5 ${
                          s <= review.stars ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
                        }`}
                      />
                    ))}
                  </div>
                </div>
                {review.review_text && (
                  <p className="text-sm text-muted-foreground">{review.review_text}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(review.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
