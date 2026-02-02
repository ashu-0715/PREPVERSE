import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon, Loader2, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SkillPost, PLATFORM_OPTIONS, DURATION_OPTIONS, MeetingPlatform } from "@/types/skillswap";

interface MeetingSchedulerProps {
  post: SkillPost;
  currentUserId: string | null;
  onBack: () => void;
  onSuccess: () => void;
}

export function MeetingScheduler({ post, currentUserId, onBack, onSuccess }: MeetingSchedulerProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState("10:00");
  const [duration, setDuration] = useState(post.session_duration || 60);
  const [platform, setPlatform] = useState<MeetingPlatform>("google_meet");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const generateMeetingLink = (platform: MeetingPlatform): string => {
    const meetingId = Math.random().toString(36).substring(2, 12);
    
    switch (platform) {
      case "google_meet":
        // Google Meet links need to be created via Google API in production
        // For now, we'll create a placeholder
        return `https://meet.google.com/new`;
      case "zoom":
        // Zoom links need Zoom API integration in production
        return `https://zoom.us/j/${meetingId}`;
      case "in_app":
        return `/skillswap/meeting/${meetingId}`;
      default:
        return "";
    }
  };

  const handleSchedule = async () => {
    if (!currentUserId || !selectedDate) {
      toast.error("Please select a date");
      return;
    }

    setIsSubmitting(true);
    try {
      // First create a connection
      const { data: connection, error: connError } = await supabase
        .from("skill_connections")
        .insert({
          post_id: post.id,
          requester_id: currentUserId,
          post_owner_id: post.user_id,
          connection_type: "video_meeting",
          status: "pending",
        })
        .select()
        .single();

      if (connError) throw connError;

      // Determine who is the teacher and learner based on post type
      const teacherId = post.post_type === "offer" ? post.user_id : currentUserId;
      const learnerId = post.post_type === "offer" ? currentUserId : post.user_id;

      // Generate meeting link
      const meetingLink = generateMeetingLink(platform);

      // Create the session
      const { error: sessionError } = await supabase
        .from("skill_sessions")
        .insert({
          connection_id: connection.id,
          teacher_id: teacherId,
          learner_id: learnerId,
          scheduled_date: format(selectedDate, "yyyy-MM-dd"),
          scheduled_time: selectedTime,
          duration,
          meeting_platform: platform,
          meeting_link: meetingLink,
          notes: notes || null,
          status: "scheduled",
        });

      if (sessionError) throw sessionError;

      onSuccess();
    } catch (error: any) {
      console.error("Error scheduling meeting:", error);
      toast.error(error.message || "Failed to schedule meeting");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get available dates from post availability
  const availableDates = post.availability?.map((a) => new Date(a.available_date)) || [];

  return (
    <div className="space-y-4">
      {/* Date Selection */}
      <div className="space-y-2">
        <Label>Select Date *</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn("w-full justify-start text-left font-normal", !selectedDate && "text-muted-foreground")}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
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
        {availableDates.length > 0 && (
          <p className="text-xs text-muted-foreground">
            Available slots: {availableDates.map((d) => format(d, "MMM d")).join(", ")}
          </p>
        )}
      </div>

      {/* Time Selection */}
      <div className="space-y-2">
        <Label>Select Time *</Label>
        <Input
          type="time"
          value={selectedTime}
          onChange={(e) => setSelectedTime(e.target.value)}
        />
      </div>

      {/* Duration Selection */}
      <div className="space-y-2">
        <Label>Duration *</Label>
        <Select value={duration.toString()} onValueChange={(v) => setDuration(parseInt(v))}>
          <SelectTrigger>
            <SelectValue placeholder="Select duration" />
          </SelectTrigger>
          <SelectContent>
            {DURATION_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value.toString()}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Platform Selection */}
      <div className="space-y-2">
        <Label>Meeting Platform *</Label>
        <Select value={platform} onValueChange={(v) => setPlatform(v as MeetingPlatform)}>
          <SelectTrigger>
            <SelectValue placeholder="Select platform" />
          </SelectTrigger>
          <SelectContent>
            {PLATFORM_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.icon} {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label>Additional Notes</Label>
        <Textarea
          placeholder="Any topics you'd like to cover, questions to discuss..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
        />
      </div>

      {/* Info Banner */}
      <div className="p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
        <p className="flex items-center gap-1">
          <ExternalLink className="w-4 h-4" />
          A meeting link will be generated and shared with both of you.
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button variant="outline" onClick={onBack} className="flex-1">
          Back
        </Button>
        <Button onClick={handleSchedule} disabled={isSubmitting || !selectedDate} className="flex-1">
          {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Schedule Meeting
        </Button>
      </div>
    </div>
  );
}
