import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { GraduationCap, User, BookOpen, Shield } from "lucide-react";

type UserRole = "student" | "faculty";
type LoginType = "student" | "faculty" | "admin";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<UserRole>("student");
  const [loginType, setLoginType] = useState<LoginType>("student");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@rmd\.ac\.in$/i;
    return emailRegex.test(email);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateEmail(email)) {
      toast.error("Please use your RMD college email (@rmd.ac.in)");
      return;
    }
    
    setLoading(true);

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        
        if (data.user) {
          // Check user role for admin login
          if (loginType === "admin") {
            const { data: roleData, error: roleError } = await supabase
              .from("user_roles")
              .select("role")
              .eq("user_id", data.user.id)
              .maybeSingle();

            if (roleError || roleData?.role !== "admin") {
              await supabase.auth.signOut();
              toast.error("Access denied. Admin privileges required.");
              return;
            }
          }

          // Track login session and activity
          await supabase.from("user_sessions").insert({
            user_id: data.user.id,
            is_active: true,
          });
          await supabase.from("user_activity").insert({
            user_id: data.user.id,
            action: loginType === "admin" ? "admin_login" : "login",
            details: { timestamp: new Date().toISOString() },
          });
          
          toast.success(loginType === "admin" ? "Welcome, Admin!" : "Welcome back!");
          navigate(loginType === "admin" ? "/admin" : "/dashboard");
        }
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
            emailRedirectTo: `${window.location.origin}/dashboard`,
          },
        });
        if (error) throw error;
        
        // Insert user role after signup
        if (data.user) {
          const { error: roleError } = await supabase
            .from("user_roles")
            .insert({ user_id: data.user.id, role });
          
          if (roleError) {
            console.error("Error setting role:", roleError);
          }
        }
        
        toast.success("Account created! You can now log in.");
        navigate("/dashboard");
      }
    } catch (error: any) {
      toast.error(error.message || "Authentication failed");
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

        <h2 className="text-2xl font-semibold text-center mb-6">
          {isLogin ? "Welcome Back" : "Join PrepVerse"}
        </h2>

        {/* Login Type Selection for Login */}
        {isLogin && (
          <div className="mb-6">
            <Label className="mb-3 block text-center">Login as</Label>
            <div className="flex gap-3 mb-3">
              <button
                type="button"
                onClick={() => setLoginType("student")}
                className={`flex-1 p-3 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-2 ${
                  loginType === "student"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <BookOpen className="w-5 h-5" />
                <span className="font-medium text-sm">Student</span>
              </button>
              <button
                type="button"
                onClick={() => setLoginType("faculty")}
                className={`flex-1 p-3 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-2 ${
                  loginType === "faculty"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <User className="w-5 h-5" />
                <span className="font-medium text-sm">Faculty</span>
              </button>
              <button
                type="button"
                onClick={() => setLoginType("admin")}
                className={`flex-1 p-3 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-2 ${
                  loginType === "admin"
                    ? "border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                    : "border-amber-200 hover:border-amber-400 text-amber-600/70 dark:border-amber-800 dark:hover:border-amber-600 dark:text-amber-400/70"
                }`}
              >
                <Shield className="w-5 h-5" />
                <span className="font-medium text-sm">Admin</span>
              </button>
            </div>
            {loginType === "admin" && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                <Shield className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  Admin access is restricted to authorized personnel only.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Role Selection for Signup */}
        {!isLogin && (
          <div className="mb-6">
            <Label className="mb-3 block text-center">I am a</Label>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setRole("student")}
                className={`flex-1 p-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-2 ${
                  role === "student"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <BookOpen className="w-6 h-6" />
                <span className="font-medium">Student</span>
              </button>
              <button
                type="button"
                onClick={() => setRole("faculty")}
                className={`flex-1 p-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-2 ${
                  role === "faculty"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <User className="w-6 h-6" />
                <span className="font-medium">Faculty</span>
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          {!isLogin && (
            <div>
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required={!isLogin}
                className="mt-1"
                placeholder="Enter your full name"
              />
            </div>
          )}

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
            <p className="text-xs text-muted-foreground mt-1">
              Only @rmd.ac.in emails are accepted
            </p>
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="mt-1"
              placeholder="Enter your password"
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading ? "Loading..." : isLogin ? "Sign In" : "Sign Up"}
          </Button>
        </form>

        <div className="mt-4 text-center space-y-2">
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setLoginType("student");
            }}
            className="text-primary hover:underline block w-full"
          >
            {isLogin
              ? "Don't have an account? Sign up"
              : "Already have an account? Sign in"}
          </button>
          {isLogin && (
            <button
              type="button"
              onClick={() => navigate("/forgot-password")}
              className="text-muted-foreground hover:text-primary hover:underline text-sm"
            >
              Forgot password?
            </button>
          )}
        </div>
      </Card>
    </div>
  );
};

export default Auth;
