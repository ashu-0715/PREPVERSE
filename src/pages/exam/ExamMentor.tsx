import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sparkles, Send, User, Loader2, AlertCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "Explain process synchronization with a real-world example",
  "Difference between B-tree and B+ tree?",
  "Solve: shortest path with negative weights — which algorithm?",
  "TCP vs UDP — when to use each in GATE questions",
];

export default function ExamMentor() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || loading) return;
    const next: Msg[] = [...messages, { role: "user", content }];
    setMessages(next);
    setInput("");
    setLoading(true);

    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/exam-mentor-chat`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: next }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Request failed" }));
        throw new Error(err.error || "Request failed");
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let assistant = "";
      setMessages((m) => [...m, { role: "assistant", content: "" }]);
      let buf = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() || "";
        for (const line of lines) {
          const t = line.trim();
          if (!t.startsWith("data:")) continue;
          const data = t.slice(5).trim();
          if (data === "[DONE]") continue;
          try {
            const json = JSON.parse(data);
            const delta = json.choices?.[0]?.delta?.content;
            if (delta) {
              assistant += delta;
              setMessages((m) => {
                const copy = [...m];
                copy[copy.length - 1] = { role: "assistant", content: assistant };
                return copy;
              });
            }
          } catch { /* ignore */ }
        }
      }
    } catch (e: any) {
      toast.error(e.message || "AI error");
      setMessages((m) => m.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid lg:grid-cols-[1fr_280px] gap-4 h-[calc(100vh-180px)]">
      <Card className="flex flex-col overflow-hidden bg-card/50 backdrop-blur">
        <div className="px-4 py-3 border-b border-border/40 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">PrepVerse Mentor</h3>
            <p className="text-[10px] text-muted-foreground">GATE CSE · AI tutor</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center gap-3 text-muted-foreground">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-600/20 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-indigo-400" />
              </div>
              <div>
                <p className="font-medium text-foreground">Ask me anything about GATE CSE</p>
                <p className="text-xs">Algorithms, OS, DBMS, CN, TOC — I've got you.</p>
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} className={`flex gap-3 ${m.role === "user" ? "justify-end" : ""}`}>
              {m.role === "assistant" && (
                <Avatar className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600">
                  <AvatarFallback className="bg-transparent"><Sparkles className="w-4 h-4 text-white" /></AvatarFallback>
                </Avatar>
              )}
              <div className={`max-w-[80%] rounded-xl px-4 py-2.5 text-sm ${
                m.role === "user"
                  ? "bg-gradient-to-br from-indigo-500 to-purple-600 text-white"
                  : "bg-muted/60"
              }`}>
                {m.role === "assistant" ? (
                  <div className="prose prose-sm prose-invert max-w-none prose-pre:bg-background/50 prose-pre:text-xs">
                    <ReactMarkdown>{m.content || "…"}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap">{m.content}</p>
                )}
              </div>
              {m.role === "user" && (
                <Avatar className="w-8 h-8">
                  <AvatarFallback><User className="w-4 h-4" /></AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}

          {loading && messages[messages.length - 1]?.role === "user" && (
            <div className="flex gap-3">
              <Avatar className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600">
                <AvatarFallback className="bg-transparent"><Sparkles className="w-4 h-4 text-white" /></AvatarFallback>
              </Avatar>
              <div className="bg-muted/60 rounded-xl px-4 py-2.5 text-sm flex items-center gap-2">
                <Loader2 className="w-3 h-3 animate-spin" /> Thinking…
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        <div className="border-t border-border/40 p-3 flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
            }}
            placeholder="Ask about any GATE CSE topic…"
            rows={1}
            className="resize-none min-h-[40px] max-h-32"
            disabled={loading}
          />
          <Button onClick={() => send()} disabled={loading || !input.trim()} className="bg-gradient-to-r from-indigo-500 to-purple-600">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      </Card>

      <div className="space-y-3">
        <Card className="p-4">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Quick Asks</h4>
          <div className="space-y-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                disabled={loading}
                className="w-full text-left text-xs p-2 rounded-md border border-border/40 hover:border-indigo-500/40 hover:bg-indigo-500/5 transition-colors disabled:opacity-50"
              >
                {s}
              </button>
            ))}
          </div>
        </Card>
        <Card className="p-4 bg-amber-500/5 border-amber-500/30">
          <div className="flex gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              AI may make mistakes. Cross-check critical formulas with standard textbooks.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}