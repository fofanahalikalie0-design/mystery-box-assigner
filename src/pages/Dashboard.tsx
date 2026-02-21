import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/context/AuthContext";
import { MysteryBox } from "@/components/MysteryBox";
import { AssignedCategories } from "@/components/AssignedCategories";
import { Button } from "@/components/ui/button";
import { Package, LogOut, Loader2, RefreshCw, Clock, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useCountdown } from "@/hooks/useCountdown";
import { cn } from "@/lib/utils";

interface Category {
  id: string;
  name: string;
  is_assigned: boolean;
}

interface AdminCategory {
  id: string;
  category_id: string;
  revealed_at: string;
  categories: { name: string };
}

interface RevealedCategory {
  id: string;
  name: string;
  revealed_at: string;
}

const PICK_WINDOW_SECONDS = 20 * 60; // 20 minutes
const LOGOUT_AFTER_DONE_SECONDS = 5 * 60; // 5 minutes

export default function Dashboard() {
  const { user, profile } = useAuthContext();
  const [categories, setCategories] = useState<Category[]>([]);
  const [assignedCategories, setAssignedCategories] = useState<RevealedCategory[]>([]);
  const [revealedBoxes, setRevealedBoxes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [revealing, setRevealing] = useState<string | null>(null);
  const [allDone, setAllDone] = useState(false);
  const [showDoneMessage, setShowDoneMessage] = useState(false);

  const canPick = assignedCategories.length < 2;

  // 20-minute window to pick
  const pickTimer = useCountdown(PICK_WINDOW_SECONDS, true, async () => {
    if (canPick) {
      toast.error("⏰ Time is up! You have been logged out.");
      await supabase.auth.signOut();
    }
  });

  // 5-minute logout timer after done (starts paused)
  const logoutTimer = useCountdown(LOGOUT_AFTER_DONE_SECONDS, false, async () => {
    await supabase.auth.signOut();
  });

  // When all done: stop pick timer, start logout timer
  useEffect(() => {
    if (allDone) {
      pickTimer.stop();
      logoutTimer.start();
    }
  }, [allDone]);

  useEffect(() => {
    if (!canPick && !loading && assignedCategories.length === 2 && !allDone) {
      setAllDone(true);
      setShowDoneMessage(true);
    }
  }, [canPick, loading, assignedCategories.length, allDone]);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: cats, error: catsError } = await supabase
        .from("categories")
        .select("id, name, is_assigned")
        .order("created_at");
      if (catsError) throw catsError;

      const { data: adminCats, error: adminCatsError } = await supabase
        .from("admin_categories")
        .select("id, category_id, revealed_at, categories(name)")
        .eq("admin_id", user.id);
      if (adminCatsError) throw adminCatsError;

      setCategories(cats || []);

      const myAssigned = (adminCats as unknown as AdminCategory[]) || [];
      const revealed: RevealedCategory[] = myAssigned.map((ac) => ({
        id: ac.category_id,
        name: ac.categories.name,
        revealed_at: ac.revealed_at,
      }));
      setAssignedCategories(revealed);

      const revealedMap: Record<string, string> = {};
      revealed.forEach((r) => { revealedMap[r.id] = r.name; });
      setRevealedBoxes(revealedMap);

      if (revealed.length >= 2) {
        setAllDone(true);
      }
    } catch {
      toast.error("Failed to load data. Please refresh.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleReveal = async (categoryId: string) => {
    if (!user || revealing || !canPick) return;
    setRevealing(categoryId);
    try {
      const { data, error } = await supabase.rpc("assign_category_to_admin", {
        p_admin_id: user.id,
        p_category_id: categoryId,
      });
      if (error) throw error;

      const result = data as { success: boolean; error?: string; category_name?: string };
      if (!result.success) {
        toast.error(result.error || "Failed to assign category.");
        await fetchData();
        return;
      }

      const catName = result.category_name!;
      setRevealedBoxes((prev) => ({ ...prev, [categoryId]: catName }));
      setCategories((prev) =>
        prev.map((c) => (c.id === categoryId ? { ...c, is_assigned: true } : c))
      );
      const newAssigned = [
        ...assignedCategories,
        { id: categoryId, name: catName, revealed_at: new Date().toISOString() },
      ];
      setAssignedCategories(newAssigned);
      toast.success(`🎉 You got: ${catName}!`);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setRevealing(null);
    }
  };

  const handleSignOut = async () => { await supabase.auth.signOut(); };

  const lastName = profile?.last_name ?? user?.email?.split("@")[0] ?? "Admin";

  return (
    <div className="min-h-screen grid-bg">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
              <Package className="w-4 h-4 text-primary" />
            </div>
            <span className="font-bold text-lg text-primary">MegaOdds</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Countdown timers */}
            {canPick && !loading && (
              <div className={cn(
                "flex items-center gap-1.5 text-xs font-mono font-semibold px-3 py-1.5 rounded-full border",
                pickTimer.formatted.isVeryLow
                  ? "border-destructive/50 bg-destructive/10 text-destructive animate-pulse"
                  : pickTimer.formatted.isLow
                  ? "border-warning/50 bg-warning/10 text-warning"
                  : "border-primary/30 bg-primary/10 text-primary"
              )}>
                <Clock className="w-3 h-3" />
                {pickTimer.formatted.display}
              </div>
            )}
            {allDone && !canPick && (
              <div className="flex items-center gap-1.5 text-xs font-mono font-semibold px-3 py-1.5 rounded-full border border-warning/40 bg-warning/10 text-warning">
                <Clock className="w-3 h-3" />
                Logging out in {logoutTimer.formatted.display}
              </div>
            )}
            <ThemeToggle />
            <span className="text-sm text-muted-foreground hidden sm:block truncate max-w-[160px]">
              {profile?.first_name} {profile?.last_name}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="text-muted-foreground hover:text-foreground gap-1.5"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Welcome / completion banner */}
        {!loading && (
          <div className="text-center space-y-2 float-in">
            {showDoneMessage ? (
              <>
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 border border-primary/30 mb-3">
                  <CheckCircle2 className="w-7 h-7 text-primary" />
                </div>
                <h1 className="text-3xl sm:text-4xl font-bold">
                  <span className="text-glow text-primary">Thank you,</span>{" "}
                  <span>{lastName}!</span>
                </h1>
                <p className="text-muted-foreground text-sm max-w-md mx-auto">
                  Thanks for choosing your categories. You'll be logged out automatically in{" "}
                  <span className="text-primary font-semibold">{logoutTimer.formatted.display}</span>.
                </p>
              </>
            ) : (
              <>
                <h1 className="text-3xl sm:text-4xl font-bold">
                  {canPick ? (
                    <>
                      <span className="text-glow text-primary">Welcome to Category Selection,</span>{" "}
                      <span>{lastName}</span>
                    </>
                  ) : (
                    <>
                      <span className="text-glow text-primary">Your</span>{" "}
                      <span>Categories</span>
                    </>
                  )}
                </h1>
                {canPick && (
                  <p className="text-muted-foreground text-sm">
                    MegaOdds is happy to have you as admin. Pick{" "}
                    <span className="text-primary font-semibold">{2 - assignedCategories.length}</span>{" "}
                    {2 - assignedCategories.length === 1 ? "category" : "categories"} from the mystery boxes below.
                  </p>
                )}
                <div className="flex items-center justify-center gap-2 mt-2">
                  <span className="text-xs bg-primary/10 border border-primary/30 text-primary rounded-full px-3 py-1 font-medium">
                    {assignedCategories.length} / 2 assigned
                  </span>
                </div>
              </>
            )}
          </div>
        )}

        {/* Assigned categories summary */}
        {assignedCategories.length > 0 && (
          <AssignedCategories categories={assignedCategories} />
        )}

        {/* Mystery boxes grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : (
          <div>
            {canPick && (
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">
                  Mystery Boxes
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={fetchData}
                  className="gap-1.5 text-muted-foreground hover:text-foreground"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Refresh
                </Button>
              </div>
            )}

            {canPick && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {categories.map((cat, index) => {
                  const isRevealedByMe = !!revealedBoxes[cat.id];
                  const isTakenByOther = cat.is_assigned && !isRevealedByMe;
                  return (
                    <div key={cat.id} className="float-in" style={{ animationDelay: `${index * 0.04}s` }}>
                      <MysteryBox
                        categoryId={cat.id}
                        categoryName={revealedBoxes[cat.id]}
                        isRevealed={isRevealedByMe}
                        isAssigned={isTakenByOther}
                        canPick={canPick && !revealing}
                        onClick={handleReveal}
                        index={index}
                      />
                      {revealing === cat.id && (
                        <div className="flex justify-center mt-1">
                          <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {categories.length === 0 && canPick && (
              <div className="text-center py-16 text-muted-foreground">
                <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No categories available.</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
