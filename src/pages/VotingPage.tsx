import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Loader2, Vote, CheckCircle2, Users, LogOut, ArrowLeft, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { useDeviceId } from "@/hooks/useDeviceId";
import { useSiteSettings } from "@/hooks/useSiteSettings";

interface Election {
  id: string;
  title: string;
  description: string | null;
}

interface Candidate {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  vote_count: number;
}

export default function VotingPage() {
  const { user, profile } = useAuthContext();
  const navigate = useNavigate();
  const deviceId = useDeviceId();
  const { settings } = useSiteSettings();
  const [elections, setElections] = useState<Election[]>([]);
  const [selectedElection, setSelectedElection] = useState<Election | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [approvalStatus, setApprovalStatus] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [votedCandidateId, setVotedCandidateId] = useState<string | null>(null);
  const [deviceAlreadyVoted, setDeviceAlreadyVoted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);

  const siteName = settings?.site_name || "MegaOdds";
  const initial = siteName[0] || "M";

  const fetchElections = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("elections")
      .select("id, title, description")
      .eq("status", "active");
    if (error) { toast.error("Failed to load elections"); return; }
    setElections((data as Election[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchElections(); }, [fetchElections]);

  const selectElection = async (el: Election) => {
    setSelectedElection(el);
    setLoading(true);

    const [candRes, approvalRes, voteRes, deviceRes] = await Promise.all([
      supabase.from("candidates").select("*").eq("election_id", el.id).order("name"),
      supabase.from("voter_approvals").select("status").eq("election_id", el.id).eq("user_id", user!.id).maybeSingle(),
      supabase.from("votes").select("candidate_id").eq("election_id", el.id).eq("voter_id", user!.id).maybeSingle(),
      supabase.from("device_votes").select("id").eq("device_id", deviceId).eq("election_id", el.id).maybeSingle(),
    ]);

    setCandidates((candRes.data as Candidate[]) || []);
    setApprovalStatus((approvalRes.data as { status: string } | null)?.status || null);
    if (voteRes.data) {
      setHasVoted(true);
      setVotedCandidateId((voteRes.data as { candidate_id: string }).candidate_id);
    } else {
      setHasVoted(false);
      setVotedCandidateId(null);
    }
    setDeviceAlreadyVoted(!!deviceRes.data);
    setLoading(false);
  };

  const requestApproval = async () => {
    if (!selectedElection || !user) return;
    const { error } = await supabase.from("voter_approvals").insert({
      user_id: user.id,
      election_id: selectedElection.id,
    });
    if (error) toast.error("Failed to request approval");
    else { toast.success("Approval requested! Please wait for admin review."); setApprovalStatus("pending"); }
  };

  const castVote = async (candidateId: string) => {
    if (!selectedElection || voting) return;

    // Check device cookie
    if (deviceAlreadyVoted) {
      toast.error("This device has already been used to vote in this election.");
      return;
    }

    setVoting(true);
    const { data, error } = await (supabase.rpc as Function)("cast_vote", {
      p_election_id: selectedElection.id,
      p_candidate_id: candidateId,
    });
    if (error) { toast.error("Vote failed"); setVoting(false); return; }
    const result = data as { success: boolean; error?: string };
    if (!result.success) { toast.error(result.error || "Vote failed"); setVoting(false); return; }

    // Record device vote
    await supabase.from("device_votes").insert({
      device_id: deviceId,
      election_id: selectedElection.id,
      voter_id: user!.id,
    });

    toast.success("🗳️ Vote cast successfully!");
    setHasVoted(true);
    setVotedCandidateId(candidateId);
    setDeviceAlreadyVoted(true);
    setVoting(false);
  };

  const handleSignOut = async () => { await supabase.auth.signOut(); };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-black text-sm select-none">{initial}</div>
            <span className="font-bold text-lg text-primary">{siteName}</span>
            <span className="text-xs bg-primary/10 border border-primary/30 text-primary rounded-full px-2 py-0.5 font-medium">Voting</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {profile && (
              <span className="text-xs text-muted-foreground hidden sm:block">
                {profile.first_name} {profile.last_name}
              </span>
            )}
            <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-muted-foreground hover:text-foreground gap-1.5">
              <LogOut className="w-4 h-4" /><span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {!selectedElection ? (
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-3xl font-bold"><span className="text-primary text-glow">Active</span> Elections</h1>
              <p className="text-muted-foreground text-sm mt-1">Select an election to vote</p>
            </div>
            {loading ? (
              <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>
            ) : elections.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Vote className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No active elections at the moment.</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {elections.map((el) => (
                  <button
                    key={el.id}
                    onClick={() => selectElection(el)}
                    className="text-left p-5 bg-card border border-border rounded-xl hover:border-primary/40 transition-all hover:shadow-lg"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Vote className="w-5 h-5 text-primary" />
                      </div>
                      <h3 className="font-semibold text-lg">{el.title}</h3>
                    </div>
                    {el.description && <p className="text-sm text-muted-foreground mt-1">{el.description}</p>}
                    <span className="inline-flex items-center gap-1.5 text-xs text-primary mt-3 font-medium">
                      Vote now →
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <button onClick={() => { setSelectedElection(null); setCandidates([]); setApprovalStatus(null); setHasVoted(false); setDeviceAlreadyVoted(false); }}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back to elections
            </button>

            <div className="text-center">
              <h1 className="text-3xl font-bold">{selectedElection.title}</h1>
              {selectedElection.description && <p className="text-muted-foreground mt-1">{selectedElection.description}</p>}
            </div>

            {loading ? (
              <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>
            ) : deviceAlreadyVoted && !hasVoted ? (
              <div className="text-center py-12 bg-card border border-border rounded-xl">
                <AlertTriangle className="w-10 h-10 mx-auto mb-3 text-destructive opacity-70" />
                <p className="font-medium text-destructive">Device already used</p>
                <p className="text-sm text-muted-foreground mt-1">This device has already been used to vote in this election.</p>
              </div>
            ) : approvalStatus === null ? (
              <div className="text-center py-12 bg-card border border-border rounded-xl">
                <Users className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-50" />
                <p className="font-medium mb-2">You need approval to vote</p>
                <p className="text-sm text-muted-foreground mb-4">Request access to participate in this election</p>
                <Button onClick={requestApproval} className="gap-1.5"><Vote className="w-4 h-4" /> Request Approval</Button>
              </div>
            ) : approvalStatus === "pending" ? (
              <div className="text-center py-12 bg-card border border-border rounded-xl">
                <Loader2 className="w-10 h-10 mx-auto mb-3 text-primary animate-spin" />
                <p className="font-medium">Your approval is pending</p>
                <p className="text-sm text-muted-foreground mt-1">An admin will review your request shortly.</p>
              </div>
            ) : approvalStatus === "rejected" ? (
              <div className="text-center py-12 bg-card border border-border rounded-xl">
                <p className="font-medium text-destructive">Your voting request was rejected</p>
                <p className="text-sm text-muted-foreground mt-1">Contact an administrator for more information.</p>
              </div>
            ) : hasVoted ? (
              <div className="space-y-4">
                <div className="text-center py-6 bg-primary/5 border border-primary/20 rounded-xl">
                  <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-primary" />
                  <p className="font-semibold text-primary">You have voted!</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {candidates.map((c) => (
                    <CandidateCard key={c.id} candidate={c} isVoted={votedCandidateId === c.id} showVoteButton={false} />
                  ))}
                </div>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {candidates.map((c) => (
                  <CandidateCard
                    key={c.id}
                    candidate={c}
                    isVoted={false}
                    showVoteButton
                    voting={voting}
                    onVote={() => castVote(c.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function CandidateCard({
  candidate,
  isVoted,
  showVoteButton,
  voting,
  onVote,
}: {
  candidate: Candidate;
  isVoted: boolean;
  showVoteButton: boolean;
  voting?: boolean;
  onVote?: () => void;
}) {
  return (
    <div className={cn(
      "bg-card border rounded-xl overflow-hidden transition-all",
      isVoted ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-primary/40 hover:shadow-lg"
    )}>
      {candidate.image_url && (
        <div className="relative">
          <img src={candidate.image_url} alt={candidate.name} className="w-full h-44 object-cover" />
          {isVoted && (
            <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          )}
        </div>
      )}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h4 className="font-bold text-lg">{candidate.name}</h4>
            {candidate.description && <p className="text-sm text-muted-foreground mt-1">{candidate.description}</p>}
          </div>
          {!candidate.image_url && isVoted && (
            <div className="bg-primary text-primary-foreground rounded-full p-1 shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          )}
        </div>
        {isVoted && (
          <span className="inline-flex items-center gap-1 text-xs text-primary font-medium mt-2">
            <CheckCircle2 className="w-3 h-3" /> Your vote
          </span>
        )}
        {showVoteButton && (
          <Button
            size="sm"
            className="mt-3 gap-1.5 w-full"
            disabled={voting}
            onClick={onVote}
          >
            {voting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Vote className="w-3 h-3" />}
            Vote for {candidate.name}
          </Button>
        )}
      </div>
    </div>
  );
}
