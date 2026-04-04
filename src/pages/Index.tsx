import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  GraduationCap, Target, TrendingUp, Users, FileText, BookOpen, Award,
  Sparkles, Rocket, Brain, Gamepad2, PenTool, Zap, CheckCircle, Star,
  ArrowRight, Github, Twitter, Instagram, Mail,
} from "lucide-react";
import heroIllustration from "@/assets/hero-illustration.png";
import FoundersSection from "@/components/FoundersSection";
import LiveStatsSection from "@/components/LiveStatsSection";
import { motion } from "framer-motion";

const FloatingShape = ({ className, delay = 0 }: { className: string; delay?: number }) => (
  <motion.div
    className={`absolute rounded-full opacity-20 pointer-events-none ${className}`}
    animate={{
      y: [0, -20, 0],
      x: [0, 10, 0],
      rotate: [0, 5, -5, 0],
    }}
    transition={{
      duration: 6 + delay,
      repeat: Infinity,
      ease: "easeInOut",
      delay,
    }}
  />
);

const FloatingIcon = ({ icon: Icon, className, delay = 0 }: { icon: React.ElementType; className: string; delay?: number }) => (
  <motion.div
    className={`absolute opacity-15 pointer-events-none ${className}`}
    animate={{
      y: [0, -15, 0],
      rotate: [0, 10, -10, 0],
    }}
    transition={{
      duration: 5 + delay,
      repeat: Infinity,
      ease: "easeInOut",
      delay,
    }}
  >
    <Icon className="w-8 h-8 text-primary-foreground" />
  </motion.div>
);

const WaveDivider = ({ flip = false }: { flip?: boolean }) => (
  <div className={`w-full overflow-hidden leading-none ${flip ? "rotate-180" : ""}`}>
    <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
      <path
        d="M0 60L48 52C96 44 192 28 288 24C384 20 480 28 576 40C672 52 768 68 864 72C960 76 1056 68 1152 56C1248 44 1344 28 1392 20L1440 12V120H1392C1344 120 1248 120 1152 120C1056 120 960 120 864 120C768 120 672 120 576 120C480 120 384 120 288 120C192 120 96 120 48 120H0V60Z"
        className="fill-background"
      />
    </svg>
  </div>
);

