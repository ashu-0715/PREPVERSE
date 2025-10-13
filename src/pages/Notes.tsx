import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Upload, Star, Download } from "lucide-react";
import { toast } from "sonner";

const Notes = () => {
  const navigate = useNavigate();
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    const { data, error } = await supabase
      .from("notes")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load notes");
    } else {
      setNotes(data || []);
    }
    setLoading(false);
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
            Notes Sharing
          </h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Card className="p-6 bg-gradient-card shadow-card">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">Study Materials Hub</h2>
                <p className="text-muted-foreground">
                  Access shared notes or contribute your own
                </p>
              </div>
              <Button className="gap-2">
                <Upload className="w-4 h-4" />
                Upload Note
              </Button>
            </div>
          </Card>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : notes.length === 0 ? (
          <Card className="p-12 text-center">
            <Upload className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">No notes yet</h3>
            <p className="text-muted-foreground mb-4">
              Be the first to share study materials
            </p>
            <Button>Upload Your First Note</Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {notes.map((note) => (
              <Card
                key={note.id}
                className="p-6 hover:shadow-elegant transition-all group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors">
                      {note.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">{note.subject}</p>
                  </div>
                  <div className="flex items-center gap-1 text-sm">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span>{note.rating.toFixed(1)}</span>
                  </div>
                </div>
                
                {note.semester && (
                  <div className="inline-block px-2 py-1 bg-muted rounded text-xs mb-4">
                    {note.semester}
                  </div>
                )}
                
                <Button variant="outline" size="sm" className="w-full gap-2">
                  <Download className="w-4 h-4" />
                  Download
                </Button>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Notes;
