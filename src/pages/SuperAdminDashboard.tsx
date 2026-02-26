import { useState, useEffect, useCallback } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Package, LogOut, Loader2, Plus, Pencil, Trash2,
  Users, ShieldCheck, Search, Check, X, RefreshCw,
  Sun, Moon, ChevronLeft, ChevronRight, Vote, UserCheck,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { dbGetAllAdminAssignments } from "@/lib/db";
import { ElectionManager } from "@/components/voting/ElectionManager";
import { VoterApprovalManager } from "@/components/voting/VoterApprovalManager";

interface Category {
  id: string;
  name: string;
  is_assigned: boolean;
  created_at: string;
}

interface AdminAssignment {
  admin_user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  whatsapp: string | null;
  category_id: string | null;
  category_name: string | null;
  revealed_at: string | null;
}

interface AdminSummary {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  whatsapp: string | null;
  categories: { id: string; name: string; revealed_at: string }[];
}

// ThemeToggle moved to src/components/ThemeToggle.tsx

export default function SuperAdminDashboard() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [admins, setAdmins] = useState<AdminSummary[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [loadingAdmins, setLoadingAdmins] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "elections" | "approvals">("overview");

  // Category form state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [newCatName, setNewCatName] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchCategories = useCallback(async () => {
    setLoadingCats(true);
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, is_assigned, created_at")
        .order("created_at");
      if (error) throw error;
      setCategories(data || []);
    } catch {
      toast.error("Failed to load categories.");
    } finally {
      setLoadingCats(false);
    }
  }, []);

  const fetchAdmins = useCallback(async () => {
    setLoadingAdmins(true);
    try {
      const { data, error } = await dbGetAllAdminAssignments();
      if (error) throw error;
      const map = new Map<string, AdminSummary>();
      ((data as AdminAssignment[]) || []).forEach((row) => {
        if (!map.has(row.admin_user_id)) {
          map.set(row.admin_user_id, {
            user_id: row.admin_user_id,
            first_name: row.first_name,
            last_name: row.last_name,
            email: row.email,
            whatsapp: row.whatsapp,
            categories: [],
          });
        }
        if (row.category_id && row.category_name) {
          map.get(row.admin_user_id)!.categories.push({
            id: row.category_id,
            name: row.category_name,
            revealed_at: row.revealed_at!,
          });
        }
      });
      setAdmins(Array.from(map.values()));
    } catch {
      toast.error("Failed to load admin data.");
    } finally {
      setLoadingAdmins(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
    fetchAdmins();
  }, [fetchCategories, fetchAdmins]);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("categories").insert({ name: newCatName.trim() });
      if (error) throw error;
      setNewCatName("");
      toast.success("Category added!");
      fetchCategories();
    } catch {
      toast.error("Failed to add category.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEdit = async (id: string) => {
    if (!editingName.trim()) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("categories")
        .update({ name: editingName.trim() })
        .eq("id", id);
      if (error) throw error;
      setEditingId(null);
      toast.success("Category updated!");
      fetchCategories();
    } catch {
      toast.error("Failed to update category.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete category "${name}"? This cannot be undone.`)) return;
    try {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
      toast.success("Category deleted.");
      fetchCategories();
    } catch {
      toast.error("Failed to delete category.");
    }
  };

  const handleSignOut = async () => { await supabase.auth.signOut(); };

  const filteredAdmins = admins.filter((a) =>
    `${a.first_name} ${a.last_name} ${a.email}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalAssigned = categories.filter((c) => c.is_assigned).length;
  const totalAvailable = categories.filter((c) => !c.is_assigned).length;
  const fullyAssigned = admins.filter((a) => a.categories.length >= 2).length;

  return (
    <div className="min-h-screen flex w-full bg-background">
      {/* ── Categories Sidebar ── */}
      <aside
        className={cn(
          "relative flex flex-col border-r border-border bg-sidebar transition-all duration-300 shrink-0",
          sidebarOpen ? "w-72" : "w-14"
        )}
      >
        {/* Sidebar header */}
        <div className="flex items-center justify-between h-16 px-3 border-b border-sidebar-border">
          {sidebarOpen && (
            <div className="flex items-center gap-2 overflow-hidden">
              <Package className="w-4 h-4 text-sidebar-primary shrink-0" />
              <span className="font-semibold text-sm text-sidebar-foreground truncate">Categories</span>
              <span className="ml-1 text-xs bg-sidebar-primary/10 text-sidebar-primary border border-sidebar-primary/30 rounded-full px-1.5 py-0.5 font-medium">
                {categories.length}
              </span>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={cn(
              "w-7 h-7 rounded-md flex items-center justify-center text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors shrink-0",
              !sidebarOpen && "mx-auto"
            )}
          >
            {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>

        {/* Add category form */}
        {sidebarOpen && (
          <div className="px-3 py-3 border-b border-sidebar-border">
            <form onSubmit={handleAddCategory} className="flex gap-1.5">
              <Input
                placeholder="New category..."
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                className="h-8 text-sm bg-sidebar-accent border-sidebar-border"
              />
              <Button
                type="submit"
                size="sm"
                disabled={saving || !newCatName.trim()}
                className="h-8 w-8 p-0 bg-sidebar-primary text-sidebar-primary-foreground shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </form>
          </div>
        )}

        {/* Category list */}
        <div className="flex-1 overflow-y-auto py-2">
          {loadingCats ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-5 h-5 text-sidebar-primary animate-spin" />
            </div>
          ) : categories.length === 0 ? (
            sidebarOpen ? (
              <div className="text-center py-8 px-3 text-sidebar-foreground/40 text-xs">
                No categories yet
              </div>
            ) : null
          ) : (
            categories.map((cat) => (
              <div
                key={cat.id}
                className={cn(
                  "group flex items-center gap-2 px-3 py-2 mx-1 rounded-lg transition-colors",
                  cat.is_assigned
                    ? "text-sidebar-primary"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent"
                )}
              >
                {/* Status dot */}
                <div
                  className={cn(
                    "w-2 h-2 rounded-full shrink-0",
                    cat.is_assigned ? "bg-sidebar-primary" : "bg-sidebar-foreground/30"
                  )}
                />
                {sidebarOpen && (
                  <>
                    {editingId === cat.id ? (
                      <Input
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        autoFocus
                        className="h-6 text-xs flex-1 bg-sidebar-accent border-sidebar-border py-0 px-1"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveEdit(cat.id);
                          if (e.key === "Escape") setEditingId(null);
                        }}
                      />
                    ) : (
                      <span className="text-xs flex-1 truncate font-medium">{cat.name}</span>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      {editingId === cat.id ? (
                        <>
                          <button
                            onClick={() => handleSaveEdit(cat.id)}
                            className="p-1 rounded text-sidebar-primary hover:bg-sidebar-accent"
                            disabled={saving}
                          >
                            <Check className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="p-1 rounded text-sidebar-foreground/60 hover:bg-sidebar-accent"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => { setEditingId(cat.id); setEditingName(cat.name); }}
                            className="p-1 rounded text-sidebar-foreground/40 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleDelete(cat.id, cat.name)}
                            disabled={cat.is_assigned}
                            className="p-1 rounded text-sidebar-foreground/40 hover:text-destructive hover:bg-sidebar-accent disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-black text-sm select-none">
                M
              </div>
              <span className="font-bold text-lg text-primary">MegaOdds</span>
              <span className="text-xs bg-primary/10 border border-primary/30 text-primary rounded-full px-2 py-0.5 font-medium">
                Super Admin
              </span>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
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

        <main className="flex-1 px-6 py-8 space-y-6 overflow-y-auto">
          {/* Tabs */}
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1 w-fit">
            {([
              { key: "overview", label: "Overview", icon: Users },
              { key: "elections", label: "Elections", icon: Vote },
              { key: "approvals", label: "Approvals", icon: UserCheck },
            ] as const).map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                  activeTab === key ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>

          {activeTab === "overview" && (
          <>
          {/* Page title */}
          <div className="float-in">
            <h1 className="text-3xl font-bold">
              <span className="text-glow text-primary">Admin</span>{" "}Overview
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              View all admin assignments and category statistics
            </p>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 float-in">
            {[
              { label: "Total Categories", value: categories.length, icon: Package },
              { label: "Assigned", value: totalAssigned, icon: Check },
              { label: "Available", value: totalAvailable, icon: Package },
              { label: "Admins Done", value: `${fullyAssigned}/${admins.length}`, icon: Users },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </div>
                <div className="text-2xl font-bold text-primary">{value}</div>
              </div>
            ))}
          </div>

          {/* Admin list */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search admins..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-muted border-border"
                />
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { fetchAdmins(); fetchCategories(); }}
                className="gap-1.5 text-muted-foreground"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Refresh
              </Button>
            </div>

            {loadingAdmins ? (
              <div className="flex justify-center py-16">
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
              </div>
            ) : filteredAdmins.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>{admins.length === 0 ? "No admins have logged in yet." : "No admins match your search."}</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {filteredAdmins.map((admin) => (
                  <div
                    key={admin.user_id}
                    className="bg-card border border-border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-4"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">
                          {admin.first_name} {admin.last_name}
                        </span>
                        <span className={cn(
                          "text-xs rounded-full px-2 py-0.5 font-medium border",
                          admin.categories.length >= 2
                            ? "bg-primary/10 border-primary/30 text-primary"
                            : "bg-muted border-border text-muted-foreground"
                        )}>
                          {admin.categories.length}/2
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground space-y-0.5">
                        <div>{admin.email}</div>
                        {admin.whatsapp && <div>📱 {admin.whatsapp}</div>}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {admin.categories.length === 0 ? (
                        <span className="text-xs text-muted-foreground italic">No categories yet</span>
                      ) : (
                        admin.categories.map((cat) => (
                          <span
                            key={cat.id}
                            className="flex items-center gap-1.5 text-xs bg-primary/10 border border-primary/30 text-primary rounded-lg px-3 py-1.5 font-medium"
                          >
                            <Package className="w-3 h-3" />
                            {cat.name}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          </>
          )}

          {activeTab === "elections" && (
            <div className="float-in">
              <h1 className="text-3xl font-bold mb-1">
                <span className="text-glow text-primary">Elections</span>{" "}Management
              </h1>
              <p className="text-muted-foreground text-sm mb-6">Create and manage voting polls with candidates</p>
              <ElectionManager />
            </div>
          )}

          {activeTab === "approvals" && (
            <div className="float-in">
              <h1 className="text-3xl font-bold mb-1">
                <span className="text-glow text-primary">Voter</span>{" "}Approvals
              </h1>
              <p className="text-muted-foreground text-sm mb-6">Approve or reject users requesting to vote</p>
              <VoterApprovalManager />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
