import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFileUpload } from "@/hooks/useFileUpload";
import { Upload, FileText, Loader2, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface UploadSectionProps {
  onUploadComplete: (data: any) => void;
}

const UploadSection = ({ onUploadComplete }: UploadSectionProps) => {
  const [difficulty, setDifficulty] = useState("medium");
  const [questionCount, setQuestionCount] = useState(15);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadAndProcess, isUploading, progress } = useFileUpload();

  const handleFile = useCallback(async (file: File) => {
    const allowedTypes = [
      "text/plain", "text/markdown", "text/csv",
      "application/pdf", "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    const allowedExts = [".txt", ".md", ".csv", ".pdf", ".pptx", ".docx"];
    const ext = "." + file.name.split(".").pop()?.toLowerCase();

    if (!allowedTypes.includes(file.type) && !allowedExts.includes(ext)) {
      return;
    }

    try {
      const result = await uploadAndProcess(file, difficulty, questionCount);
      onUploadComplete(result);
    } catch {}
  }, [difficulty, questionCount, uploadAndProcess, onUploadComplete]);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="p-8 border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 to-secondary/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
        
        <div className="relative z-10 text-center space-y-6">
          <motion.div
            animate={{ scale: dragOver ? 1.1 : 1 }}
            className="mx-auto w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center"
          >
            <Upload className="w-10 h-10 text-primary" />
          </motion.div>

          <div>
            <h3 className="text-xl font-bold">Upload Study Material</h3>
            <p className="text-muted-foreground mt-1">
              Upload PDF, PPTX, DOCX, or TXT files to generate interactive quiz questions
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-4">
            <div className="w-40">
              <label className="text-sm font-medium mb-1 block">Difficulty</label>
              <Select value={difficulty} onValueChange={setDifficulty}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">🟢 Easy</SelectItem>
                  <SelectItem value="medium">🟡 Medium</SelectItem>
                  <SelectItem value="hard">🔴 Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-40">
              <label className="text-sm font-medium mb-1 block">Questions</label>
              <Select value={String(questionCount)} onValueChange={v => setQuestionCount(Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 Questions</SelectItem>
                  <SelectItem value="15">15 Questions</SelectItem>
                  <SelectItem value="20">20 Questions</SelectItem>
                  <SelectItem value="30">30 Questions</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div
            className={`border-2 border-dashed rounded-xl p-8 transition-colors cursor-pointer ${
              dragOver ? "border-primary bg-primary/10" : "border-muted-foreground/20 hover:border-primary/50"
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              const file = e.dataTransfer.files[0];
              if (file) handleFile(file);
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            {isUploading ? (
              <div className="space-y-3">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                <p className="text-sm font-medium">Processing with AI...</p>
                <Progress value={progress} className="w-64 mx-auto" />
              </div>
            ) : (
              <div className="space-y-2">
                <FileText className="w-8 h-8 mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Drag & drop or click to upload
                </p>
                <p className="text-xs text-muted-foreground/60">
                  Supports: PDF, PPTX, DOCX, TXT, MD
                </p>
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".pdf,.pptx,.docx,.txt,.md,.csv"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
        </div>
      </Card>
    </motion.div>
  );
};

export default UploadSection;
