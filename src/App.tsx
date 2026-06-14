import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

import Admin from "./pages/Admin";
import Dashboard from "./pages/Dashboard";
import Career from "./pages/Career";
import Notes from "./pages/Notes";
import Premium from "./pages/Premium";
import SkillSwap from "./pages/SkillSwap";
import NotFound from "./pages/NotFound";
import GameZone from "./pages/GameZone";
import ExamLayout from "./pages/exam/ExamLayout";
import ExamDashboard from "./pages/exam/ExamDashboard";
import ExamSubjects from "./pages/exam/ExamSubjects";
import ExamMentor from "./pages/exam/ExamMentor";
import ExamPlaceholder from "./pages/exam/ExamPlaceholder";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            
            <Route path="/admin" element={<Admin />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/career" element={<Career />} />
            <Route path="/notes" element={<Notes />} />
            <Route path="/premium" element={<Premium />} />
            <Route path="/skillswap" element={<SkillSwap />} />
            <Route path="/gamezone" element={<GameZone />} />
            <Route path="/exam" element={<ExamLayout />}>
              <Route index element={<ExamDashboard />} />
              <Route path="subjects" element={<ExamSubjects />} />
              <Route path="mentor" element={<ExamMentor />} />
              <Route path="pyqs" element={<ExamPlaceholder title="Previous Year Questions" description="GATE PYQs 2010-2024 with AI explanations" />} />
              <Route path="mocks" element={<ExamPlaceholder title="Mock Tests" description="Topic, subject, and full-length GATE mocks with AI analysis" />} />
              <Route path="revision" element={<ExamPlaceholder title="Smart Revision" description="AI-generated flashcards and spaced repetition" />} />
              <Route path="planner" element={<ExamPlaceholder title="Study Planner" description="AI-generated personalized study plan" />} />
              <Route path="analytics" element={<ExamPlaceholder title="Analytics" description="Performance trends, weakness map, and rank prediction" />} />
            </Route>
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
