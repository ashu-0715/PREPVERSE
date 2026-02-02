import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { MessageCircle, Calendar, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SkillPost } from "@/types/skillswap";
import { MeetingScheduler } from "./MeetingScheduler";

interface ConnectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post: SkillPost;
  currentUserId: string | null;
}

export function ConnectionDialog({ open, onOpenChange, post, currentUserId }: ConnectionDialogProps) {
  const [step, setStep] = useState<"choice" | "chat" | "schedule">("choice");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleStartChat = async () => {
    if (!currentUserId) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("skill_connections").insert({
        post_id: post.id,
        requester_id: currentUserId,
        post_owner_id: post.user_id,
        connection_type: "chat",
        message: message || null,
        status: "pending",
      });

      if (error) throw error;

      toast.success("Connection request sent! You can start chatting once they accept.");
      onOpenChange(false);
      setStep("choice");
      setMessage("");
    } catch (error: any) {
      console.error("Error creating connection:", error);
      toast.error(error.message || "Failed to send connection request");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMeetingScheduled = () => {
    toast.success("Meeting scheduled successfully!");
    onOpenChange(false);
    setStep("choice");
    setMessage("");
  };

  const renderContent = () => {
    switch (step) {
      case "choice":
        return (
          <div className="space-y-4">
            <DialogDescription className="text-center">
              How would you like to connect with {post.profile?.full_name || "this student"}?
            </DialogDescription>

            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                className="h-24 flex-col gap-2"
                onClick={() => setStep("chat")}
              >
                <MessageCircle className="w-8 h-8" />
                <span>Start with Chat</span>
              </Button>

              <Button
                variant="outline"
                className="h-24 flex-col gap-2"
                onClick={() => setStep("schedule")}
              >
                <Calendar className="w-8 h-8" />
                <span>Schedule Meeting</span>
              </Button>
            </div>

            <Button variant="ghost" className="w-full" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </div>
        );

      case "chat":
        return (
          <div className="space-y-4">
            <DialogDescription>
              Send a message to introduce yourself and explain why you'd like to connect.
            </DialogDescription>

            <div className="space-y-2">
              <Label>Your Message (optional)</Label>
              <Textarea
                placeholder="Hi! I saw your post about... I'm interested in..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
              />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep("choice")} className="flex-1">
                Back
              </Button>
              <Button onClick={handleStartChat} disabled={isSubmitting} className="flex-1">
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Send Request
              </Button>
            </div>
          </div>
        );

      case "schedule":
        return (
          <MeetingScheduler
            post={post}
            currentUserId={currentUserId}
            onBack={() => setStep("choice")}
            onSuccess={handleMeetingScheduled}
          />
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {step === "choice" && "Connect"}
            {step === "chat" && "Start a Conversation"}
            {step === "schedule" && "Schedule a Meeting"}
          </DialogTitle>
        </DialogHeader>
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
}
