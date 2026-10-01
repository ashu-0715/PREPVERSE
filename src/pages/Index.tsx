import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Target, FileText, Users, BookOpen, Gamepad2, GraduationCap, ArrowRight } from "lucide-react";
import heroImage from "@/assets/hero-image.jpg";
import FoundersSection from "@/components/FoundersSection";
import LiveStatsSection from "@/components/LiveStatsSection";
import { ThemeToggle } from "@/components/ThemeToggle";

const features = [
  { icon: Target, title: "Figure out your career", description: "Explore paths, see the skills each needs, and plan your next step." },
  { icon: FileText, title: "Notes from real students", description: "Find notes for your subjects, or share yours and help a junior." },
  { icon: Users, title: "SkillSwap", description: "Know something useful? Teach someone. Stuck? Ask a student." },
  { icon: BookOpen, title: "GATE & exam prep", description: "Subject-wise prep with an AI mentor that actually explains things." },
  { icon: Gamepad2, title: "Revise by playing", description: "Upload your notes and turn them into a quick revision game." },
];

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 border-b bg-background/90 backdrop-blur">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-extrabold text-lg">
            <span className="w-8 h-8 rounded-xl bg-primary text-primary-foreground grid place-items-center">
              <GraduationCap className="w-4 h-4" />
            </span>
            PrepVerse
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" onClick={() => navigate("/auth")}>Log in</Button>
            <Button className="lift" onClick={() => navigate("/auth")}>Get started</Button>
          </div>
        </div>
      </nav>

      <section className="bg-gradient-hero">
        <div className="container mx-auto px-4 py-16 md:py-24 grid lg:grid-cols-[1.1fr_1fr] gap-12 items-center">
          <div>
            <span className="inline-block text-sm font-semibold text-secondary bg-secondary/10 px-3 py-1 rounded-full mb-6">
              Made by students, for students
            </span>
            <h1 className="text-4xl md:text-6xl font-extrabold leading-[1.05]">
              Your college journey, <span className="text-primary">a little less confusing.</span>
            </h1>
            <p className="text-lg text-muted-foreground mt-6 max-w-xl">
              Learn skills, find opportunities, track your progress, and figure out what to do next.
            </p>
            <div className="flex flex-wrap gap-3 mt-8">
              <Button size="lg" className="lift" onClick={() => navigate("/auth")}>
                Explore PrepVerse <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
              <Button size="lg" variant="outline" className="lift" onClick={() => navigate("/dashboard")}>
                Continue learning
              </Button>
            </div>
          </div>
          <img src={heroImage} alt="Students learning together" className="rounded-3xl shadow-elegant w-full object-cover aspect-[4/3]" />
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-4 max-w-5xl">
          <h2 className="text-3xl md:text-4xl font-bold">What's inside</h2>
          <p className="text-muted-foreground mt-2 mb-10">Everything you kept googling in second year, in one place.</p>
          <div className="divide-y border-y">
            {features.map((f) => (
              <div key={f.title} className="py-6 flex gap-5 items-start group">
                <span className="w-11 h-11 rounded-xl bg-primary/10 text-primary grid place-items-center shrink-0 group-hover:scale-105 transition-transform">
                  <f.icon className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-lg font-semibold">{f.title}</h3>
                  <p className="text-muted-foreground">{f.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <LiveStatsSection />
      <FoundersSection />

      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="rounded-3xl bg-primary text-primary-foreground p-10 md:p-16 text-center">
            <h2 className="text-3xl md:text-5xl font-extrabold">Ready when you are.</h2>
            <p className="mt-4 opacity-90 max-w-xl mx-auto">Join with your college email and start figuring things out, one step at a time.</p>
            <Button size="lg" variant="secondary" className="lift mt-8" onClick={() => navigate("/auth")}>
              Join now — it's free
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        © 2026 PrepVerse. Built with care for students.
      </footer>
    </div>
  );
};

export default Index;
