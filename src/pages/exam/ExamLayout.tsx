import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  LayoutDashboard, BookOpen, FileQuestion, ClipboardCheck, MessageCircle,
  Brain, BarChart3, CalendarDays, ArrowLeft, Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const nav = [
  { to: "/exam", end: true, label: "Dashboard", icon: LayoutDashboard },
  { to: "/exam/subjects", label: "Subjects", icon: BookOpen },
  { to: "/exam/pyqs", label: "PYQs", icon: FileQuestion },
  { to: "/exam/mocks", label: "Mocks", icon: ClipboardCheck },
  { to: "/exam/mentor", label: "AI Mentor", icon: MessageCircle },
  { to: "/exam/revision", label: "Revision", icon: Brain },
  { to: "/exam/planner", label: "Planner", icon: CalendarDays },
  { to: "/exam/analytics", label: "Analytics", icon: BarChart3 },
];

export default function ExamLayout() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) navigate("/auth");
      else setLoading(false);
    });
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background dark">
      <header className="sticky top-0 z-40 border-b border-border/40 backdrop-blur-xl bg-background/70">
        <div className="container mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Dashboard
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                GATE CSE Exam Support
              </h1>
              <p className="text-[10px] text-muted-foreground -mt-0.5">AI-powered preparation ecosystem</p>
            </div>
          </div>
        </div>
        <nav className="container mx-auto px-2 pb-2 flex gap-1 overflow-x-auto scrollbar-thin">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? "bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-foreground border border-indigo-500/30"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`
              }
            >
              <item.icon className="w-3.5 h-3.5" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="container mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}