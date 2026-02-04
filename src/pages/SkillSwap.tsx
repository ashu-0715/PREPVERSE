import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, Search, Filter, Loader2, GraduationCap, BookOpen, Users, Calendar, Trophy } from "lucide-react";
import { toast } from "sonner";
import { SkillPost, CATEGORY_OPTIONS, SkillCategory } from "@/types/skillswap";
import { CreatePostDialog } from "@/components/skillswap/CreatePostDialog";
import { SkillPostCard } from "@/components/skillswap/SkillPostCard";
import { MySessionsTab } from "@/components/skillswap/MySessionsTab";
import { ConnectionsTab } from "@/components/skillswap/ConnectionsTab";
import { BadgesSection } from "@/components/skillswap/BadgesSection";
import { useSkillSwapNotifications } from "@/hooks/useSkillSwapNotifications";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";

const SkillSwap = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<SkillPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("feed");

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<SkillCategory | "all">("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "offer" | "request">("all");

  useEffect(() => {
    checkAuth();
    fetchPosts();
  }, []);

  // Enable realtime notifications when user is logged in
  useSkillSwapNotifications({ userId: currentUserId });
  const { totalUnread } = useUnreadMessages(currentUserId);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUserId(user?.id || null);
  };

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Fetch posts with availability
      const { data: postsData, error } = await supabase
        .from("skill_posts_v2")
        .select(`
          *,
          availability:skill_availability(*)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch profiles for post owners
      const userIds = [...new Set((postsData || []).map((p) => p.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", userIds);

      // Fetch likes if user is logged in
      let userLikes: string[] = [];
      if (user) {
        const { data: likes } = await supabase
          .from("skill_post_likes")
          .select("post_id")
          .eq("user_id", user.id);
        userLikes = (likes || []).map((l) => l.post_id);
      }

      // Combine data
      const enrichedPosts = (postsData || []).map((post) => ({
        ...post,
        profile: profiles?.find((p) => p.id === post.user_id),
        user_has_liked: userLikes.includes(post.id),
      })) as SkillPost[];

      setPosts(enrichedPosts);
    } catch (error) {
      console.error("Error fetching posts:", error);
      toast.error("Failed to load posts");
    } finally {
      setLoading(false);
    }
  };

  // Filter posts
  const filteredPosts = posts.filter((post) => {
    const matchesSearch = post.skill_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || post.category === categoryFilter;
    const matchesType = typeFilter === "all" || post.post_type === typeFilter;
    return matchesSearch && matchesCategory && matchesType;
  });

  const offerPosts = filteredPosts.filter((p) => p.post_type === "offer");
  const requestPosts = filteredPosts.filter((p) => p.post_type === "request");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/dashboard")}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                SkillSwap Community
              </h1>
            </div>
            <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Create Post
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Hero Banner */}
        <Card className="p-6 mb-6 bg-gradient-to-r from-primary/10 to-secondary/10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold mb-2">Learn & Teach Together</h2>
              <p className="text-muted-foreground max-w-md">
                Exchange skills with fellow students. Teach what you know, learn what you need - no money required!
              </p>
            </div>
            <div className="flex gap-6 text-center">
              <div>
                <p className="text-3xl font-bold text-primary">{offerPosts.length}</p>
                <p className="text-sm text-muted-foreground">Teaching</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-secondary">{requestPosts.length}</p>
                <p className="text-sm text-muted-foreground">Learning</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="feed" className="gap-2">
              <Search className="w-4 h-4" />
              <span className="hidden sm:inline">Feed</span>
            </TabsTrigger>
            <TabsTrigger value="sessions" className="gap-2">
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">Sessions</span>
            </TabsTrigger>
            <TabsTrigger value="connections" className="gap-2 relative">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Connections</span>
              {totalUnread > 0 && (
                <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {totalUnread > 9 ? '9+' : totalUnread}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="badges" className="gap-2">
              <Trophy className="w-4 h-4" />
              <span className="hidden sm:inline">Badges</span>
            </TabsTrigger>
          </TabsList>

          {/* Feed Tab */}
          <TabsContent value="feed" className="space-y-6">
            {/* Filters */}
            <div className="flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search skills..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v as any)}>
                <SelectTrigger className="w-[150px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {CATEGORY_OPTIONS.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.icon} {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as any)}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Posts</SelectItem>
                  <SelectItem value="offer">
                    <span className="flex items-center gap-2">
                      <GraduationCap className="w-4 h-4" /> Teaching
                    </span>
                  </SelectItem>
                  <SelectItem value="request">
                    <span className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4" /> Learning
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Posts Grid */}
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : filteredPosts.length === 0 ? (
              <Card className="p-12 text-center">
                <GraduationCap className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">No posts found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery || categoryFilter !== "all" || typeFilter !== "all"
                    ? "Try adjusting your filters"
                    : "Be the first to share your skills!"}
                </p>
                <Button onClick={() => setShowCreateDialog(true)}>Create Your First Post</Button>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredPosts.map((post) => (
                  <SkillPostCard
                    key={post.id}
                    post={post}
                    currentUserId={currentUserId}
                    onLikeToggle={fetchPosts}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Sessions Tab */}
          <TabsContent value="sessions">
            {currentUserId ? (
              <MySessionsTab userId={currentUserId} />
            ) : (
              <Card className="p-12 text-center">
                <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">Sign in to view sessions</h3>
                <p className="text-muted-foreground mb-4">
                  Your scheduled sessions will appear here.
                </p>
                <Button onClick={() => navigate("/auth")}>Sign In</Button>
              </Card>
            )}
          </TabsContent>

          {/* Connections Tab */}
          <TabsContent value="connections">
            {currentUserId ? (
              <ConnectionsTab userId={currentUserId} />
            ) : (
              <Card className="p-12 text-center">
                <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">Sign in to view connections</h3>
                <p className="text-muted-foreground mb-4">
                  Your connection requests will appear here.
                </p>
                <Button onClick={() => navigate("/auth")}>Sign In</Button>
              </Card>
            )}
          </TabsContent>

          {/* Badges Tab */}
          <TabsContent value="badges">
            {currentUserId ? (
              <BadgesSection userId={currentUserId} />
            ) : (
              <Card className="p-12 text-center">
                <Trophy className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">Sign in to view badges</h3>
                <p className="text-muted-foreground mb-4">
                  Earn badges by helping others and learning new skills!
                </p>
                <Button onClick={() => navigate("/auth")}>Sign In</Button>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Create Post Dialog */}
      <CreatePostDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={fetchPosts}
      />
    </div>
  );
};

export default SkillSwap;
