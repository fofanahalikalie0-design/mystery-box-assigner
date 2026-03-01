import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Save, Settings, Vote, Gift } from "lucide-react";
import { toast } from "sonner";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { cn } from "@/lib/utils";

export function SiteSettingsManager() {
  const { settings, loading, updateSettings } = useSiteSettings();
  const [siteName, setSiteName] = useState("");
  const [siteMode, setSiteMode] = useState<"elections" | "mystery_boxes">("mystery_boxes");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      setSiteName(settings.site_name);
      setSiteMode(settings.site_mode);
    }
  }, [settings]);

  const handleSave = async () => {
    if (!siteName.trim()) { toast.error("Site name cannot be empty"); return; }
    setSaving(true);
    const success = await updateSettings({ site_name: siteName.trim(), site_mode: siteMode });
    if (success) toast.success("Settings saved!");
    else toast.error("Failed to save settings");
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Site Name */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Settings className="w-4 h-4 text-primary" />
          Site Name
        </div>
        <div className="space-y-2">
          <Label htmlFor="site-name">Display Name</Label>
          <Input
            id="site-name"
            value={siteName}
            onChange={(e) => setSiteName(e.target.value)}
            placeholder="Enter site name..."
            className="bg-muted border-border"
          />
          <p className="text-xs text-muted-foreground">This name appears across the entire site (header, landing page, footer).</p>
        </div>
      </div>

      {/* Site Mode */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Settings className="w-4 h-4 text-primary" />
          Site Mode
        </div>
        <p className="text-xs text-muted-foreground">Choose what users see when they visit. Only one mode is active at a time.</p>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setSiteMode("mystery_boxes")}
            className={cn(
              "p-4 rounded-xl border-2 text-left transition-all",
              siteMode === "mystery_boxes"
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/30"
            )}
          >
            <Gift className={cn("w-6 h-6 mb-2", siteMode === "mystery_boxes" ? "text-primary" : "text-muted-foreground")} />
            <div className="font-semibold text-sm">Mystery Boxes</div>
            <p className="text-xs text-muted-foreground mt-1">Admins select categories from mystery boxes</p>
          </button>
          <button
            onClick={() => setSiteMode("elections")}
            className={cn(
              "p-4 rounded-xl border-2 text-left transition-all",
              siteMode === "elections"
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/30"
            )}
          >
            <Vote className={cn("w-6 h-6 mb-2", siteMode === "elections" ? "text-primary" : "text-muted-foreground")} />
            <div className="font-semibold text-sm">Elections</div>
            <p className="text-xs text-muted-foreground mt-1">Users vote for candidates in elections</p>
          </button>
        </div>
      </div>

      <Button onClick={handleSave} disabled={saving} className="gap-1.5">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        Save Settings
      </Button>
    </div>
  );
}
