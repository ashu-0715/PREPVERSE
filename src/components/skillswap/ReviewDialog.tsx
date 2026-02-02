import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Star, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SkillSession } from "@/types/skillswap";

interface ReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: SkillSession;
  currentUserId: string;
  onSuccess: () => void;
}

export function ReviewDialog({ open, onOpenChange, session, currentUserId, onSuccess }: ReviewDialogProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const revieweeId = session.teacher_id === currentUserId ? session.learner_id : session.teacher_id;
  const revieweeName = session.teacher_id === currentUserId 
    ? session.learner?.full_name 
    : session.teacher?.full_name;

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("skill_reviews").insert({
        session_id: session.id,
        reviewer_id: currentUserId,
        reviewee_id: revieweeId,
        rating,
        feedback: feedback || null,
      });

      if (error) {
        if (error.code === "23505") {
          toast.error("You've already reviewed this session");
        } else {
          throw error;
        }
        return;
      }

      // Check and award badges
      await checkAndAwardBadges(revieweeId, rating);

      toast.success("Review submitted successfully!");
      onSuccess();
    } catch (error: any) {
      console.error("Error submitting review:", error);
      toast.error(error.message || "Failed to submit review");
    } finally {
      setIsSubmitting(false);
    }
  };

  const checkAndAwardBadges = async (userId: string, rating: number) => {
    try {
      // Get user's stats
      const [sessionsAsTeacher, sessionsAsLearner, reviews] = await Promise.all([
        supabase
          .from("skill_sessions")
          .select("id")
          .eq("teacher_id", userId)
          .eq("status", "completed"),
        supabase
          .from("skill_sessions")
          .select("id")
          .eq("learner_id", userId)
          .eq("status", "completed"),
        supabase
          .from("skill_reviews")
          .select("rating")
          .eq("reviewee_id", userId),
      ]);

      const teachingSessions = sessionsAsTeacher.data?.length || 0;
      const learningSessions = sessionsAsLearner.data?.length || 0;
      const fiveStarReviews = reviews.data?.filter((r) => r.rating === 5).length || 0;
      const avgRating = reviews.data?.length 
        ? reviews.data.reduce((sum, r) => sum + r.rating, 0) / reviews.data.length 
        : 0;

      // Get all badges
      const { data: badges } = await supabase.from("skill_badges").select("*");
      if (!badges) return;

      // Check each badge criteria
      for (const badge of badges) {
        const criteria = badge.criteria as Record<string, number>;
        if (!criteria) continue;

        let earned = false;

        if (criteria.sessions_taught && teachingSessions >= criteria.sessions_taught) {
          if (!criteria.min_rating || avgRating >= criteria.min_rating) {
            earned = true;
          }
        }

        if (criteria.sessions_learned && learningSessions >= criteria.sessions_learned) {
          earned = true;
        }

        if (criteria.five_star_reviews && fiveStarReviews >= criteria.five_star_reviews) {
          earned = true;
        }

        if (earned) {
          // Try to award badge (will fail silently if already awarded due to unique constraint)
          await supabase.from("user_skill_badges").insert({
            user_id: userId,
            badge_id: badge.id,
          }).select();
        }
      }
    } catch (error) {
      console.error("Error checking badges:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Leave a Review</DialogTitle>
          <DialogDescription>
            How was your session with {revieweeName}?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Star Rating */}
          <div className="space-y-2">
            <Label>Rating *</Label>
            <div className="flex gap-1 justify-center py-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className="p-1 transition-transform hover:scale-110"
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                >
                  <Star
                    className={`w-8 h-8 ${
                      star <= (hoverRating || rating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="text-center text-sm text-muted-foreground">
              {rating === 1 && "Poor"}
              {rating === 2 && "Fair"}
              {rating === 3 && "Good"}
              {rating === 4 && "Very Good"}
              {rating === 5 && "Excellent!"}
            </p>
          </div>

          {/* Feedback */}
          <div className="space-y-2">
            <Label>Feedback (optional)</Label>
            <Textarea
              placeholder="Share your experience..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={4}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting || rating === 0} className="flex-1">
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Submit Review
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
