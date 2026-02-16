import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, Crown, Check, Sparkles } from "lucide-react";
import paymentQR from "@/assets/payment-qr.png";

const Premium = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    checkPremiumStatus();
  }, []);

  const checkPremiumStatus = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }
    setUser(session.user);

    const { data: profile } = await supabase
      .from("profiles")
      .select("is_premium")
      .eq("id", session.user.id)
      .single();

    setIsPremium(profile?.is_premium || false);
    setLoading(false);
  };

  const handleVerifyPayment = async () => {
    if (!user) return;
    setVerifying(true);

    try {
      // Record payment
      const { error: paymentError } = await supabase.from("payments").insert({
        user_id: user.id,
        amount: 199,
        status: "completed",
        payment_method: "qr",
        payment_type: "premium",
      });
      if (paymentError) throw paymentError;

      // Upgrade profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          is_premium: true,
          premium_activated_at: new Date().toISOString(),
        })
        .eq("id", user.id);
      if (profileError) throw profileError;

      setShowSuccess(true);
      setIsPremium(true);

      setTimeout(() => {
        navigate("/dashboard");
      }, 3000);
    } catch (error: any) {
      toast.error(error.message || "Verification failed");
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  // Success animation
  if (showSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-400/20 via-amber-500/20 to-orange-500/20">
        <div className="text-center animate-in zoom-in-50 duration-500">
          <div className="text-8xl mb-6 animate-bounce">👑</div>
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-yellow-500 to-amber-600 bg-clip-text text-transparent">
            WOAHH 😭🔥
          </h1>
          <h2 className="text-3xl font-bold mb-2">YOU'RE NOW A PREMIUM USER!</h2>
          <p className="text-muted-foreground">Redirecting to dashboard...</p>
          <div className="mt-6 flex justify-center gap-2">
            {[...Array(5)].map((_, i) => (
              <Sparkles
                key={i}
                className="w-6 h-6 text-yellow-500 animate-pulse"
                style={{ animationDelay: `${i * 200}ms` }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isPremium) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card shadow-sm">
          <div className="container mx-auto px-4 py-4 flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </Button>
            <h1 className="text-2xl font-bold">Premium</h1>
          </div>
        </header>
        <main className="container mx-auto px-4 py-16 text-center">
          <Crown className="w-20 h-20 mx-auto mb-6 text-yellow-500" />
          <h2 className="text-3xl font-bold mb-4">You're a Premium Member! 👑</h2>
          <p className="text-muted-foreground mb-8">Enjoy all premium features including exclusive notes and publishing capabilities.</p>
          <Button onClick={() => navigate("/notes")}>Browse Premium Notes</Button>
        </main>
      </div>
    );
  }

  const benefits = [
    "View & download premium-only notes",
    "Publish notes as paid content",
    "Access exclusive study materials",
    "Crown badge on your profile",
    "Priority support",
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-yellow-500 to-amber-600 bg-clip-text text-transparent">
            Go Premium
          </h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="p-8 border-2 border-yellow-500/30 bg-gradient-to-br from-yellow-500/5 to-amber-500/5">
          <div className="text-center mb-8">
            <Crown className="w-16 h-16 mx-auto mb-4 text-yellow-500" />
            <h2 className="text-3xl font-bold mb-2">Premium Plan</h2>
            <div className="text-4xl font-bold text-yellow-600 dark:text-yellow-400">
              ₹199
              <span className="text-base font-normal text-muted-foreground ml-2">one-time</span>
            </div>
          </div>

          <div className="space-y-3 mb-8">
            {benefits.map((benefit) => (
              <div key={benefit} className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span>{benefit}</span>
              </div>
            ))}
          </div>

          <div className="border-t pt-8">
            <h3 className="text-lg font-semibold text-center mb-4">Scan to Pay ₹199</h3>
            <div className="flex justify-center mb-4">
              <img
                src={paymentQR}
                alt="Payment QR Code"
                className="w-64 h-64 object-contain rounded-lg border bg-white p-2"
              />
            </div>
            <p className="text-center text-sm text-muted-foreground mb-2">
              UPI ID: aswini0715@okhdfcbank
            </p>
            <p className="text-center text-xs text-muted-foreground mb-6">
              Scan with any UPI app (GPay, PhonePe, Paytm)
            </p>

            <Button
              onClick={handleVerifyPayment}
              disabled={verifying}
              className="w-full bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-white font-semibold py-3"
              size="lg"
            >
              {verifying ? "Verifying..." : "I've Paid / Verify Payment"}
            </Button>
          </div>
        </Card>
      </main>
    </div>
  );
};

export default Premium;
