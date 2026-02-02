import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MessageCircle, Clock, Calendar, GraduationCap, BookOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";
import {
  SkillPost,
  CATEGORY_OPTIONS,
  LEVEL_OPTIONS,
  MODE_OPTIONS,
  URGENCY_OPTIONS,
} from "@/types/skillswap";
import { ConnectionDialog } from "./ConnectionDialog";

interface SkillPostCardProps {
  post: SkillPost;
  currentUserId: string | null;
  onLikeToggle: () => void;
}

export function SkillPostCard({ post, currentUserId, onLikeToggle }: SkillPostCardProps) {
  const [isLiking, setIsLiking] = useState(false);
  const [showConnectionDialog, setShowConnectionDialog] = useState(false);

  const category = CATEGORY_OPTIONS.find((c) => c.value === post.category);
  const level = LEVEL_OPTIONS.find((l) => l.value === post.skill_level);
  const mode = MODE_OPTIONS.find((m) => m.value === post.preferred_mode);
  const urgency = post.urgency ? URGENCY_OPTIONS.find((u) => u.value === post.urgency) : null;

  const isOwnPost = currentUserId === post.user_id;

  const handleLike = async () => {
    if (!currentUserId) {
      toast.error("Please sign in to like posts");
      return;
    }

    setIsLiking(true);
    try {
      if (post.user_has_liked) {
        await supabase
          .from("skill_post_likes")
          .delete()
          .eq("post_id", post.id)
          .eq("user_id", currentUserId);
      } else {
        await supabase
          .from("skill_post_likes")
          .insert({ post_id: post.id, user_id: currentUserId });
      }
      onLikeToggle();
    } catch (error) {
      console.error("Error toggling like:", error);
    } finally {
      setIsLiking(false);
    }
  };

  const handleConnect = () => {
    if (!currentUserId) {
      toast.error("Please sign in to connect");
      return;
    }
    if (isOwnPost) {
      toast.info("This is your own post");
      return;
    }
    setShowConnectionDialog(true);
  };

  const initials = post.profile?.full_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "?";

  return (
    <>
      <Card className="overflow-hidden hover:shadow-lg transition-all duration-300">
        {/* Image Header */}
        {post.image_url && (
          <div className="relative h-40">
            <img
              src={post.image_url}
              alt={post.skill_title}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-2 right-2">
              <Badge
                variant={post.post_type === "offer" ? "default" : "secondary"}
                className="gap-1"
              >
                {post.post_type === "offer" ? (
                  <>
                    <GraduationCap className="w-3 h-3" />
                    Teaching
                  </>
                ) : (
                  <>
                    <BookOpen className="w-3 h-3" />
                    Learning
                  </>
                )}
              </Badge>
            </div>
          </div>
        )}

        <div className="p-5">
          {/* Header */}
          <div className="flex items-start gap-3 mb-4">
            <Avatar className="h-10 w-10">
              <AvatarImage src={post.profile?.avatar_url || undefined} />
              <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white text-sm">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{post.profile?.full_name || "Student"}</p>
              <p className="text-sm text-muted-foreground">
                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
              </p>
            </div>
            {!post.image_url && (
              <Badge
                variant={post.post_type === "offer" ? "default" : "secondary"}
                className="gap-1"
              >
                {post.post_type === "offer" ? (
                  <>
                    <GraduationCap className="w-3 h-3" />
                    Teaching
                  </>
                ) : (
                  <>
                    <BookOpen className="w-3 h-3" />
                    Learning
                  </>
                )}
              </Badge>
            )}
          </div>

          {/* Title & Category */}
          <h3 className="text-lg font-bold mb-2">{post.skill_title}</h3>
          <div className="flex flex-wrap gap-2 mb-3">
            <Badge variant="outline" className="gap-1">
              {category?.icon} {category?.label}
            </Badge>
            <Badge variant="outline">{level?.label}</Badge>
            <Badge variant="outline" className="gap-1">
              {mode?.icon} {mode?.label}
            </Badge>
            {urgency && (
              <Badge className={urgency.color}>{urgency.label}</Badge>
            )}
          </div>

          {/* Description */}
          {post.description && (
            <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
              {post.description}
            </p>
          )}

          {/* Learning Goal for request posts */}
          {post.post_type === "request" && post.learning_goal && (
            <div className="mb-3 p-2 bg-muted/50 rounded-lg">
              <p className="text-xs font-medium text-muted-foreground">Goal:</p>
              <p className="text-sm">{post.learning_goal}</p>
            </div>
          )}

          {/* Session Info */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {post.session_duration} min
            </span>
            {post.availability && post.availability.length > 0 && (
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {post.availability.length} slot{post.availability.length > 1 ? "s" : ""}
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className={`gap-1 ${post.user_has_liked ? "text-red-500" : ""}`}
              onClick={handleLike}
              disabled={isLiking}
            >
              <Heart className={`w-4 h-4 ${post.user_has_liked ? "fill-current" : ""}`} />
              {post.likes}
            </Button>

            {!isOwnPost && (
              <Button
                size="sm"
                className="gap-1 ml-auto"
                onClick={handleConnect}
              >
                <MessageCircle className="w-4 h-4" />
                {post.post_type === "offer" ? "I Want to Learn This" : "I Know This"}
              </Button>
            )}
          </div>
        </div>
      </Card>

      <ConnectionDialog
        open={showConnectionDialog}
        onOpenChange={setShowConnectionDialog}
        post={post}
        currentUserId={currentUserId}
      />
    </>
  );
}
