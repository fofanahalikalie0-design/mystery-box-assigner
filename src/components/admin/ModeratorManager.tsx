import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Search, ShieldCheck, UserPlus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface AdminProfile {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  isModerator: boolean;
}

export function ModeratorManager() {
  const [admins, setAdmins] = useState<AdminProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [toggling, setToggling] = useState<string | null>(null);

  const fetchAdmins = useCallback(async () => {
    setLoading(true);
    const [profilesRes, rolesRes] = await Promise.all([
      supabase.from("profiles").select("user_id, first_name, last_name, email"),
      supabase.from("user_roles").select("user_id, role"),
    ]);

    if (profilesRes.error || rolesRes.error) {
      toast.error("Failed to load data");
      setLoading(false);
      return;
    }

    const roles = rolesRes.data || [];
    const adminUserIds = new Set(
      roles.filter((r) => r.role === "admin").map((r) => r.user_id)
    );
    const moderatorUserIds = new Set(
      roles.filter((r) => r.role === "moderator").map((r) => r.user_id)
    );

    const adminProfiles: AdminProfile[] = (profilesRes.data || [])
      .filter((p) => adminUserIds.has(p.user_id))
      .map((p) => ({
        ...p,
        isModerator: moderatorUserIds.has(p.user_id),
      }));

    setAdmins(adminProfiles);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAdmins(); }, [fetchAdmins]);

  const toggleModerator = async (userId: string, currentlyModerator: boolean) => {
    setToggling(userId);
    try {
      if (currentlyModerator) {
        // Remove moderator role
        const { error } = await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", userId)
          .eq("role", "moderator");
        if (error) throw error;
        toast.success("Moderator role removed");
      } else {
        // Add moderator role
        const { error } = await supabase
          .from("user_roles")
          .insert({ user_id: userId, role: "moderator" });
        if (error) throw error;
        toast.success("Moderator role assigned!");
      }
      fetchAdmins();
    } catch {
      toast.error("Failed to update role");
    } finally {
      setToggling(null);
    }
  };

  const filtered = admins.filter((a) =>
    `${a.first_name} ${a.last_name} ${a.email}`.toLowerCase().includes(search.toLowerCase())
  );

  const moderatorCount = admins.filter((a) => a.isModerator).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <span className="bg-primary/10 border border-primary/30 text-primary rounded-full px-2.5 py-0.5 text-xs font-medium">
          {moderatorCount} moderator{moderatorCount !== 1 ? "s" : ""}
        </span>
        <span>{admins.length} admin{admins.length !== 1 ? "s" : ""} total</span>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search admins..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-muted border-border" />
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <ShieldCheck className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p>No admins found.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((admin) => (
            <div key={admin.user_id} className="flex items-center gap-3 p-3 bg-card border border-border rounded-xl">
              <div className={cn(
                "w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm shrink-0",
                admin.isModerator ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
              )}>
                {admin.first_name?.[0]}{admin.last_name?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm truncate">{admin.first_name} {admin.last_name}</span>
                  {admin.isModerator && (
                    <span className="text-[10px] bg-primary/10 border border-primary/30 text-primary rounded-full px-1.5 py-0.5 font-medium">
                      Moderator
                    </span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground truncate">{admin.email}</div>
              </div>
              <Button
                size="sm"
                variant={admin.isModerator ? "outline" : "default"}
                disabled={toggling === admin.user_id}
                onClick={() => toggleModerator(admin.user_id, admin.isModerator)}
                className="shrink-0 gap-1.5 text-xs"
              >
                {toggling === admin.user_id ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : admin.isModerator ? (
                  <><Trash2 className="w-3 h-3" /> Remove</>
                ) : (
                  <><UserPlus className="w-3 h-3" /> Make Moderator</>
                )}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
