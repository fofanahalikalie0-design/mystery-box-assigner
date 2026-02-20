import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/context/AuthContext";
import { MysteryBox } from "@/components/MysteryBox";
import { AssignedCategories } from "@/components/AssignedCategories";
import { Button } from "@/components/ui/button";
import { Package, LogOut, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface Category {
  id: string;
  name: string;
  is_assigned: boolean;
}

interface AdminCategory {
  id: string;
  category_id: string;
  revealed_at: string;
  categories: {
    name: string;
  };
}

interface RevealedCategory {
  id: string;
  name: string;
  revealed_at: string;
}

export default function Dashboard() {
  const { user } = useAuthContext();
  const [categories, setCategories] = useState<Category[]>([]);
  const [assignedCategories, setAssignedCategories] = useState<RevealedCategory[]>([]);
  const [revealedBoxes, setRevealedBoxes] = useState<Record<string, string>>({}); // categoryId -> name
  const [loading, setLoading] = useState(true);
  const [revealing, setRevealing] = useState<string | null>(null);

  const canPick = assignedCategories.length < 2;

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Fetch all categories
      const { data: cats, error: catsError } = await supabase
        .from("categories")
        .select("id, name, is_assigned")
        .order("created_at");

      if (catsError) throw catsError;

      // Fetch this admin's assigned categories
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

      // Pre-populate revealed boxes state
      const revealedMap: Record<string, string> = {};
      revealed.forEach((r) => {
        revealedMap[r.id] = r.name;
      });
      setRevealedBoxes(revealedMap);
    } catch (err) {
      toast.error("Failed to load data. Please refresh.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
        // Refresh to get latest state
        await fetchData();
        return;
      }

      const catName = result.category_name!;

      // Update local state
      setRevealedBoxes((prev) => ({ ...prev, [categoryId]: catName }));
      setCategories((prev) =>
        prev.map((c) => (c.id === categoryId ? { ...c, is_assigned: true } : c))
      );
      setAssignedCategories((prev) => [
        ...prev,
        { id: categoryId, name: catName, revealed_at: new Date().toISOString() },
      ]);

      toast.success(`🎉 You got: ${catName}!`);
    } catch (err: unknown) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setRevealing(null);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="min-h-screen grid-bg">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
              <Package className="w-4 h-4 text-primary" />
            </div>
            <span className="font-bold text-lg text-primary">MysteryDrop</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:block truncate max-w-[200px]">
              {user?.email}
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
        {/* Page title */}
        <div className="text-center space-y-2 float-in">
          <h1 className="text-3xl sm:text-4xl font-bold">
            {canPick ? (
              <>
                <span className="text-glow text-primary">Choose Your</span>{" "}
                <span>Categories</span>
              </>
            ) : (
              <>
                <span className="text-glow text-primary">Your</span>{" "}
                <span>Categories</span>
              </>
            )}
          </h1>
          <p className="text-muted-foreground text-sm">
            {canPick
              ? `Pick ${2 - assignedCategories.length} more categor${2 - assignedCategories.length === 1 ? "y" : "ies"} from the mystery boxes below`
              : "You've selected all your categories. No one else can take these."}
          </p>
          <div className="flex items-center justify-center gap-2 mt-2">
            <span className="text-xs bg-primary/10 border border-primary/30 text-primary rounded-full px-3 py-1 font-medium">
              {assignedCategories.length} / 2 assigned
            </span>
          </div>
        </div>

        {/* Assigned categories summary */}
        {assignedCategories.length > 0 && (
          <AssignedCategories
            categories={assignedCategories}
          />
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

            {categories.length === 0 && (
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
