import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  SkillPost,
  CATEGORY_OPTIONS,
  LEVEL_OPTIONS,
  MODE_OPTIONS,
  URGENCY_OPTIONS,
  DURATION_OPTIONS,
} from "@/types/skillswap";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const baseSchema = z.object({
  skill_title: z.string().min(3, "Title must be at least 3 characters").max(100),
  category: z.enum(['coding', 'design', 'academics', 'languages', 'soft_skills', 'music', 'sports', 'other']),
  skill_level: z.enum(['beginner', 'intermediate', 'advanced']),
  description: z.string().max(500).optional(),
  preferred_mode: z.enum(['chat', 'voice_call', 'video_meeting']),
  session_duration: z.number().min(15).max(120),
  learning_goal: z.string().max(300).optional(),
  current_level: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  urgency: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
});

interface EditPostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post: SkillPost;
  onSuccess: () => void;
}

export function EditPostDialog({ open, onOpenChange, post, onSuccess }: EditPostDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const form = useForm({
    resolver: zodResolver(baseSchema),
    defaultValues: {
      skill_title: post.skill_title,
      category: post.category,
      skill_level: post.skill_level,
      description: post.description || "",
      preferred_mode: post.preferred_mode,
      session_duration: post.session_duration || 60,
      learning_goal: post.learning_goal || "",
      current_level: post.current_level || "beginner",
      urgency: post.urgency || "medium",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        skill_title: post.skill_title,
        category: post.category,
        skill_level: post.skill_level,
        description: post.description || "",
        preferred_mode: post.preferred_mode,
        session_duration: post.session_duration || 60,
        learning_goal: post.learning_goal || "",
        current_level: post.current_level || "beginner",
        urgency: post.urgency || "medium",
      });
    }
  }, [open, post, form]);

  const onSubmit = async (values: z.infer<typeof baseSchema>) => {
    setIsSubmitting(true);
    try {
      const updateData: Record<string, unknown> = {
        skill_title: values.skill_title,
        category: values.category,
        skill_level: values.skill_level,
        description: values.description || null,
        preferred_mode: values.preferred_mode,
        session_duration: values.session_duration,
      };

      if (post.post_type === "request") {
        updateData.learning_goal = values.learning_goal || null;
        updateData.current_level = values.current_level;
        updateData.urgency = values.urgency;
      }

      const { error } = await supabase
        .from("skill_posts_v2")
        .update(updateData)
        .eq("id", post.id);

      if (error) throw error;

      toast.success("Post updated successfully!");
      onSuccess();
      onOpenChange(false);
    } catch (error: unknown) {
      console.error("Error updating post:", error);
      toast.error((error as Error).message || "Failed to update post");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      // Delete availability first
      await supabase
        .from("skill_availability")
        .delete()
        .eq("post_id", post.id);

      // Delete the post
      const { error } = await supabase
        .from("skill_posts_v2")
        .delete()
        .eq("id", post.id);

      if (error) throw error;

      toast.success("Post deleted successfully!");
      onSuccess();
      onOpenChange(false);
    } catch (error: unknown) {
      console.error("Error deleting post:", error);
      toast.error((error as Error).message || "Failed to delete post");
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Edit Skill Post</DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
              <FormField
                control={form.control}
                name="skill_title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Skill Title *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Python Programming, Guitar, Spanish..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {CATEGORY_OPTIONS.map((cat) => (
                            <SelectItem key={cat.value} value={cat.value}>
                              {cat.icon} {cat.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="skill_level"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{post.post_type === "offer" ? "Teaching Level" : "Target Level"} *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {LEVEL_OPTIONS.map((level) => (
                            <SelectItem key={level.value} value={level.value}>
                              {level.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {post.post_type === "offer" ? "What will you teach?" : "What do you want to learn?"}
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={
                          post.post_type === "offer"
                            ? "Describe what you'll teach, your experience, and teaching style..."
                            : "Describe what you want to learn and your goals..."
                        }
                        {...field}
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Request-specific fields */}
              {post.post_type === "request" && (
                <>
                  <FormField
                    control={form.control}
                    name="current_level"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Your Current Level *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select your current level" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {LEVEL_OPTIONS.map((level) => (
                              <SelectItem key={level.value} value={level.value}>
                                {level.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="learning_goal"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Learning Goal</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Build a web app, Pass an exam..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="urgency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Urgency *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="How urgently do you need help?" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {URGENCY_OPTIONS.map((urgency) => (
                              <SelectItem key={urgency.value} value={urgency.value}>
                                {urgency.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              {/* Session Preferences */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="preferred_mode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preferred Mode *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="How do you want to connect?" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {MODE_OPTIONS.map((mode) => (
                            <SelectItem key={mode.value} value={mode.value}>
                              {mode.icon} {mode.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="session_duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Session Duration *</FormLabel>
                      <Select onValueChange={(v) => field.onChange(parseInt(v))} value={field.value?.toString()}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select duration" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {DURATION_OPTIONS.map((duration) => (
                            <SelectItem key={duration.value} value={duration.value.toString()}>
                              {duration.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </Button>
                <div className="flex-1" />
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Save Changes
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this post?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your skill post
              and all associated availability slots.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
