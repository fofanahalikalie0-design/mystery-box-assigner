import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Package, LogOut, Loader2, Plus, Pencil, Trash2,
  Users, BarChart3, ShieldCheck, Search, Check, X, RefreshCw
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { dbGetAllAdminAssignments } from "@/lib/db";

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

type Tab = "overview" | "categories";

export default function SuperAdminDashboard() {
  const [tab, setTab] = useState<Tab>("overview");
  const [categories, setCategories] = useState<Category[]>([]);
  const [admins, setAdmins] = useState<AdminSummary[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [loadingAdmins, setLoadingAdmins] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

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

      // Group rows by admin
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
      const { error } = await supabase
        .from("categories")
        .insert({ name: newCatName.trim() });
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
    <div className="min-h-screen grid-bg">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-primary" />
            </div>
            <span className="font-bold text-lg text-primary">MegaOdds</span>
            <span className="text-xs bg-primary/10 border border-primary/30 text-primary rounded-full px-2 py-0.5 font-medium">
              Super Admin
            </span>
          </div>
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
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        {/* Page title */}
        <div className="float-in">
          <h1 className="text-3xl font-bold">
            <span className="text-glow text-primary">Admin</span>{" "}Control Panel
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Manage categories and view admin assignments</p>
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

        {/* Tabs */}
        <div className="flex rounded-lg bg-muted p-1 w-fit">
          {([
            { id: "overview", label: "Admin Overview", icon: Users },
            { id: "categories", label: "Categories", icon: BarChart3 },
          ] as { id: Tab; label: string; icon: typeof Users }[]).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all",
                tab === id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {tab === "overview" && (
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
              <Button variant="ghost" size="sm" onClick={fetchAdmins} className="gap-1.5 text-muted-foreground">
                <RefreshCw className="w-3.5 h-3.5" />
                Refresh
              </Button>
            </div>

            {loadingAdmins ? (
              <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>
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
        )}

        {/* Categories Tab */}
        {tab === "categories" && (
          <div className="space-y-4">
            {/* Add category form */}
            <form onSubmit={handleAddCategory} className="flex gap-2">
              <Input
                placeholder="New category name..."
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                className="bg-muted border-border flex-1 max-w-sm"
              />
              <Button type="submit" disabled={saving || !newCatName.trim()} className="gap-1.5 bg-primary text-primary-foreground">
                <Plus className="w-4 h-4" />
                Add
              </Button>
            </form>

            {loadingCats ? (
              <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>
            ) : categories.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No categories yet. Add one above.</p>
              </div>
            ) : (
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="grid grid-cols-[1fr_auto_auto] gap-0 text-xs font-semibold text-muted-foreground uppercase tracking-widest px-4 py-2 border-b border-border">
                  <span>Name</span>
                  <span className="px-4">Status</span>
                  <span>Actions</span>
                </div>
                {categories.map((cat, i) => (
                  <div
                    key={cat.id}
                    className={cn(
                      "grid grid-cols-[1fr_auto_auto] items-center gap-0 px-4 py-3",
                      i !== 0 && "border-t border-border/50"
                    )}
                  >
                    {editingId === cat.id ? (
                      <Input
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        autoFocus
                        className="bg-muted border-border h-8 text-sm"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveEdit(cat.id);
                          if (e.key === "Escape") setEditingId(null);
                        }}
                      />
                    ) : (
                      <span className="text-sm font-medium">{cat.name}</span>
                    )}

                    <div className="px-4">
                      <span className={cn(
                        "text-xs rounded-full px-2 py-0.5 font-medium border",
                        cat.is_assigned
                          ? "bg-primary/10 border-primary/30 text-primary"
                          : "bg-muted border-border text-muted-foreground"
                      )}>
                        {cat.is_assigned ? "Assigned" : "Available"}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      {editingId === cat.id ? (
                        <>
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-primary" onClick={() => handleSaveEdit(cat.id)} disabled={saving}>
                            <Check className="w-3.5 h-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-muted-foreground" onClick={() => setEditingId(null)}>
                            <X className="w-3.5 h-3.5" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            size="sm" variant="ghost"
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                            onClick={() => { setEditingId(cat.id); setEditingName(cat.name); }}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            size="sm" variant="ghost"
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                            onClick={() => handleDelete(cat.id, cat.name)}
                            disabled={cat.is_assigned}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
