import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Heart, MessageCircle, Plus } from "lucide-react";
import { toast } from "sonner";

const SkillSwap = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from("skill_posts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load posts");
    } else {
      setPosts(data || []);
    }
    setLoading(false);
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - d.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return "1 day ago";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
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
            SkillSwap Community
          </h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <Card className="p-6 bg-gradient-card shadow-card">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">Learn & Teach</h2>
                <p className="text-muted-foreground">
                  Exchange skills with fellow students
                </p>
              </div>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                New Post
              </Button>
            </div>
          </Card>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : posts.length === 0 ? (
          <Card className="p-12 text-center">
            <MessageCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">No posts yet</h3>
            <p className="text-muted-foreground mb-4">
              Be the first to start a skill exchange
            </p>
            <Button>Create Your First Post</Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <Card key={post.id} className="p-6 hover:shadow-card transition-all">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center text-white font-bold">
                    {post.user_id.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold">Student</span>
                      <span className="text-sm text-muted-foreground">
                        · {formatDate(post.created_at)}
                      </span>
                    </div>
                    
                    <div className="mb-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium text-primary">
                          Can teach:
                        </span>
                        <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                          {post.skill_offered}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-secondary">
                          Want to learn:
                        </span>
                        <span className="px-3 py-1 bg-secondary/10 text-secondary rounded-full text-sm font-medium">
                          {post.skill_requested}
                        </span>
                      </div>
                    </div>
                    
                    {post.description && (
                      <p className="text-muted-foreground mb-4">
                        {post.description}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-4">
                      <Button variant="ghost" size="sm" className="gap-2">
                        <Heart className="w-4 h-4" />
                        <span>{post.likes}</span>
                      </Button>
                      <Button variant="ghost" size="sm" className="gap-2">
                        <MessageCircle className="w-4 h-4" />
                        Connect
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default SkillSwap;
