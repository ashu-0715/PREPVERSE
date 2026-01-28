import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  BookOpen,
  TrendingUp,
  Users,
  FileText,
  Award,
  LogOut,
  Target,
} from "lucide-react";

const Dashboard = () => {
  const [profile, setProfile] = useState<any>(null);
  const [badges, setBadges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }

    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();

    setProfile(profileData);

    const { data: badgesData } = await supabase
      .from("user_badges")
      .select("*, badges(*)")
      .eq("user_id", session.user.id);

    setBadges(badgesData || []);
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const modules = [
    {
      title: "Career Guidance",
      description: "Find your ideal career path",
      icon: Target,
      path: "/career",
      color: "bg-gradient-to-br from-purple-500 to-pink-500",
    },
    {
      title: "Tech Tracker",
      description: "Track your learning progress",
      icon: TrendingUp,
      path: "/tracker",
      color: "bg-gradient-to-br from-blue-500 to-cyan-500",
    },
    {
      title: "Notes Sharing",
      description: "Access and share study materials",
      icon: FileText,
      path: "/notes",
      color: "bg-gradient-to-br from-green-500 to-emerald-500",
    },
    {
      title: "SkillSwap",
      description: "Learn and teach with peers",
      icon: Users,
      path: "/skillswap",
      color: "bg-gradient-to-br from-orange-500 to-red-500",
    },
    {
      title: "Exam Support",
      description: "Practice for government exams",
      icon: BookOpen,
      path: "/exam",
      color: "bg-gradient-to-br from-indigo-500 to-purple-500",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Award className="w-8 h-8 text-primary" />
            <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              PrepVerse
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button onClick={handleLogout} variant="outline" size="sm">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <Card className="p-6 mb-8 bg-gradient-card shadow-card">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-3xl font-bold mb-2">
                Welcome back, {profile?.full_name}!
              </h2>
              <p className="text-muted-foreground">
                Continue your learning journey today
              </p>
              <div className="flex items-center gap-4 mt-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🔥</span>
                  <span className="font-semibold">{profile?.streak_days} day streak</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              {badges.slice(0, 3).map((badge) => (
                <div
                  key={badge.id}
                  className="text-3xl"
                  title={badge.badges.description}
                >
                  {badge.badges.icon}
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((module) => (
            <Card
              key={module.path}
              className="group cursor-pointer hover:shadow-elegant transition-all duration-300 hover:-translate-y-1 overflow-hidden"
              onClick={() => navigate(module.path)}
            >
              <div className={`${module.color} p-6 text-white`}>
                <module.icon className="w-12 h-12 mb-4" />
                <h3 className="text-xl font-semibold mb-2">{module.title}</h3>
                <p className="text-white/90 text-sm">{module.description}</p>
              </div>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
