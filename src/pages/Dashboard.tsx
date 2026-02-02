import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/ThemeToggle";
import { EditProfileDialog } from "@/components/EditProfileDialog";
import {
  BookOpen,
  TrendingUp,
  Users,
  FileText,
  Award,
  LogOut,
  Target,
  MapPin,
  GraduationCap,
} from "lucide-react";

interface Profile {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string;
  bio?: string;
  department?: string;
  year_of_study?: string;
  skills?: string[];
  streak_days?: number;
}

const Dashboard = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
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
    // Mark all user sessions as inactive before logging out
    if (profile?.id) {
      await supabase
        .from("user_sessions")
        .update({ is_active: false, last_active_at: new Date().toISOString() })
        .eq("user_id", profile.id);
    }
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
        {/* Profile Card */}
        <Card className="p-6 mb-8 bg-gradient-card shadow-card">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Avatar and Basic Info */}
            <div className="flex items-start gap-4">
              <Avatar className="w-20 h-20 border-4 border-primary/20">
                <AvatarImage src={profile?.avatar_url} />
                <AvatarFallback className="text-2xl bg-primary/10">
                  {profile?.full_name
                    ?.split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="text-2xl font-bold">{profile?.full_name}</h2>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🔥</span>
                    <span className="font-semibold text-orange-500">
                      {profile?.streak_days || 0} day streak
                    </span>
                  </div>
                </div>
                <p className="text-muted-foreground">{profile?.email}</p>
                
                {/* Department and Year */}
                <div className="flex flex-wrap gap-3 mt-2">
                  {profile?.department && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="w-3 h-3" />
                      {profile.department}
                    </div>
                  )}
                  {profile?.year_of_study && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <GraduationCap className="w-3 h-3" />
                      {profile.year_of_study}
                    </div>
                  )}
                </div>

                {/* Bio */}
                {profile?.bio && (
                  <p className="mt-3 text-sm text-foreground/80">{profile.bio}</p>
                )}

                {/* Skills */}
                {profile?.skills && profile.skills.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {profile.skills.map((skill) => (
                      <Badge key={skill} variant="secondary" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Edit Button and Badges */}
            <div className="flex flex-col items-end gap-4 ml-auto">
              {profile && (
                <EditProfileDialog
                  profile={profile}
                  onProfileUpdate={setProfile}
                />
              )}
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
          </div>
        </Card>

        {/* Modules Grid */}
        <h3 className="text-xl font-semibold mb-4">Explore Modules</h3>
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
