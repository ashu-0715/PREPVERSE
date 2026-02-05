import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { GraduationCap, ArrowLeft, Mail, KeyRound, Lock } from "lucide-react";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

type Step = "email" | "code" | "password";

const ForgotPassword = () => {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const emailRegex = /^[^\s@]+@rmd\.ac\.in$/i;
    if (!emailRegex.test(email)) {
      toast.error("Please use your RMD college email (@rmd.ac.in)");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-reset-code", {
        body: { email },
      });

      if (error) throw error;

      toast.success("If the email exists, a reset code has been sent");
      setStep("code");
    } catch (error: any) {
      toast.error(error.message || "Failed to send reset code");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (code.length !== 6) {
      toast.error("Please enter the 6-character code");
      return;
    }

    setStep("password");
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("verify-reset-code", {
        body: { email, code, newPassword },
      });

      if (error) throw error;

      toast.success("Password updated successfully! Please sign in.");
      navigate("/auth");
    } catch (error: any) {
      toast.error(error.message || "Failed to reset password");
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
          onClick={() => step === "email" ? navigate("/auth") : setStep(step === "code" ? "email" : "code")}
          className="flex items-center text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back
        </button>

        {step === "email" && (
          <>
            <div className="flex items-center justify-center mb-4">
              <Mail className="w-12 h-12 text-primary" />
            </div>
            <h2 className="text-2xl font-semibold text-center mb-2">Forgot Password?</h2>
            <p className="text-muted-foreground text-center mb-6">
              Enter your email and we'll send you a 6-character code
            </p>
            <form onSubmit={handleSendCode} className="space-y-4">
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
                {loading ? "Sending..." : "Send Reset Code"}
              </Button>
            </form>
          </>
        )}

        {step === "code" && (
          <>
            <div className="flex items-center justify-center mb-4">
              <KeyRound className="w-12 h-12 text-primary" />
            </div>
            <h2 className="text-2xl font-semibold text-center mb-2">Enter Code</h2>
            <p className="text-muted-foreground text-center mb-6">
              We sent a 6-character code to {email}
            </p>
            <form onSubmit={handleVerifyCode} className="space-y-6">
              <div className="flex justify-center">
                <InputOTP
                  maxLength={6}
                  value={code}
                  onChange={(value) => setCode(value.toUpperCase())}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
              <Button type="submit" className="w-full" disabled={code.length !== 6}>
                Verify Code
              </Button>
            </form>
          </>
        )}

        {step === "password" && (
          <>
            <div className="flex items-center justify-center mb-4">
              <Lock className="w-12 h-12 text-primary" />
            </div>
            <h2 className="text-2xl font-semibold text-center mb-2">New Password</h2>
            <p className="text-muted-foreground text-center mb-6">
              Create a strong password for your account
            </p>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  className="mt-1"
                  placeholder="Enter new password"
                />
              </div>
              <div>
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  className="mt-1"
                  placeholder="Confirm new password"
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Updating..." : "Reset Password"}
              </Button>
            </form>
          </>
        )}
      </Card>
    </div>
  );
};

export default ForgotPassword;