const Index = () => {
  const navigate = useNavigate();

  const features = [
    { icon: Target, title: "Career Guidance", description: "Discover your ideal career path with AI-powered assessments.", gradient: "from-purple-500 via-violet-500 to-fuchsia-500", emoji: "🎯" },
    { icon: TrendingUp, title: "Progress Tracker", description: "Visualize your learning journey with interactive dashboards.", gradient: "from-blue-500 via-cyan-500 to-teal-500", emoji: "📈" },
    { icon: FileText, title: "Notes Sharing", description: "Access & share quality study materials with your peers.", gradient: "from-emerald-500 via-green-500 to-lime-500", emoji: "📝" },
    { icon: Users, title: "SkillSwap", description: "Learn from others while teaching what you know best.", gradient: "from-orange-500 via-amber-500 to-yellow-500", emoji: "🤝" },
    { icon: Gamepad2, title: "Game Zone", description: "Revise your syllabus by literally playing through it.", gradient: "from-pink-500 via-rose-500 to-red-500", emoji: "🎮" },
    { icon: Award, title: "Badges & Streaks", description: "Earn rewards, maintain streaks, and stay motivated.", gradient: "from-indigo-500 via-purple-500 to-violet-500", emoji: "🏆" },
  ];

  const benefits = [
    "AI-powered personalized learning paths",
    "Upload & share notes in seconds",
    "Play quiz games to revise topics",
    "Connect with peers through SkillSwap",
    "Track your progress with visual dashboards",
    "Earn badges and compete on leaderboards",
  ];

  const interactiveCards = [
    { icon: Brain, title: "Practice Tests", desc: "AI-generated quizzes from your notes", gradient: "from-purple-500 to-pink-500", glow: "shadow-[0_0_30px_-5px_hsl(262,83%,58%,0.4)]" },
    { icon: PenTool, title: "Study Planner", desc: "Plan your revision schedule smartly", gradient: "from-blue-500 to-cyan-500", glow: "shadow-[0_0_30px_-5px_hsl(217,91%,60%,0.4)]" },
    { icon: BookOpen, title: "Resources", desc: "Curated materials for every subject", gradient: "from-emerald-500 to-teal-500", glow: "shadow-[0_0_30px_-5px_hsl(150,70%,45%,0.4)]" },
    { icon: FileText, title: "Notes Hub", desc: "Share & discover study notes", gradient: "from-orange-500 to-amber-500", glow: "shadow-[0_0_30px_-5px_hsl(25,95%,60%,0.4)]" },
  ];

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Sticky Navbar with blur */}
      <nav className="sticky top-0 z-50 bg-background/70 backdrop-blur-xl border-b border-border/50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
              PrepVerse
            </span>
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => navigate("/auth")} className="font-medium">
              Login
            </Button>
            <Button
              onClick={() => navigate("/auth")}
              className="bg-gradient-to-r from-primary via-accent to-secondary hover:opacity-90 transition-opacity font-semibold rounded-full px-6"
            >
              Get Started <Rocket className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-hero" />
        
        {/* Floating shapes */}
        <FloatingShape className="w-72 h-72 bg-white/10 top-10 left-10 blur-3xl" delay={0} />
        <FloatingShape className="w-96 h-96 bg-pink-400/10 bottom-10 right-10 blur-3xl" delay={2} />
        <FloatingShape className="w-48 h-48 bg-cyan-400/15 top-1/3 right-1/4 blur-2xl" delay={1} />
        <FloatingShape className="w-32 h-32 bg-yellow-400/10 bottom-1/4 left-1/3 blur-2xl" delay={3} />
        
        {/* Floating education icons */}
        <FloatingIcon icon={BookOpen} className="top-20 right-[15%]" delay={0.5} />
        <FloatingIcon icon={GraduationCap} className="top-32 left-[10%]" delay={1.5} />
        <FloatingIcon icon={PenTool} className="bottom-32 right-[20%]" delay={2.5} />
        <FloatingIcon icon={Star} className="bottom-20 left-[15%]" delay={1} />
        <FloatingIcon icon={Zap} className="top-1/2 left-[5%]" delay={2} />

        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              className="text-white"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <motion.div
                className="inline-flex items-center gap-2 px-5 py-2.5 glass rounded-full mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Sparkles className="w-4 h-4 text-yellow-300" />
                <span className="text-sm font-semibold">Your Smart Study Companion ✨</span>
              </motion.div>

              <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-[1.1]">
                Learn.{" "}
                <span className="bg-gradient-to-r from-yellow-300 via-pink-300 to-cyan-300 bg-clip-text text-transparent">
                  Play.
                </span>{" "}
                <br />Succeed.
              </h1>

              <p className="text-xl md:text-2xl mb-10 text-white/85 leading-relaxed max-w-lg">
                The all-in-one platform where students share notes, play revision games, swap skills, and grow together.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  onClick={() => navigate("/auth")}
                  className="bg-white text-primary hover:bg-white/90 font-bold text-lg rounded-full px-8 py-6 shadow-glow transition-all hover:scale-105"
                >
                  Start Learning <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="glass border-white/30 text-white hover:bg-white/20 font-semibold text-lg rounded-full px-8 py-6 transition-all hover:scale-105"
                  onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}
                >
                  Explore Features
                </Button>
              </div>
            </motion.div>

            <motion.div
              className="relative flex justify-center"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              {/* Glow behind illustration */}
              <div className="absolute inset-0 bg-gradient-to-r from-pink-400/30 via-purple-400/30 to-cyan-400/30 rounded-full blur-[80px]" />
              <img
                src={heroIllustration}
                alt="Students learning together on PrepVerse"
                className="relative z-10 w-full max-w-lg drop-shadow-2xl"
                width={1024}
                height={768}
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Wave divider */}
      <div className="relative -mt-1">
        <WaveDivider />
      </div>

      {/* Features Section */}
      <section id="features" className="py-24 relative">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary font-semibold text-sm mb-4">
              ⚡ Powerful Features
            </span>
            <h2 className="text-4xl md:text-5xl font-extrabold mb-4">
              Everything You Need to{" "}
              <span className="bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">Succeed</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              A comprehensive toolkit designed specifically for students who want to excel
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="group relative h-full">
                  {/* Gradient border glow on hover */}
                  <div className={`absolute -inset-0.5 bg-gradient-to-r ${feature.gradient} rounded-3xl opacity-0 group-hover:opacity-40 blur-sm transition-opacity duration-500`} />
                  <div className="relative h-full glass-card rounded-3xl p-7 transition-all duration-300 hover:-translate-y-2 hover:shadow-glow">
                    <div className="flex items-start gap-4">
                      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                        <feature.icon className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold mb-1.5 flex items-center gap-2">
                          {feature.title} <span className="text-lg">{feature.emoji}</span>
                        </h3>
                        <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-accent/20 rounded-3xl blur-3xl" />
              <div className="relative glass-card rounded-3xl p-10 space-y-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-primary flex items-center justify-center">
                    <Rocket className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold">Why PrepVerse?</h3>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {[
                    { icon: "🧠", text: "AI-powered smart learning" },
                    { icon: "🎮", text: "Gamified revision experience" },
                    { icon: "📚", text: "Peer-to-peer knowledge sharing" },
                    { icon: "📊", text: "Real-time progress tracking" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-2xl bg-primary/5 hover:bg-primary/10 transition-colors">
                      <span className="text-2xl">{item.icon}</span>
                      <span className="font-medium">{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <span className="inline-block px-4 py-2 rounded-full bg-accent/10 text-accent font-semibold text-sm mb-4">
                🌟 Student-First Platform
              </span>
              <h2 className="text-4xl md:text-5xl font-extrabold mb-6 leading-tight">
                Built for students,{" "}
                <span className="bg-gradient-to-r from-accent via-primary to-secondary bg-clip-text text-transparent">
                  by students
                </span>
              </h2>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                PrepVerse brings together everything you need to ace your exams and grow your career — all in one beautiful platform.
              </p>
              <div className="space-y-4">
                {benefits.map((benefit, i) => (
                  <motion.div
                    key={i}
                    className="flex items-center gap-3"
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <div className="w-7 h-7 rounded-full bg-gradient-to-r from-primary to-accent flex items-center justify-center shrink-0">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-medium">{benefit}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Interactive Cards Section */}
      <section className="py-24 relative">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="inline-block px-4 py-2 rounded-full bg-secondary/10 text-secondary font-semibold text-sm mb-4">
              🚀 Explore Modules
            </span>
            <h2 className="text-4xl md:text-5xl font-extrabold mb-4">
              Your Study{" "}
              <span className="bg-gradient-to-r from-secondary via-primary to-accent bg-clip-text text-transparent">Arsenal</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {interactiveCards.map((card, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -8, transition: { duration: 0.3 } }}
                className="cursor-pointer"
              >
                <div className={`relative group rounded-3xl glass-card p-8 text-center h-full transition-shadow duration-500 hover:${card.glow}`}>
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${card.gradient} flex items-center justify-center mx-auto mb-5 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}>
                    <card.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">{card.title}</h3>
                  <p className="text-muted-foreground text-sm">{card.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Live Stats Section */}
      <LiveStatsSection />

      {/* Founders Section */}
      <FoundersSection />

      {/* CTA Section */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero" />
        <FloatingShape className="w-64 h-64 bg-white/10 top-10 left-10 blur-3xl" delay={0} />
        <FloatingShape className="w-80 h-80 bg-pink-400/10 bottom-10 right-10 blur-3xl" delay={2} />

        <div className="container mx-auto px-4 relative z-10 text-center text-white">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="inline-flex items-center gap-2 px-5 py-2.5 glass rounded-full mb-8 text-sm font-semibold">
              <Zap className="w-4 h-4 text-yellow-300" />
              Join the Revolution
            </span>
            <h2 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight">
              Ready to Transform Your<br />
              <span className="bg-gradient-to-r from-yellow-300 via-pink-300 to-cyan-300 bg-clip-text text-transparent">
                Learning Journey?
              </span>
            </h2>
            <p className="text-xl mb-10 text-white/85 max-w-2xl mx-auto">
              Be among the first to experience PrepVerse and start your journey towards academic excellence.
            </p>
            <Button
              size="lg"
              onClick={() => navigate("/auth")}
              className="bg-white text-primary hover:bg-white/90 font-bold text-lg rounded-full px-10 py-7 shadow-glow transition-all hover:scale-105"
            >
              Join Now – It's Free! <Sparkles className="w-5 h-5 ml-2" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
        <div className="container mx-auto px-4 py-16 relative z-10">
          <div className="grid md:grid-cols-3 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
                  <GraduationCap className="w-6 h-6 text-primary-foreground" />
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  PrepVerse
                </span>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Your smart study companion — making learning interactive, collaborative, and fun for every student.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-lg">Quick Links</h4>
              <ul className="space-y-3">
                {["Dashboard", "Notes", "Game Zone", "SkillSwap", "Premium"].map((link) => (
                  <li key={link}>
                    <button
                      onClick={() => navigate(`/${link.toLowerCase().replace(" ", "")}`)}
                      className="text-muted-foreground hover:text-primary transition-colors font-medium"
                    >
                      {link}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-lg">Connect</h4>
              <div className="flex gap-3">
                {[
                  { icon: Instagram, color: "from-pink-500 to-purple-500" },
                  { icon: Twitter, color: "from-blue-400 to-cyan-400" },
                  { icon: Github, color: "from-gray-600 to-gray-800" },
                  { icon: Mail, color: "from-red-400 to-orange-400" },
                ].map(({ icon: Icon, color }, i) => (
                  <button
                    key={i}
                    className={`w-11 h-11 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-white hover:scale-110 transition-transform`}
                  >
                    <Icon className="w-5 h-5" />
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="border-t border-border/50 pt-8 text-center text-muted-foreground">
            <p>&copy; 2025 PrepVerse. All rights reserved. Made with 💜 for students.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
