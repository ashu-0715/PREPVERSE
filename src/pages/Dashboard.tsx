import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { EditProfileDialog } from "@/components/EditProfileDialog";
import { AppNav } from "@/components/AppNav";
import {
  BookOpen, FileText, Users, Compass, Gamepad2, Crown, ArrowRight,
  Code2, Brain, Cloud, Shield, Palette, Flame, Bookmark,
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

const careerPaths = [
  { title: "Software Developer", icon: Code2, desc: "Build apps and products people use daily.", skills: ["DSA", "Java/Python", "Git"] },
  { title: "Data / AI", icon: Brain, desc: "Turn data into insight and smart systems.", skills: ["Python", "Statistics", "ML"] },
  { title: "Cloud", icon: Cloud, desc: "Run the infrastructure behind the internet.", skills: ["Linux", "AWS/Azure", "Networking"] },
  { title: "Cybersecurity", icon: Shield, desc: "Keep systems and people safe online.", skills: ["Networks", "Linux", "Ethical hacking"] },
  { title: "Product / Design", icon: Palette, desc: "Shape what gets built, and how it feels.", skills: ["UX", "Figma", "Communication"] },
];

const Dashboard = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [badges, setBadges] = useState<any[]>([]);
  const [noteCount, setNoteCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return navigate("/auth");
      const [{ data: p }, { data: b }, { count }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", session.user.id).single(),
        supabase.from("user_badges").select("*, badges(*)").eq("user_id", session.user.id),
        supabase.from("notes").select("id", { count: "exact", head: true }),
      ]);
      setProfile(p);
      setBadges(b || []);
      setNoteCount(count ?? 0);
      setLoading(false);
    })();
  }, []);

  const handleLogout = async () => {
    if (profile?.id) {
      await supabase.from("user_sessions")
        .update({ is_active: false, last_active_at: new Date().toISOString() })
        .eq("user_id", profile.id);
    }
    await supabase.auth.signOut();
    toast.success("See you soon 👋");
    navigate("/");
  };

  const firstName = profile?.full_name?.split(" ")[0] || "there";
  const initials = profile?.full_name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  const skills = profile?.skills || [];

  const today = [
    { label: "Continue learning", title: "GATE CSE prep", sub: "Subjects, AI mentor & more", icon: BookOpen, to: "/exam" },
    { label: "Fresh resources", title: noteCount === null ? "…" : `${noteCount} notes shared`, sub: "Browse what seniors uploaded", icon: FileText, to: "/notes" },
    { label: "Quick revision", title: "Run & Revise", sub: "Turn your notes into a game", icon: Gamepad2, to: "/gamezone" },
    { label: "Community", title: "SkillSwap", sub: "Teach something, learn something", icon: Users, to: "/skillswap" },
  ];

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <AppNav onLogout={handleLogout} />

      <main className="container mx-auto px-4 py-8 md:py-12 space-y-14 max-w-6xl">
        {/* Greeting */}
        <section className="flex flex-col md:flex-row md:items-center gap-6 justify-between">
          {loading ? (
            <Skeleton className="h-20 w-72" />
          ) : (
            <div className="flex items-center gap-4">
              <Avatar className="w-16 h-16 ring-4 ring-muted">
                <AvatarImage src={profile?.avatar_url} />
                <AvatarFallback className="bg-primary/10 text-primary font-bold">{initials}</AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-3xl md:text-4xl font-extrabold">Hey {firstName} 👋</h1>
                <p className="text-muted-foreground mt-1">Here's what's waiting for you today.</p>
                <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1 font-semibold text-primary">
                    <Flame className="w-4 h-4" /> {profile?.streak_days || 0} day streak
                  </span>
                  {profile?.department && <span>· {profile.department}</span>}
                  {profile?.year_of_study && <span>· {profile.year_of_study}</span>}
                  {badges.slice(0, 3).map((b) => (
                    <span key={b.id} title={b.badges.description}>{b.badges.icon}</span>
                  ))}
                </div>
              </div>
            </div>
          )}
          <div className="flex gap-2">
            {profile && <EditProfileDialog profile={profile} onProfileUpdate={setProfile} />}
            {!(profile as any)?.is_premium ? (
              <Button variant="outline" size="sm" onClick={() => navigate("/premium")}>
                <Crown className="w-4 h-4 mr-2" /> Go Premium
              </Button>
            ) : (
              <Badge className="gap-1 bg-accent text-accent-foreground"><Crown className="w-3 h-3" /> Premium</Badge>
            )}
          </div>
        </section>

        {/* Today */}
        <section>
          <h2 className="text-xl font-bold mb-4">Today</h2>
          <div className="divide-y rounded-2xl border bg-card overflow-hidden">
            {today.map((t) => (
              <button
                key={t.to}
                onClick={() => navigate(t.to)}
                className="w-full flex items-center gap-4 p-4 md:p-5 text-left hover:bg-muted/60 transition-colors group"
              >
                <span className="w-11 h-11 rounded-xl bg-primary/10 text-primary grid place-items-center shrink-0">
                  <t.icon className="w-5 h-5" />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">{t.label}</p>
                  <p className="font-semibold">{t.title}</p>
                  <p className="text-sm text-muted-foreground truncate">{t.sub}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 group-hover:text-primary transition-all" />
              </button>
            ))}
          </div>
        </section>

        {/* Progress */}
        <section className="grid md:grid-cols-[1fr_1.4fr] gap-8 items-start">
          <div>
            <h2 className="text-2xl font-bold">Your progress</h2>
            <p className="text-muted-foreground mt-2">Keep going — consistency matters more than speed.</p>
          </div>
          {skills.length > 0 ? (
            <div className="rounded-2xl border bg-card p-6">
              <p className="font-semibold mb-4">Skills you're building 🚀</p>
              <div className="flex flex-wrap gap-2">
                {skills.map((s) => (
                  <span key={s} className="px-3 py-1.5 rounded-full bg-secondary/10 text-secondary text-sm font-medium">{s}</span>
                ))}
              </div>
              <p className="text-sm text-muted-foreground mt-4">Practice in Learn or Game Zone to start tracking real progress here.</p>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed p-6 text-center">
              <p className="font-semibold">Nothing tracked yet 🌱</p>
              <p className="text-sm text-muted-foreground mt-1">Add a few skills to your profile and we'll keep them here for you.</p>
            </div>
          )}
        </section>

        {/* Career paths */}
        <section>
          <div className="flex items-end justify-between mb-5">
            <div>
              <h2 className="text-2xl font-bold">Where do you want to go?</h2>
              <p className="text-muted-foreground mt-1">Pick a path and see what it takes.</p>
            </div>
          </div>
          <div className="flex md:grid md:grid-cols-5 gap-4 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 snap-x">
            {careerPaths.map((c) => (
              <button
                key={c.title}
                onClick={() => navigate("/career")}
                className="lift snap-start min-w-[220px] md:min-w-0 text-left rounded-2xl border bg-card p-5 flex flex-col"
              >
                <span className="w-10 h-10 rounded-xl bg-accent/20 text-foreground grid place-items-center mb-4">
                  <c.icon className="w-5 h-5" />
                </span>
                <p className="font-bold">{c.title}</p>
                <p className="text-sm text-muted-foreground mt-1 flex-1">{c.desc}</p>
                <div className="flex flex-wrap gap-1 mt-3">
                  {c.skills.map((s) => (
                    <span key={s} className="text-[11px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{s}</span>
                  ))}
                </div>
                <span className="text-sm font-semibold text-primary mt-4">Explore path →</span>
              </button>
            ))}
          </div>
        </section>

        {/* Opportunities */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Opportunities you might like 👀</h2>
          <div className="rounded-2xl border border-dashed p-8 text-center">
            <Bookmark className="w-6 h-6 mx-auto text-muted-foreground" />
            <p className="font-semibold mt-3">No opportunities posted yet</p>
            <p className="text-sm text-muted-foreground mt-1">Internships, hackathons and workshops will show up here as soon as they're added.</p>
          </div>
        </section>

        {/* All spaces */}
        <section>
          <h2 className="text-xl font-bold mb-4">Everything in PrepVerse</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { t: "Learn (GATE)", d: "Subjects, PYQs, AI mentor", i: BookOpen, to: "/exam" },
              { t: "Notes", d: "Find and share study material", i: FileText, to: "/notes" },
              { t: "SkillSwap", d: "Teach and learn with peers", i: Users, to: "/skillswap" },
              { t: "Career", d: "Discover your path", i: Compass, to: "/career" },
              { t: "Game Zone", d: "Revise by playing", i: Gamepad2, to: "/gamezone" },
              { t: "Premium", d: "Unlock exclusive notes", i: Crown, to: "/premium" },
            ].map((m) => (
              <button key={m.to} onClick={() => navigate(m.to)} className="lift text-left rounded-2xl border bg-card p-4 flex items-start gap-3">
                <m.i className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-sm md:text-base">{m.t}</p>
                  <p className="text-xs md:text-sm text-muted-foreground">{m.d}</p>
                </div>
              </button>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
