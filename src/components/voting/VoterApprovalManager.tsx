import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Check, X, Search, Users, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface VoterApproval {
  id: string;
  user_id: string;
  election_id: string;
  status: string;
  requested_at: string;
  reviewed_at: string | null;
}

interface Election {
  id: string;
  title: string;
}

interface Profile {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
}

export function VoterApprovalManager() {
  const [approvals, setApprovals] = useState<(VoterApproval & { profile?: Profile; election_title?: string })[]>([]);
  const [elections, setElections] = useState<Election[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [appRes, elRes, profRes] = await Promise.all([
      supabase.from("voter_approvals").select("*").order("requested_at", { ascending: false }),
      supabase.from("elections").select("id, title"),
      supabase.from("profiles").select("user_id, first_name, last_name, email"),
    ]);

    if (appRes.error || elRes.error || profRes.error) {
      toast.error("Failed to load approval data");
      setLoading(false);
      return;
    }

    const elMap = new Map((elRes.data as Election[]).map((e) => [e.id, e.title]));
    const profMap = new Map((profRes.data as Profile[]).map((p) => [p.user_id, p]));

    const enriched = ((appRes.data as VoterApproval[]) || []).map((a) => ({
      ...a,
      profile: profMap.get(a.user_id),
      election_title: elMap.get(a.election_id) || "Unknown",
    }));

    setApprovals(enriched);
    setElections((elRes.data as Election[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleApproval = async (id: string, status: "approved" | "rejected") => {
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("voter_approvals")
      .update({ status, reviewed_at: new Date().toISOString(), reviewed_by: user!.id })
      .eq("id", id);
    if (error) toast.error("Failed to update");
    else { toast.success(`Voter ${status}`); fetchData(); }
  };

  const filtered = approvals.filter((a) => {
    if (filter !== "all" && a.status !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      const name = `${a.profile?.first_name || ""} ${a.profile?.last_name || ""} ${a.profile?.email || ""}`.toLowerCase();
      return name.includes(q);
    }
    return true;
  });

  const pendingCount = approvals.filter((a) => a.status === "pending").length;

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search voters..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-muted border-border" />
        </div>
        <div className="flex gap-1.5">
          {(["all", "pending", "approved", "rejected"] as const).map((f) => (
            <Button
              key={f}
              size="sm"
              variant={filter === f ? "default" : "outline"}
              onClick={() => setFilter(f)}
              className="capitalize text-xs"
            >
              {f}
              {f === "pending" && pendingCount > 0 && (
                <span className="ml-1 bg-primary-foreground/20 text-primary-foreground rounded-full px-1.5 text-[10px]">{pendingCount}</span>
              )}
            </Button>
          ))}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <ShieldCheck className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p>No {filter !== "all" ? filter : ""} approval requests.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((a) => (
            <div key={a.id} className="flex items-center gap-3 p-3 bg-card border border-border rounded-xl">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm shrink-0">
                {a.profile?.first_name?.[0] || "?"}{a.profile?.last_name?.[0] || ""}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">
                  {a.profile?.first_name || "Unknown"} {a.profile?.last_name || "User"}
                </div>
                <div className="text-xs text-muted-foreground truncate">{a.profile?.email}</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  Election: <span className="text-foreground font-medium">{a.election_title}</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {a.status === "pending" ? (
                  <>
                    <Button size="sm" variant="ghost" onClick={() => handleApproval(a.id, "approved")} className="text-primary hover:bg-primary/10">
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleApproval(a.id, "rejected")} className="text-destructive hover:bg-destructive/10">
                      <X className="w-4 h-4" />
                    </Button>
                  </>
                ) : (
                  <span className={cn(
                    "text-xs rounded-full px-2 py-0.5 font-medium border",
                    a.status === "approved" ? "bg-primary/10 border-primary/30 text-primary" : "bg-destructive/10 border-destructive/30 text-destructive"
                  )}>
                    {a.status}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
