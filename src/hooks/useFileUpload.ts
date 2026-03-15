import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useFileUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const extractTextFromFile = useCallback(async (file: File): Promise<string> => {
    const text = await file.text();
    // For PDFs and complex files, we extract what we can from text content
    // The AI will handle making sense of the content
    return text;
  }, []);

  const uploadAndProcess = useCallback(async (
    file: File,
    difficulty: string = "medium",
    questionCount: number = 15
  ) => {
    setIsUploading(true);
    setProgress(10);

    try {
      // Extract text content
      setProgress(30);
      const content = await extractTextFromFile(file);
      
      if (content.trim().length < 50) {
        throw new Error("File content is too short. Please upload a file with more study material.");
      }

      setProgress(50);

      // Send to edge function for AI processing
      const { data, error } = await supabase.functions.invoke("process-study-material", {
        body: {
          content,
          fileName: file.name,
          difficulty,
          questionCount,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setProgress(100);
      toast.success(`Generated ${data.questionsGenerated} questions from "${file.name}"!`);
      return data;
    } catch (err: any) {
      console.error("Upload error:", err);
      toast.error(err.message || "Failed to process file");
      throw err;
    } finally {
      setIsUploading(false);
      setTimeout(() => setProgress(0), 1000);
    }
  }, [extractTextFromFile]);

  return { uploadAndProcess, isUploading, progress };
}
