import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Shield, Copy, Check } from "lucide-react";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  const adminLoginUrl = `${window.location.origin}/admin-login`;

  useEffect(() => {
    // Check if already logged in as admin
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .maybeSingle();
        
        if (roleData?.role === "admin") {
          navigate("/admin");
        }
      }
    };
    checkAdmin();
  }, [navigate]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(adminLoginUrl);
    setCopied(true);
    toast.success("Admin login link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        // Check if user is admin
        const { data: roleData, error: roleError } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", data.user.id)
          .maybeSingle();

        if (roleError) {
          await supabase.auth.signOut();
          throw new Error("Error checking permissions");
        }

        if (roleData?.role !== "admin") {
          await supabase.auth.signOut();
          toast.error("Access denied. Admin only.");
          return;
        }

        // Track admin login
        await supabase.from("user_sessions").insert({
          user_id: data.user.id,
          is_active: true,
        });

        await supabase.from("user_activity").insert({
          user_id: data.user.id,
          action: "admin_login",
          details: { timestamp: new Date().toISOString() },
        });

        toast.success("Welcome, Admin!");
        navigate("/admin");
      }
    } catch (error: any) {
      toast.error(error.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 px-4">
      <Card className="w-full max-w-md p-8 shadow-2xl bg-card/95 backdrop-blur">
        <div className="flex items-center justify-center mb-6">
          <Shield className="w-12 h-12 text-primary" />
        </div>
        
        <h1 className="text-3xl font-bold text-center mb-2 bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
          Admin Portal
        </h1>
        <p className="text-muted-foreground text-center mb-6">
          PrepVerse Administration
        </p>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <Label htmlFor="email">Admin Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1"
              placeholder="admin@rmd.ac.in"
            />
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1"
              placeholder="Enter your password"
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Signing in..." : "Sign In as Admin"}
          </Button>
        </form>

        <div className="mt-6 pt-6 border-t">
          <p className="text-sm text-muted-foreground mb-3 text-center">
            Share this admin login link:
          </p>
          <div className="flex items-center gap-2">
            <Input
              value={adminLoginUrl}
              readOnly
              className="text-xs"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={handleCopyLink}
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => navigate("/auth")}
            className="text-primary hover:underline text-sm"
          >
            Back to regular login
          </button>
        </div>
      </Card>
    </div>
  );
};

export default AdminLogin;
