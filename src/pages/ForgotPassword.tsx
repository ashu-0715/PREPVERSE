import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { GraduationCap, ArrowLeft, Mail } from "lucide-react";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const navigate = useNavigate();

  const handleSendReset = async (e: React.FormEvent) => {
    e.preventDefault();

    const emailRegex = /^[^\s@]+@rmd\.ac\.in$/i;
    if (!emailRegex.test(email)) {
      toast.error("Please use your RMD college email (@rmd.ac.in)");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      setSent(true);
      toast.success("Password reset link sent! Check your email inbox.");
    } catch (error: any) {
      toast.error(error.message || "Failed to send reset link");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-hero px-4">
      <Card className="w-full max-w-md p-8 shadow-elegant">
        <div className="flex items-center justify-center mb-6">
          <GraduationCap className="w-10 h-10 text-primary mr-2" />
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            PrepVerse
          </h1>
        </div>

        <button
          onClick={() => navigate("/auth")}
          className="flex items-center text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Login
        </button>

        {!sent ? (
          <>
            <div className="flex items-center justify-center mb-4">
              <Mail className="w-12 h-12 text-primary" />
            </div>
            <h2 className="text-2xl font-semibold text-center mb-2">Forgot Password?</h2>
            <p className="text-muted-foreground text-center mb-6">
              Enter your email and we'll send you a password reset link
            </p>
            <form onSubmit={handleSendReset} className="space-y-4">
              <div>
                <Label htmlFor="email">College Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="mt-1"
                  placeholder="yourname@rmd.ac.in"
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Sending..." : "Send Reset Link"}
              </Button>
            </form>
          </>
        ) : (
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center mb-4">
              <Mail className="w-12 h-12 text-primary" />
            </div>
            <h2 className="text-2xl font-semibold">Check Your Email</h2>
            <p className="text-muted-foreground">
              We've sent a password reset link to <strong>{email}</strong>. Click the link in the email to reset your password.
            </p>
            <Button variant="outline" onClick={() => { setSent(false); setEmail(""); }} className="mt-4">
              Send Again
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};

export default ForgotPassword;
