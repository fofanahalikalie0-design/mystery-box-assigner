import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus, Loader2, Trash2, Play, Square, Pencil, Check, X,
  Users, Vote, ImagePlus, ChevronDown, ChevronUp,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Election {
  id: string;
  title: string;
  description: string | null;
  status: string;
  created_at: string;
}

interface Candidate {
  id: string;
  election_id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  vote_count: number;
}

export function ElectionManager() {
  const [elections, setElections] = useState<Election[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchElections = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("elections")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) { toast.error("Failed to load elections"); return; }
    setElections((data as Election[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchElections(); }, [fetchElections]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("elections").insert({
      title: newTitle.trim(),
      description: newDesc.trim() || null,
      created_by: user!.id,
    });
    if (error) { toast.error("Failed to create election"); }
    else { toast.success("Election created!"); setNewTitle(""); setNewDesc(""); fetchElections(); }
    setSaving(false);
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    const { error } = await supabase.from("elections").update({ status: newStatus }).eq("id", id);
    if (error) toast.error("Failed to update status");
    else { toast.success(`Election ${newStatus}`); fetchElections(); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this election and all its candidates/votes?")) return;
    const { error } = await supabase.from("elections").delete().eq("id", id);
    if (error) toast.error("Failed to delete");
    else { toast.success("Deleted"); fetchElections(); }
  };

  return (
    <div className="space-y-6">
      {/* Create election form */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
          <Vote className="w-4 h-4 text-primary" /> Create Election
        </h3>
        <form onSubmit={handleCreate} className="space-y-3">
          <Input
            placeholder="Election title..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="bg-muted border-border"
          />
          <Textarea
            placeholder="Description (optional)..."
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            className="bg-muted border-border resize-none"
            rows={2}
          />
          <Button type="submit" size="sm" disabled={saving || !newTitle.trim()} className="gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Create
          </Button>
        </form>
      </div>

      {/* Election list */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
      ) : elections.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Vote className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p>No elections yet. Create one above.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {elections.map((el) => (
            <div key={el.id} className="bg-card border border-border rounded-xl overflow-hidden">
              <div
                className="p-4 flex items-center gap-3 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => setExpandedId(expandedId === el.id ? null : el.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold truncate">{el.title}</span>
                    <span className={cn(
                      "text-xs rounded-full px-2 py-0.5 font-medium border",
                      el.status === "active" ? "bg-primary/10 border-primary/30 text-primary" :
                      el.status === "closed" ? "bg-destructive/10 border-destructive/30 text-destructive" :
                      "bg-muted border-border text-muted-foreground"
                    )}>
                      {el.status}
                    </span>
                  </div>
                  {el.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{el.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {el.status === "draft" && (
                    <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); handleStatusChange(el.id, "active"); }}>
                      <Play className="w-3.5 h-3.5 text-primary" />
                    </Button>
                  )}
                  {el.status === "active" && (
                    <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); handleStatusChange(el.id, "closed"); }}>
                      <Square className="w-3.5 h-3.5 text-destructive" />
                    </Button>
                  )}
                  {el.status !== "active" && (
                    <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); handleDelete(el.id); }}>
                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                    </Button>
                  )}
                  {expandedId === el.id ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </div>
              </div>

              {expandedId === el.id && (
                <div className="border-t border-border p-4">
                  <CandidateManager electionId={el.id} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CandidateManager({ electionId }: { electionId: string }) {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchCandidates = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("candidates")
      .select("*")
      .eq("election_id", electionId)
      .order("vote_count", { ascending: false });
    if (error) toast.error("Failed to load candidates");
    setCandidates((data as Candidate[]) || []);
    setLoading(false);
  }, [electionId]);

  useEffect(() => { fetchCandidates(); }, [fetchCandidates]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setSaving(true);

    let imageUrl: string | null = null;
    if (selectedFile) {
      setUploading(true);
      const ext = selectedFile.name.split(".").pop();
      const path = `${electionId}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("candidate-images")
        .upload(path, selectedFile);
      if (uploadError) { toast.error("Image upload failed"); setUploading(false); setSaving(false); return; }
      const { data: urlData } = supabase.storage.from("candidate-images").getPublicUrl(path);
      imageUrl = urlData.publicUrl;
      setUploading(false);
    }

    const { error } = await supabase.from("candidates").insert({
      election_id: electionId,
      name: newName.trim(),
      description: newDesc.trim() || null,
      image_url: imageUrl,
    });
    if (error) toast.error("Failed to add candidate");
    else { toast.success("Candidate added!"); setNewName(""); setNewDesc(""); setSelectedFile(null); fetchCandidates(); }
    setSaving(false);
  };

  const handleDeleteCandidate = async (id: string) => {
    if (!confirm("Delete this candidate?")) return;
    const { error } = await supabase.from("candidates").delete().eq("id", id);
    if (error) toast.error("Failed to delete");
    else { toast.success("Deleted"); fetchCandidates(); }
  };

  const totalVotes = candidates.reduce((sum, c) => sum + c.vote_count, 0);

  return (
    <div className="space-y-4">
      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
        Candidates ({candidates.length})
      </h4>

      {/* Add candidate */}
      <form onSubmit={handleAdd} className="flex flex-col gap-2 p-3 bg-muted/50 rounded-lg border border-border">
        <div className="flex gap-2">
          <Input placeholder="Candidate name..." value={newName} onChange={(e) => setNewName(e.target.value)} className="bg-background border-border text-sm" />
          <label className="cursor-pointer flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground border border-border rounded-md px-2 py-1 shrink-0">
            <ImagePlus className="w-3.5 h-3.5" />
            {selectedFile ? selectedFile.name.slice(0, 12) : "Image"}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
          </label>
        </div>
        <Input placeholder="Description (optional)..." value={newDesc} onChange={(e) => setNewDesc(e.target.value)} className="bg-background border-border text-sm" />
        <Button type="submit" size="sm" disabled={saving || !newName.trim()} className="self-start gap-1.5">
          {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
          Add Candidate
        </Button>
      </form>

      {/* Candidate list with vote counts */}
      {loading ? (
        <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 text-primary animate-spin" /></div>
      ) : candidates.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-4">No candidates added yet.</p>
      ) : (
        <div className="space-y-2">
          {candidates.map((c) => {
            const pct = totalVotes > 0 ? Math.round((c.vote_count / totalVotes) * 100) : 0;
            return (
              <div key={c.id} className="flex items-center gap-3 p-3 bg-background border border-border rounded-lg">
                {c.image_url ? (
                  <img src={c.image_url} alt={c.name} className="w-10 h-10 rounded-lg object-cover shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground shrink-0">
                    <Users className="w-4 h-4" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{c.name}</div>
                  {c.description && <p className="text-xs text-muted-foreground truncate">{c.description}</p>}
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs font-semibold text-primary shrink-0">{c.vote_count} ({pct}%)</span>
                  </div>
                </div>
                <Button size="sm" variant="ghost" onClick={() => handleDeleteCandidate(c.id)} className="shrink-0">
                  <Trash2 className="w-3.5 h-3.5 text-destructive" />
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
