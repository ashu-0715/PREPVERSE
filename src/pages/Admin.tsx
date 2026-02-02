import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  Shield,
  Users,
  FileText,
  Activity,
  LogOut,
  Search,
  RefreshCw,
  Clock,
  User,
  BookOpen,
} from "lucide-react";
import { format } from "date-fns";

interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
  createdAt: string;
  lastSignIn: string;
  notesCount: number;
  notes: any[];
  sessions: any[];
  activity: any[];
  isActive: boolean;
}

interface AdminData {
  users: AdminUser[];
  totalUsers: number;
  totalNotes: number;
  activeUsers: number;
}

const Admin = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AdminData | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    checkAdminAndFetchData();
  }, []);

  const checkAdminAndFetchData = async () => {
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

      if (roleData?.role !== "admin") {
        toast.error("Access denied");
        navigate("/auth");
        return;
      }

      await fetchAdminData();
    } catch (error) {
      console.error("Error:", error);
      navigate("/auth");
    }
  };

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("No session");
      }

      const { data, error } = await supabase.functions.invoke("admin-data", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      setData(data);
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    // Mark admin sessions as inactive before logout
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from("user_sessions")
        .update({ is_active: false, last_active_at: new Date().toISOString() })
        .eq("user_id", user.id);
    }
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const filteredUsers = data?.users.filter(user =>
    user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-8 h-8 text-primary" />
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Button variant="outline" size="sm" onClick={fetchAdminData}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
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
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data?.totalUsers || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active Now</CardTitle>
              <Activity className="w-4 h-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">{data?.activeUsers || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Notes</CardTitle>
              <FileText className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data?.totalNotes || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Students</CardTitle>
              <BookOpen className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {data?.users.filter(u => u.role === "student").length || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="users" className="space-y-4">
          <TabsList>
            <TabsTrigger value="users">All Users</TabsTrigger>
            <TabsTrigger value="notes">Notes Uploaded</TabsTrigger>
            <TabsTrigger value="activity">Activity Log</TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>User Management</CardTitle>
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Search users..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead>Last Sign In</TableHead>
                      <TableHead>Joined</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow
                        key={user.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => setSelectedUser(user)}
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <User className="w-4 h-4 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{user.fullName}</p>
                              <p className="text-sm text-muted-foreground">{user.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.role === "admin" ? "default" : user.role === "faculty" ? "secondary" : "outline"}>
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${user.isActive ? "bg-green-500" : "bg-gray-400"}`} />
                            {user.isActive ? "Active" : "Offline"}
                          </div>
                        </TableCell>
                        <TableCell>{user.notesCount}</TableCell>
                        <TableCell>
                          {user.lastSignIn ? format(new Date(user.lastSignIn), "MMM d, h:mm a") : "Never"}
                        </TableCell>
                        <TableCell>
                          {format(new Date(user.createdAt), "MMM d, yyyy")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notes">
            <Card>
              <CardHeader>
                <CardTitle>Notes Uploaded by Users</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Uploaded By</TableHead>
                      <TableHead>Semester</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.users.flatMap(user =>
                      user.notes.map(note => ({
                        ...note,
                        uploaderName: user.fullName,
                        uploaderEmail: user.email,
                      }))
                    ).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                    .map((note) => (
                      <TableRow key={note.id}>
                        <TableCell className="font-medium">{note.title}</TableCell>
                        <TableCell>{note.subject}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{note.uploaderName}</p>
                            <p className="text-sm text-muted-foreground">{note.uploaderEmail}</p>
                          </div>
                        </TableCell>
                        <TableCell>{note.semester || "-"}</TableCell>
                        <TableCell>
                          {format(new Date(note.created_at), "MMM d, yyyy")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data?.users.flatMap(user =>
                    user.activity.map(act => ({
                      ...act,
                      userName: user.fullName,
                      userEmail: user.email,
                    }))
                  ).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                  .slice(0, 50)
                  .map((activity) => (
                    <div key={activity.id} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Clock className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{activity.userName}</p>
                        <p className="text-sm text-muted-foreground">
                          {activity.action.replace(/_/g, " ")}
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(activity.created_at), "MMM d, h:mm a")}
                      </p>
                    </div>
                  ))}
                  {(!data?.users.some(u => u.activity.length > 0)) && (
                    <p className="text-center text-muted-foreground py-8">No activity recorded yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* User Detail Modal */}
        {selectedUser && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>{selectedUser.fullName}</CardTitle>
                  <p className="text-muted-foreground">{selectedUser.email}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setSelectedUser(null)}>
                  ✕
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Role</p>
                    <Badge>{selectedUser.role}</Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${selectedUser.isActive ? "bg-green-500" : "bg-gray-400"}`} />
                      {selectedUser.isActive ? "Active" : "Offline"}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Notes Uploaded</p>
                    <p className="font-medium">{selectedUser.notesCount}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Joined</p>
                    <p className="font-medium">{format(new Date(selectedUser.createdAt), "MMM d, yyyy")}</p>
                  </div>
                </div>

                {selectedUser.notes.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Uploaded Notes</h4>
                    <div className="space-y-2">
                      {selectedUser.notes.map(note => (
                        <div key={note.id} className="p-3 bg-muted rounded-lg">
                          <p className="font-medium">{note.title}</p>
                          <p className="text-sm text-muted-foreground">{note.subject} • {note.semester || "No semester"}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedUser.activity.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Recent Activity</h4>
                    <div className="space-y-2">
                      {selectedUser.activity.slice(0, 5).map(act => (
                        <div key={act.id} className="flex items-center justify-between p-2 bg-muted rounded">
                          <p className="text-sm">{act.action.replace(/_/g, " ")}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(act.created_at), "MMM d, h:mm a")}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
};

export default Admin;
