import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ThemeToggle";
import { toast } from "sonner";
import {
  GraduationCap,
  Users,
  FileText,
  Activity,
  LogOut,
  Search,
  TrendingUp,
  Clock,
  BookOpen,
} from "lucide-react";
import { format } from "date-fns";

interface StudentProfile {
  id: string;
  full_name: string;
  email: string;
  streak_days: number;
  created_at: string;
}

interface StudentNote {
  id: string;
  title: string;
  subject: string;
  semester: string | null;
  created_at: string;
  user_id: string;
  profile?: {
    full_name: string;
    email: string;
  };
}

interface StudentActivity {
  id: string;
  user_id: string;
  action: string;
  details: any;
  created_at: string;
  profile?: {
    full_name: string;
    email: string;
  };
}

const Faculty = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [notes, setNotes] = useState<StudentNote[]>([]);
  const [activities, setActivities] = useState<StudentActivity[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [notesSearchTerm, setNotesSearchTerm] = useState("");
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalNotes: 0,
    activeToday: 0,
    avgStreak: 0,
  });

  useEffect(() => {
    checkFacultyAccess();
  }, []);

  const checkFacultyAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!roleData || (roleData.role !== "faculty" && roleData.role !== "admin")) {
        toast.error("Access denied. Faculty privileges required.");
        navigate("/dashboard");
        return;
      }

      await Promise.all([
        fetchStudents(),
        fetchNotes(),
        fetchActivities(),
      ]);
    } catch (error) {
      console.error("Error checking access:", error);
      navigate("/auth");
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      // Get all students (users with student role)
      const { data: studentRoles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "student");

      if (!studentRoles) return;

      const studentIds = studentRoles.map(r => r.user_id);
      
      const { data: profiles } = await supabase
        .from("profiles")
        .select("*")
        .in("id", studentIds);

      if (profiles) {
        setStudents(profiles);
        
        // Calculate stats
        const today = new Date().toDateString();
        const { data: todaySessions } = await supabase
          .from("user_sessions")
          .select("user_id")
          .in("user_id", studentIds)
          .gte("logged_in_at", new Date(today).toISOString());

        const activeToday = new Set(todaySessions?.map(s => s.user_id) || []).size;
        const avgStreak = profiles.reduce((sum, p) => sum + (p.streak_days || 0), 0) / profiles.length || 0;

        setStats(prev => ({
          ...prev,
          totalStudents: profiles.length,
          activeToday,
          avgStreak: Math.round(avgStreak * 10) / 10,
        }));
      }
    } catch (error) {
      console.error("Error fetching students:", error);
    }
  };

  const fetchNotes = async () => {
    try {
      const { data: notesData } = await supabase
        .from("notes")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (notesData) {
        // Get profiles for note authors
        const userIds = [...new Set(notesData.map(n => n.user_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, email")
          .in("id", userIds);

        const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
        
        const notesWithProfiles = notesData.map(note => ({
          ...note,
          profile: profileMap.get(note.user_id),
        }));

        setNotes(notesWithProfiles);
        setStats(prev => ({ ...prev, totalNotes: notesData.length }));
      }
    } catch (error) {
      console.error("Error fetching notes:", error);
    }
  };

  const fetchActivities = async () => {
    try {
      // Get student user IDs
      const { data: studentRoles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "student");

      if (!studentRoles) return;

      const studentIds = studentRoles.map(r => r.user_id);

      const { data: activityData } = await supabase
        .from("user_activity")
        .select("*")
        .in("user_id", studentIds)
        .order("created_at", { ascending: false })
        .limit(100);

      if (activityData) {
        // Get profiles
        const userIds = [...new Set(activityData.map(a => a.user_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, email")
          .in("id", userIds);

        const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
        
        const activitiesWithProfiles = activityData.map(activity => ({
          ...activity,
          profile: profileMap.get(activity.user_id),
        }));

        setActivities(activitiesWithProfiles);
      }
    } catch (error) {
      console.error("Error fetching activities:", error);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const filteredStudents = students.filter(
    (student) =>
      student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredNotes = notes.filter(
    (note) =>
      note.title.toLowerCase().includes(notesSearchTerm.toLowerCase()) ||
      note.subject.toLowerCase().includes(notesSearchTerm.toLowerCase()) ||
      note.profile?.full_name.toLowerCase().includes(notesSearchTerm.toLowerCase())
  );

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case "login":
        return "bg-green-500/10 text-green-500";
      case "note_upload":
        return "bg-blue-500/10 text-blue-500";
      case "note_view":
        return "bg-purple-500/10 text-purple-500";
      default:
        return "bg-gray-500/10 text-gray-500";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-lg">Loading faculty dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-8 h-8 text-primary" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              Faculty Dashboard
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Students
              </CardTitle>
              <Users className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalStudents}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Notes Uploaded
              </CardTitle>
              <FileText className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalNotes}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Today
              </CardTitle>
              <Activity className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeToday}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Avg Streak
              </CardTitle>
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgStreak} days</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="students" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="students" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Students
            </TabsTrigger>
            <TabsTrigger value="notes" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Notes
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Activity
            </TabsTrigger>
          </TabsList>

          {/* Students Tab */}
          <TabsContent value="students">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Student Directory</CardTitle>
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search students..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Streak</TableHead>
                      <TableHead>Joined</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell className="font-medium">
                          {student.full_name}
                        </TableCell>
                        <TableCell>{student.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-orange-500/10 text-orange-500">
                            🔥 {student.streak_days || 0} days
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {format(new Date(student.created_at), "MMM d, yyyy")}
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredStudents.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                          No students found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notes Tab */}
          <TabsContent value="notes">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Student Notes</CardTitle>
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search notes..."
                      value={notesSearchTerm}
                      onChange={(e) => setNotesSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Semester</TableHead>
                      <TableHead>Uploaded By</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredNotes.map((note) => (
                      <TableRow key={note.id}>
                        <TableCell className="font-medium">{note.title}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{note.subject}</Badge>
                        </TableCell>
                        <TableCell>{note.semester || "—"}</TableCell>
                        <TableCell>{note.profile?.full_name || "Unknown"}</TableCell>
                        <TableCell>
                          {format(new Date(note.created_at), "MMM d, yyyy")}
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredNotes.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          No notes found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle>Recent Student Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead>Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activities.map((activity) => (
                      <TableRow key={activity.id}>
                        <TableCell className="font-medium">
                          {activity.profile?.full_name || "Unknown"}
                        </TableCell>
                        <TableCell>
                          <Badge className={getActionBadgeColor(activity.action)}>
                            {activity.action.replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground max-w-xs truncate">
                          {activity.details ? JSON.stringify(activity.details) : "—"}
                        </TableCell>
                        <TableCell>
                          {format(new Date(activity.created_at), "MMM d, h:mm a")}
                        </TableCell>
                      </TableRow>
                    ))}
                    {activities.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                          No recent activity
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Faculty;
