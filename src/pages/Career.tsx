import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { ArrowLeft, Sparkles } from "lucide-react";

const Career = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const interests = [
    "Web Development",
    "Mobile Apps",
    "Data Science",
    "Artificial Intelligence",
    "Cybersecurity",
    "Cloud Computing",
    "Game Development",
    "UI/UX Design",
  ];

  const skills = [
    "Problem Solving",
    "Creativity",
    "Analytical Thinking",
    "Communication",
    "Team Collaboration",
    "Leadership",
    "Technical Writing",
    "Quick Learning",
  ];

  const handleInterestToggle = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest]
    );
  };

  const handleSkillToggle = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill)
        ? prev.filter((s) => s !== skill)
        : [...prev, skill]
    );
  };

  const generateRecommendations = async () => {
    setLoading(true);
    
    // Simple recommendation logic
    const roles: string[] = [];
    if (selectedInterests.includes("Web Development")) roles.push("Front-End Developer", "Full-Stack Developer");
    if (selectedInterests.includes("Data Science")) roles.push("Data Analyst", "Machine Learning Engineer");
    if (selectedInterests.includes("UI/UX Design")) roles.push("UX Designer", "Product Designer");
    if (selectedInterests.includes("Cybersecurity")) roles.push("Security Analyst", "Penetration Tester");
    if (selectedInterests.includes("Mobile Apps")) roles.push("Mobile Developer", "React Native Developer");
    if (selectedInterests.includes("Cloud Computing")) roles.push("Cloud Architect", "DevOps Engineer");
    
    const uniqueRoles = [...new Set(roles)].slice(0, 4);
    setRecommendations(uniqueRoles.length > 0 ? uniqueRoles : ["Software Developer", "Technical Consultant"]);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await supabase.from("career_assessments").insert({
          user_id: session.user.id,
          interests: selectedInterests,
          skills: selectedSkills,
          recommended_roles: uniqueRoles,
        });

        // Award badge
        const { data: badge } = await supabase
          .from("badges")
          .select("id")
          .eq("name", "Career Seeker")
          .single();

        if (badge) {
          await supabase.from("user_badges").insert({
            user_id: session.user.id,
            badge_id: badge.id,
          }).then(() => {
            toast.success("🎯 Career Seeker badge earned!");
          });
        }
      }
    } catch (error) {
      console.error("Error saving assessment:", error);
    }

    setLoading(false);
    setStep(3);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/dashboard")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Career Guidance
          </h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {step === 1 && (
          <Card className="p-8 shadow-elegant">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold">What are you interested in?</h2>
            </div>
            <p className="text-muted-foreground mb-6">
              Select all areas that spark your curiosity
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {interests.map((interest) => (
                <div
                  key={interest}
                  className={`flex items-center space-x-3 p-4 rounded-lg border-2 transition-all cursor-pointer ${
                    selectedInterests.includes(interest)
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                  onClick={() => handleInterestToggle(interest)}
                >
                  <Checkbox
                    checked={selectedInterests.includes(interest)}
                    onCheckedChange={() => handleInterestToggle(interest)}
                  />
                  <span className="font-medium">{interest}</span>
                </div>
              ))}
            </div>

            <Button
              onClick={() => setStep(2)}
              disabled={selectedInterests.length === 0}
              className="w-full"
            >
              Continue
            </Button>
          </Card>
        )}

        {step === 2 && (
          <Card className="p-8 shadow-elegant">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold">What are your strengths?</h2>
            </div>
            <p className="text-muted-foreground mb-6">
              Select skills you're confident about
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {skills.map((skill) => (
                <div
                  key={skill}
                  className={`flex items-center space-x-3 p-4 rounded-lg border-2 transition-all cursor-pointer ${
                    selectedSkills.includes(skill)
                      ? "border-secondary bg-secondary/5"
                      : "border-border hover:border-secondary/50"
                  }`}
                  onClick={() => handleSkillToggle(skill)}
                >
                  <Checkbox
                    checked={selectedSkills.includes(skill)}
                    onCheckedChange={() => handleSkillToggle(skill)}
                  />
                  <span className="font-medium">{skill}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-4">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                Back
              </Button>
              <Button
                onClick={generateRecommendations}
                disabled={selectedSkills.length === 0 || loading}
                className="flex-1"
              >
                {loading ? "Analyzing..." : "Get Recommendations"}
              </Button>
            </div>
          </Card>
        )}

        {step === 3 && (
          <Card className="p-8 shadow-elegant">
            <div className="text-center mb-8">
              <div className="inline-block p-4 bg-primary/10 rounded-full mb-4">
                <Sparkles className="w-12 h-12 text-primary" />
              </div>
              <h2 className="text-3xl font-bold mb-2">Your Career Paths</h2>
              <p className="text-muted-foreground">
                Based on your interests and skills
              </p>
            </div>

            <div className="grid gap-4 mb-8">
              {recommendations.map((role, index) => (
                <Card
                  key={index}
                  className="p-6 bg-gradient-card hover:shadow-elegant transition-all"
                >
                  <h3 className="text-xl font-semibold mb-2">{role}</h3>
                  <p className="text-muted-foreground text-sm">
                    This role aligns with your selected interests and strengths
                  </p>
                </Card>
              ))}
            </div>

            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={() => {
                  setStep(1);
                  setSelectedInterests([]);
                  setSelectedSkills([]);
                  setRecommendations([]);
                }}
                className="flex-1"
              >
                Take Again
              </Button>
              <Button onClick={() => navigate("/dashboard")} className="flex-1">
                Back to Dashboard
              </Button>
            </div>
          </Card>
        )}
      </main>
    </div>
  );
};

export default Career;
