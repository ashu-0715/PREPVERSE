import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon, Sparkles, Loader2, Plus, X, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  SkillPostType,
  CATEGORY_OPTIONS,
  LEVEL_OPTIONS,
  MODE_OPTIONS,
  URGENCY_OPTIONS,
  DURATION_OPTIONS,
} from "@/types/skillswap";

const baseSchema = z.object({
  skill_title: z.string().min(3, "Title must be at least 3 characters").max(100),
  category: z.enum(['coding', 'design', 'academics', 'languages', 'soft_skills', 'music', 'sports', 'other']),
  skill_level: z.enum(['beginner', 'intermediate', 'advanced']),
  description: z.string().max(500).optional(),
  preferred_mode: z.enum(['chat', 'voice_call', 'video_meeting']),
  session_duration: z.number().min(15).max(120),
});

const offerSchema = baseSchema;

const requestSchema = baseSchema.extend({
  learning_goal: z.string().max(300).optional(),
  current_level: z.enum(['beginner', 'intermediate', 'advanced']),
  urgency: z.enum(['low', 'medium', 'high', 'urgent']),
});

interface TimeSlot {
  date: Date;
  startTime: string;
  endTime: string;
}

interface CreatePostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreatePostDialog({ open, onOpenChange, onSuccess }: CreatePostDialogProps) {
  const [postType, setPostType] = useState<SkillPostType>("offer");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");

  const schema = postType === "offer" ? offerSchema : requestSchema;

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      skill_title: "",
      category: "other" as const,
      skill_level: "beginner" as const,
      description: "",
      preferred_mode: "chat" as const,
      session_duration: 60,
      learning_goal: "",
      current_level: "beginner" as const,
      urgency: "medium" as const,
    },
  });

  const addTimeSlot = () => {
    if (!selectedDate) {
      toast.error("Please select a date first");
      return;
    }
    setTimeSlots([...timeSlots, { date: selectedDate, startTime, endTime }]);
    setSelectedDate(undefined);
  };

  const removeTimeSlot = (index: number) => {
    setTimeSlots(timeSlots.filter((_, i) => i !== index));
  };

  const generateAIImage = async () => {
    const values = form.getValues();
    if (!values.skill_title) {
      toast.error("Please enter a skill title first");
      return;
    }

    setIsGeneratingImage(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-skill-image", {
        body: {
          skillTitle: values.skill_title,
          category: values.category,
          description: values.description,
          postType,
        },
      });

      if (error) throw error;
      
      if (data.imageUrl) {
        setGeneratedImageUrl(data.imageUrl);
        toast.success("Image generated successfully!");
      }
    } catch (error: any) {
      console.error("Error generating image:", error);
      toast.error(error.message || "Failed to generate image");
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const onSubmit = async (values: z.infer<typeof schema>) => {
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Create the post
      const postData = {
        user_id: user.id,
        post_type: postType,
        skill_title: values.skill_title,
        category: values.category,
        skill_level: values.skill_level,
        description: values.description || null,
        preferred_mode: values.preferred_mode,
        session_duration: values.session_duration,
        image_url: generatedImageUrl,
        ...(postType === "request" && {
          learning_goal: (values as any).learning_goal || null,
          current_level: (values as any).current_level,
          urgency: (values as any).urgency,
        }),
      };

      const { data: post, error: postError } = await supabase
        .from("skill_posts_v2")
        .insert(postData)
        .select()
        .single();

      if (postError) throw postError;

      // Add availability slots
      if (timeSlots.length > 0) {
        const availabilityData = timeSlots.map((slot) => ({
          post_id: post.id,
          user_id: user.id,
          available_date: format(slot.date, "yyyy-MM-dd"),
          start_time: slot.startTime,
          end_time: slot.endTime,
        }));

        const { error: availError } = await supabase
          .from("skill_availability")
          .insert(availabilityData);

        if (availError) {
          console.error("Error adding availability:", availError);
        }
      }

      toast.success("Post created successfully!");
      form.reset();
      setGeneratedImageUrl(null);
      setTimeSlots([]);
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error creating post:", error);
      toast.error(error.message || "Failed to create post");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Create Skill Post</DialogTitle>
        </DialogHeader>

        <Tabs value={postType} onValueChange={(v) => setPostType(v as SkillPostType)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="offer" className="gap-2">
              🎓 I Can Teach
            </TabsTrigger>
            <TabsTrigger value="request" className="gap-2">
              📚 I Want to Learn
            </TabsTrigger>
          </TabsList>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
              {/* Common Fields */}
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
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                      <FormLabel>{postType === "offer" ? "Teaching Level" : "Target Level"} *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                      {postType === "offer" ? "What will you teach?" : "What do you want to learn?"}
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={
                          postType === "offer"
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
              <TabsContent value="request" className="space-y-4 mt-0">
                <FormField
                  control={form.control}
                  name="current_level"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Your Current Level *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                        <Input placeholder="e.g., Build a web app, Pass an exam, Hold a conversation..." {...field} />
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
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
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
              </TabsContent>

              {/* Session Preferences */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="preferred_mode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preferred Mode *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                      <Select onValueChange={(v) => field.onChange(parseInt(v))} defaultValue={field.value.toString()}>
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

              {/* Availability Slots */}
              <div className="space-y-3">
                <FormLabel>Available Time Slots</FormLabel>
                <div className="flex flex-wrap gap-2">
                  {timeSlots.map((slot, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm"
                    >
                      <Clock className="w-3 h-3" />
                      {format(slot.date, "MMM d")} {slot.startTime}-{slot.endTime}
                      <button type="button" onClick={() => removeTimeSlot(index)}>
                        <X className="w-3 h-3 hover:text-destructive" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2 items-end">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button type="button" variant="outline" size="sm" className={cn(!selectedDate && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDate ? format(selectedDate, "MMM d") : "Pick date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        disabled={(date) => date < new Date()}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                  <Input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-28"
                  />
                  <span className="text-muted-foreground">to</span>
                  <Input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-28"
                  />
                  <Button type="button" variant="outline" size="icon" onClick={addTimeSlot}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* AI Image Generation */}
              <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between">
                  <FormLabel className="mb-0">AI Generated Image</FormLabel>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={generateAIImage}
                    disabled={isGeneratingImage}
                  >
                    {isGeneratingImage ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4 mr-2" />
                    )}
                    Generate Image
                  </Button>
                </div>
                {generatedImageUrl && (
                  <div className="relative">
                    <img
                      src={generatedImageUrl}
                      alt="Generated skill image"
                      className="w-full h-40 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => setGeneratedImageUrl(null)}
                      className="absolute top-2 right-2 p-1 bg-background/80 rounded-full"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Create Post
                </Button>
              </div>
            </form>
          </Form>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
