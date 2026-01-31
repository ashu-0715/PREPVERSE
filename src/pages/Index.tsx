import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  GraduationCap,
  Target,
  TrendingUp,
  Users,
  FileText,
  BookOpen,
  Award,
  Sparkles,
} from "lucide-react";
import heroImage from "@/assets/hero-image.jpg";
import FoundersSection from "@/components/FoundersSection";

const Index = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Target,
      title: "Career Guidance",
      description: "Discover your ideal career path with personalized assessments and roadmaps.",
      gradient: "from-purple-500 to-pink-500",
    },
    {
      icon: TrendingUp,
      title: "Tech Progress Tracker",
      description: "Visualize your learning journey with charts, goals, and milestones.",
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      icon: FileText,
      title: "Notes Sharing",
      description: "Access quality study materials and share your own notes with peers.",
      gradient: "from-green-500 to-emerald-500",
    },
    {
      icon: Users,
      title: "SkillSwap Community",
      description: "Learn from others while teaching what you know best.",
      gradient: "from-orange-500 to-red-500",
    },
    {
      icon: BookOpen,
      title: "Exam Support",
      description: "Practice with MCQs, flashcards, and timed quizzes for government exams.",
      gradient: "from-indigo-500 to-purple-500",
    },
    {
      icon: Award,
      title: "Gamification",
      description: "Earn badges, maintain streaks, and track your achievements.",
      gradient: "from-yellow-500 to-orange-500",
    },
  ];


  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-8 h-8 text-primary" />
            <span className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              PrepVerse
            </span>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => navigate("/auth")}>
              Login
            </Button>
            <Button onClick={() => navigate("/auth")}>
              Get Started
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero opacity-90" />
        <div className="container mx-auto px-4 py-20 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-white">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full mb-6">
                <Sparkles className="w-4 h-4" />
                <span className="text-sm font-medium">All-in-One Learning Platform</span>
              </div>
              <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
                Your Ultimate Student Survival Kit
              </h1>
              <p className="text-xl mb-8 text-white/90">
                Unify academic preparation, career guidance, skill exchange, and notes sharing in one powerful platform.
              </p>
              <div className="flex gap-4">
                <Button size="lg" variant="secondary" onClick={() => navigate("/auth")}>
                  Start Learning Free
                </Button>
                <Button size="lg" variant="outline" className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20">
                  Explore Features
                </Button>
              </div>
            </div>
            <div className="relative">
              <img
                src={heroImage}
                alt="Students learning together"
                className="rounded-2xl shadow-elegant"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Everything You Need to Succeed</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              A comprehensive toolkit designed specifically for students who want to excel
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="p-6 hover:shadow-elegant transition-all duration-300 hover:-translate-y-2 group"
              >
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Founders Section */}
      <FoundersSection />

      {/* CTA Section */}
      <section className="py-20 bg-gradient-hero">
        <div className="container mx-auto px-4 text-center text-white">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Transform Your Learning Journey?
          </h2>
          <p className="text-xl mb-8 text-white/90 max-w-2xl mx-auto">
            Join thousands of students already using PrepVerse to achieve their academic and career goals.
          </p>
          <Button size="lg" variant="secondary" onClick={() => navigate("/auth")}>
            Join Now – It's Free!
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; 2025 PrepVerse. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
