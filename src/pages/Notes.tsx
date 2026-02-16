import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft, Upload, Star, Download, FileText, Eye, MessageSquarePlus,
  CheckCircle, Clock, Search, Pencil, Trash2, User, Crown, Lock, Filter, SortAsc,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { NoteReviewDialog } from "@/components/NoteReviewDialog";

interface Note {
  id: string;
  title: string;
  subject: string;
  semester: string | null;
  file_url: string;
  rating: number | null;
  rating_count: number | null;
  created_at: string | null;
  user_id: string;
  note_type: string;
  price: number;
  profile?: { full_name: string; avatar_url?: string };
}

interface NoteRequest {
  id: string;
  user_id: string;
  subject: string;
  topic: string;
  semester: string | null;
  description: string | null;
  is_fulfilled: boolean;
  created_at: string | null;
}

const SEMESTERS = ["Semester 1","Semester 2","Semester 3","Semester 4","Semester 5","Semester 6","Semester 7","Semester 8"];
const SUBJECTS = ["Mathematics","Physics","Chemistry","Computer Science","Electronics","Data Structures","Algorithms","Database Management","Operating Systems","Computer Networks","Web Development","Machine Learning","Artificial Intelligence","Software Engineering","Other"];

const Notes = () => {
  const navigate = useNavigate();
  const [notes, setNotes] = useState<Note[]>([]);
  const [noteRequests, setNoteRequests] = useState<NoteRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("latest");
  const [purchasedNoteIds, setPurchasedNoteIds] = useState<Set<string>>(new Set());

  // Upload form state
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadSubject, setUploadSubject] = useState("");
  const [uploadSemester, setUploadSemester] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadNoteType, setUploadNoteType] = useState("free");
  const [uploadPrice, setUploadPrice] = useState("");

  // Edit form state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editSubject, setEditSubject] = useState("");
  const [editSemester, setEditSemester] = useState("");

  // Request form state
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [requestSubject, setRequestSubject] = useState("");
  const [requestTopic, setRequestTopic] = useState("");
  const [requestSemester, setRequestSemester] = useState("");
  const [requestDescription, setRequestDescription] = useState("");

  // Review dialog
  const [reviewNoteId, setReviewNoteId] = useState<string | null>(null);
  const [reviewNoteTitle, setReviewNoteTitle] = useState("");

  // Locked note dialog
  const [lockedDialogOpen, setLockedDialogOpen] = useState(false);
  const [lockedNoteType, setLockedNoteType] = useState<"premium" | "paid">("premium");
  const [lockedNotePrice, setLockedNotePrice] = useState(0);
  const [lockedNoteId, setLockedNoteId] = useState<string | null>(null);

  useEffect(() => {
    checkUser();
    fetchNotes();
    fetchNoteRequests();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_premium")
        .eq("id", user.id)
        .single();
      setIsPremium(profile?.is_premium || false);

      // Fetch purchased notes
      const { data: purchases } = await supabase
        .from("note_purchases")
        .select("note_id")
        .eq("user_id", user.id);
      if (purchases) {
        setPurchasedNoteIds(new Set(purchases.map((p) => p.note_id)));
      }
    }
  };

  const fetchNotes = async () => {
    const { data, error } = await supabase
      .from("notes")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load notes");
      setLoading(false);
      return;
    }

    if (data && data.length > 0) {
      const userIds = [...new Set(data.map((n) => n.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", userIds);
      const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);
      const notesWithProfiles = data.map((note) => ({
        ...note,
        note_type: (note as any).note_type || "free",
        price: (note as any).price || 0,
        profile: profileMap.get(note.user_id),
      }));
      setNotes(notesWithProfiles);
    } else {
      setNotes([]);
    }
    setLoading(false);
  };

  const fetchNoteRequests = async () => {
    const { data, error } = await supabase
      .from("note_requests")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error) setNoteRequests(data || []);
  };

  const canAccessNote = (note: Note): boolean => {
    if (note.note_type === "free") return true;
    if (note.user_id === user?.id) return true;
    if (note.note_type === "premium") return isPremium;
    if (note.note_type === "paid") return purchasedNoteIds.has(note.id);
    return false;
  };

  const handleNoteAction = (note: Note, action: "view" | "download") => {
    if (canAccessNote(note)) {
      if (action === "view") window.open(note.file_url, "_blank");
      else window.open(note.file_url, "_blank");
    } else {
      setLockedNoteType(note.note_type as "premium" | "paid");
      setLockedNotePrice(note.price);
      setLockedNoteId(note.id);
      setLockedDialogOpen(true);
    }
  };

  const handlePurchaseNote = async () => {
    if (!user || !lockedNoteId) return;
    try {
      const { error } = await supabase.from("note_purchases").insert({
        note_id: lockedNoteId,
        user_id: user.id,
        amount: lockedNotePrice,
      });
      if (error) throw error;
      setPurchasedNoteIds((prev) => new Set([...prev, lockedNoteId]));
      setLockedDialogOpen(false);
      toast.success("Note unlocked!");
    } catch (error: any) {
      toast.error(error.message || "Failed to purchase");
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { toast.error("Please log in"); navigate("/auth"); return; }
    if (!uploadFile) { toast.error("Please select a file"); return; }

    if ((uploadNoteType === "premium" || uploadNoteType === "paid") && !isPremium) {
      toast.error("Only premium users can publish premium/paid notes");
      return;
    }

    if (uploadNoteType === "paid" && (!uploadPrice || Number(uploadPrice) < 10 || Number(uploadPrice) > 999)) {
      toast.error("Price must be between ₹10 and ₹999");
      return;
    }

    setUploading(true);
    try {
      const fileExt = uploadFile.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from("notes").upload(fileName, uploadFile);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from("notes").getPublicUrl(fileName);

      const { error: insertError } = await supabase.from("notes").insert({
        user_id: user.id,
        title: uploadTitle,
        subject: uploadSubject,
        semester: uploadSemester || null,
        file_url: publicUrl,
        note_type: uploadNoteType,
        price: uploadNoteType === "paid" ? Number(uploadPrice) : 0,
      } as any);
      if (insertError) throw insertError;

      toast.success("Note uploaded!");
      setUploadDialogOpen(false);
      resetUploadForm();
      fetchNotes();
    } catch (error: any) {
      toast.error(error.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNote || !user) return;
    try {
      const { error } = await supabase
        .from("notes")
        .update({ title: editTitle, subject: editSubject, semester: editSemester || null })
        .eq("id", editingNote.id)
        .eq("user_id", user.id);
      if (error) throw error;
      toast.success("Note updated!");
      setEditDialogOpen(false);
      setEditingNote(null);
      fetchNotes();
    } catch (error: any) {
      toast.error(error.message || "Update failed");
    }
  };

  const handleDelete = async (noteId: string) => {
    if (!user) return;
    try {
      const { error } = await supabase.from("notes").delete().eq("id", noteId).eq("user_id", user.id);
      if (error) throw error;
      toast.success("Note deleted!");
      fetchNotes();
    } catch (error: any) {
      toast.error(error.message || "Delete failed");
    }
  };

  const openEditDialog = (note: Note) => {
    setEditingNote(note);
    setEditTitle(note.title);
    setEditSubject(note.subject);
    setEditSemester(note.semester || "");
    setEditDialogOpen(true);
  };

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { toast.error("Please log in"); navigate("/auth"); return; }
    try {
      const { error } = await supabase.from("note_requests").insert({
        user_id: user.id, subject: requestSubject, topic: requestTopic,
        semester: requestSemester || null, description: requestDescription || null,
      });
      if (error) throw error;
      toast.success("Request submitted!");
      setRequestDialogOpen(false);
      resetRequestForm();
      fetchNoteRequests();
    } catch (error: any) {
      toast.error(error.message || "Request failed");
    }
  };

  const resetUploadForm = () => {
    setUploadTitle(""); setUploadSubject(""); setUploadSemester("");
    setUploadFile(null); setUploadNoteType("free"); setUploadPrice("");
  };

  const resetRequestForm = () => {
    setRequestSubject(""); setRequestTopic(""); setRequestSemester(""); setRequestDescription("");
  };

  const markRequestFulfilled = async (requestId: string) => {
    if (!user) return;
    const { error } = await supabase.from("note_requests").update({ is_fulfilled: true }).eq("id", requestId).eq("user_id", user.id);
    if (error) toast.error("Failed to update");
    else { toast.success("Marked as fulfilled!"); fetchNoteRequests(); }
  };

  // Filter + sort
  let filteredNotes = notes.filter((note) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = note.title.toLowerCase().includes(query) || note.subject.toLowerCase().includes(query) || (note.semester && note.semester.toLowerCase().includes(query));
    const matchesType = typeFilter === "all" || note.note_type === typeFilter;
    return matchesSearch && matchesType;
  });

  if (sortBy === "top_rated") {
    filteredNotes = [...filteredNotes].sort((a, b) => (b.rating || 0) - (a.rating || 0));
  } else if (sortBy === "most_rated") {
    filteredNotes = [...filteredNotes].sort((a, b) => (b.rating_count || 0) - (a.rating_count || 0));
  }

  const getNoteTypeBadge = (note: Note) => {
    if (note.note_type === "premium") {
      return (
        <Badge className="bg-gradient-to-r from-yellow-500 to-amber-600 text-white border-0 gap-1 animate-pulse">
          <Crown className="w-3 h-3" /> Premium
        </Badge>
      );
    }
    if (note.note_type === "paid") {
      return <Badge variant="secondary" className="gap-1">₹{note.price}</Badge>;
    }
    return <Badge variant="outline" className="text-xs">Free</Badge>;
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">Notes Sharing</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Card className="p-6 bg-gradient-card shadow-card">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold mb-2">Study Materials Hub</h2>
                <p className="text-muted-foreground">Access shared notes, contribute your own, or request specific materials</p>
              </div>
              <div className="flex gap-3">
                <Dialog open={requestDialogOpen} onOpenChange={setRequestDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="gap-2"><MessageSquarePlus className="w-4 h-4" />Request Notes</Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader><DialogTitle>Request Notes</DialogTitle></DialogHeader>
                    <form onSubmit={handleRequestSubmit} className="space-y-4">
                      <div>
                        <Label>Subject *</Label>
                        <Select value={requestSubject} onValueChange={setRequestSubject}>
                          <SelectTrigger className="mt-1"><SelectValue placeholder="Select subject" /></SelectTrigger>
                          <SelectContent>{SUBJECTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Topic/Unit *</Label>
                        <Input value={requestTopic} onChange={(e) => setRequestTopic(e.target.value)} placeholder="e.g., Binary Trees" required className="mt-1" />
                      </div>
                      <div>
                        <Label>Semester</Label>
                        <Select value={requestSemester} onValueChange={setRequestSemester}>
                          <SelectTrigger className="mt-1"><SelectValue placeholder="Select semester" /></SelectTrigger>
                          <SelectContent>{SEMESTERS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Additional Details</Label>
                        <Textarea value={requestDescription} onChange={(e) => setRequestDescription(e.target.value)} placeholder="Any specific requirements..." className="mt-1" rows={3} />
                      </div>
                      <Button type="submit" className="w-full">Submit Request</Button>
                    </form>
                  </DialogContent>
                </Dialog>

                <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="gap-2"><Upload className="w-4 h-4" />Upload Note</Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                    <DialogHeader><DialogTitle>Upload Note</DialogTitle></DialogHeader>
                    <form onSubmit={handleUpload} className="space-y-4">
                      <div>
                        <Label>Title *</Label>
                        <Input value={uploadTitle} onChange={(e) => setUploadTitle(e.target.value)} placeholder="e.g., Data Structures Unit 1 Notes" required className="mt-1" />
                      </div>
                      <div>
                        <Label>Subject *</Label>
                        <Select value={uploadSubject} onValueChange={setUploadSubject}>
                          <SelectTrigger className="mt-1"><SelectValue placeholder="Select subject" /></SelectTrigger>
                          <SelectContent>{SUBJECTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Semester</Label>
                        <Select value={uploadSemester} onValueChange={setUploadSemester}>
                          <SelectTrigger className="mt-1"><SelectValue placeholder="Select semester" /></SelectTrigger>
                          <SelectContent>{SEMESTERS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Visibility *</Label>
                        <Select value={uploadNoteType} onValueChange={setUploadNoteType}>
                          <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="free">Free — Anyone can access</SelectItem>
                            {isPremium && <SelectItem value="premium">Premium Only 👑</SelectItem>}
                            {isPremium && <SelectItem value="paid">Paid — Set your price</SelectItem>}
                          </SelectContent>
                        </Select>
                        {!isPremium && (
                          <p className="text-xs text-muted-foreground mt-1">
                            <Crown className="w-3 h-3 inline mr-1" />
                            Upgrade to Premium to publish premium/paid notes
                          </p>
                        )}
                      </div>
                      {uploadNoteType === "paid" && (
                        <div>
                          <Label>Price (₹10 - ₹999) *</Label>
                          <Input type="number" min={10} max={999} value={uploadPrice} onChange={(e) => setUploadPrice(e.target.value)} placeholder="e.g., 49" required className="mt-1" />
                        </div>
                      )}
                      <div>
                        <Label>File (PDF, DOC, DOCX, Images) *</Label>
                        <Input type="file" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" onChange={(e) => setUploadFile(e.target.files?.[0] || null)} required className="mt-1" />
                      </div>
                      <Button type="submit" className="w-full" disabled={uploading}>
                        {uploading ? "Uploading..." : "Upload Note"}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </Card>
        </div>

        {/* Search + Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search notes..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[140px]"><Filter className="w-4 h-4 mr-2" /><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="free">Free</SelectItem>
              <SelectItem value="premium">Premium</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[150px]"><SortAsc className="w-4 h-4 mr-2" /><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="latest">Latest</SelectItem>
              <SelectItem value="top_rated">Top Rated</SelectItem>
              <SelectItem value="most_rated">Most Rated</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Tabs defaultValue="notes" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="notes" className="gap-2"><FileText className="w-4 h-4" />All Notes ({filteredNotes.length})</TabsTrigger>
            <TabsTrigger value="requests" className="gap-2"><MessageSquarePlus className="w-4 h-4" />Requests ({noteRequests.filter(r => !r.is_fulfilled).length})</TabsTrigger>
          </TabsList>

          <TabsContent value="notes">
            {loading ? (
              <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" /></div>
            ) : filteredNotes.length === 0 ? (
              <Card className="p-12 text-center">
                <Upload className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">{searchQuery ? "No notes found" : "No notes yet"}</h3>
                <p className="text-muted-foreground mb-4">{searchQuery ? "Try a different search term" : "Be the first to share study materials"}</p>
                {!searchQuery && <Button onClick={() => setUploadDialogOpen(true)}>Upload Your First Note</Button>}
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredNotes.map((note) => (
                  <Card key={note.id} className={`p-6 hover:shadow-elegant transition-all group relative ${note.note_type === "premium" ? "border-yellow-500/30" : ""}`}>
                    {/* Type badge */}
                    <div className="absolute top-3 right-3">{getNoteTypeBadge(note)}</div>

                    <div className="flex items-start justify-between mb-4 pr-20">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors flex items-center gap-2">
                          {note.note_type === "premium" && <Crown className="w-4 h-4 text-yellow-500 flex-shrink-0" />}
                          {note.title}
                        </h3>
                        <p className="text-sm text-muted-foreground">{note.subject}</p>
                      </div>
                    </div>

                    {/* Uploader info */}
                    <div className="flex items-center gap-2 mb-3">
                      <Avatar className="w-6 h-6">
                        <AvatarImage src={note.profile?.avatar_url} />
                        <AvatarFallback className="text-xs bg-primary/10">
                          {note.profile?.full_name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || <User className="w-3 h-3" />}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-muted-foreground">
                        Shared by <span className="font-medium text-foreground">{note.profile?.full_name || "Anonymous"}</span>
                      </span>
                    </div>

                    {/* Rating */}
                    <div className="flex items-center gap-2 mb-3">
                      <button
                        onClick={() => { setReviewNoteId(note.id); setReviewNoteTitle(note.title); }}
                        className="flex items-center gap-1 text-sm hover:text-primary transition-colors"
                      >
                        <Star className={`w-4 h-4 ${note.rating && note.rating > 0 ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`} />
                        <span>{note.rating && note.rating > 0 ? Number(note.rating).toFixed(1) : "Rate"}</span>
                        {note.rating_count && note.rating_count > 0 && (
                          <span className="text-muted-foreground">({note.rating_count})</span>
                        )}
                      </button>
                    </div>

                    {note.semester && (
                      <div className="inline-block px-2 py-1 bg-muted rounded text-xs mb-4">{note.semester}</div>
                    )}

                    <div className="flex gap-2 mb-3">
                      <Button variant="outline" size="sm" className="flex-1 gap-2" onClick={() => handleNoteAction(note, "view")}>
                        {canAccessNote(note) ? <Eye className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                        View
                      </Button>
                      <Button variant="default" size="sm" className="flex-1 gap-2" onClick={() => handleNoteAction(note, "download")}>
                        {canAccessNote(note) ? <Download className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                        Download
                      </Button>
                    </div>

                    {/* Edit/Delete for owner */}
                    {user?.id === note.user_id && (
                      <div className="flex gap-2 pt-3 border-t">
                        <Button variant="ghost" size="sm" className="flex-1 gap-2 text-muted-foreground hover:text-primary" onClick={() => openEditDialog(note)}>
                          <Pencil className="w-4 h-4" /> Edit
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="flex-1 gap-2 text-muted-foreground hover:text-destructive">
                              <Trash2 className="w-4 h-4" /> Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Note</AlertDialogTitle>
                              <AlertDialogDescription>Are you sure you want to delete "{note.title}"?</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(note.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="requests">
            {noteRequests.length === 0 ? (
              <Card className="p-12 text-center">
                <MessageSquarePlus className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">No requests yet</h3>
                <p className="text-muted-foreground mb-4">Request notes you need</p>
                <Button onClick={() => setRequestDialogOpen(true)}>Make First Request</Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {noteRequests.map((request) => (
                  <Card key={request.id} className={`p-6 transition-all ${request.is_fulfilled ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800" : "hover:shadow-elegant"}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {request.is_fulfilled ? <CheckCircle className="w-5 h-5 text-green-600" /> : <Clock className="w-5 h-5 text-orange-500" />}
                        <span className={`text-sm font-medium ${request.is_fulfilled ? "text-green-600" : "text-orange-500"}`}>
                          {request.is_fulfilled ? "Fulfilled" : "Pending"}
                        </span>
                      </div>
                      {request.semester && <span className="px-2 py-1 bg-muted rounded text-xs">{request.semester}</span>}
                    </div>
                    <h3 className="font-semibold text-lg mb-1">{request.topic}</h3>
                    <p className="text-sm text-muted-foreground mb-3">{request.subject}</p>
                    {request.description && <p className="text-sm text-muted-foreground mb-4 italic">"{request.description}"</p>}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{new Date(request.created_at || "").toLocaleDateString()}</span>
                      {!request.is_fulfilled && user?.id === request.user_id && (
                        <Button variant="outline" size="sm" onClick={() => markRequestFulfilled(request.id)}>Mark Fulfilled</Button>
                      )}
                      {!request.is_fulfilled && user?.id !== request.user_id && (
                        <Button variant="default" size="sm" onClick={() => setUploadDialogOpen(true)}>
                          <Upload className="w-4 h-4 mr-1" /> Contribute
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Edit Note Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Edit Note</DialogTitle></DialogHeader>
            <form onSubmit={handleEdit} className="space-y-4">
              <div>
                <Label>Title *</Label>
                <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} required className="mt-1" />
              </div>
              <div>
                <Label>Subject *</Label>
                <Select value={editSubject} onValueChange={setEditSubject}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{SUBJECTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Semester</Label>
                <Select value={editSemester} onValueChange={setEditSemester}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select semester" /></SelectTrigger>
                  <SelectContent>{SEMESTERS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full">Save Changes</Button>
            </form>
          </DialogContent>
        </Dialog>

        {/* Locked Note Dialog */}
        <Dialog open={lockedDialogOpen} onOpenChange={setLockedDialogOpen}>
          <DialogContent className="max-w-sm text-center">
            <div className="py-6">
              <Lock className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              {lockedNoteType === "premium" ? (
                <>
                  <h3 className="text-xl font-bold mb-2">This is Premium Notes 👑</h3>
                  <p className="text-muted-foreground mb-6">Upgrade to Premium to access this content</p>
                  <Button onClick={() => { setLockedDialogOpen(false); navigate("/premium"); }} className="w-full bg-gradient-to-r from-yellow-500 to-amber-600 text-white">
                    <Crown className="w-4 h-4 mr-2" /> Upgrade to Premium ₹199
                  </Button>
                </>
              ) : (
                <>
                  <h3 className="text-xl font-bold mb-2">Paid Note</h3>
                  <p className="text-muted-foreground mb-2">This note costs ₹{lockedNotePrice}</p>
                  <p className="text-xs text-muted-foreground mb-6">Payment will be recorded. Contact the creator for payment details.</p>
                  <Button onClick={handlePurchaseNote} className="w-full">
                    Unlock for ₹{lockedNotePrice}
                  </Button>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Review Dialog */}
        {reviewNoteId && (
          <NoteReviewDialog
            open={!!reviewNoteId}
            onOpenChange={(open) => { if (!open) setReviewNoteId(null); }}
            noteId={reviewNoteId}
            noteTitle={reviewNoteTitle}
            userId={user?.id || null}
            canReview={canAccessNote(notes.find((n) => n.id === reviewNoteId) || notes[0])}
          />
        )}
      </main>
    </div>
  );
};

export default Notes;
