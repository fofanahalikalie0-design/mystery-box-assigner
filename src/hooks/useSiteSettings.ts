import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface SiteSettings {
  id: string;
  site_name: string;
  site_mode: "elections" | "mystery_boxes";
  updated_at: string;
}

export function useSiteSettings() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("site_settings")
      .select("*")
      .limit(1)
      .maybeSingle();
    if (!error && data) {
      setSettings(data as unknown as SiteSettings);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const updateSettings = async (updates: Partial<Pick<SiteSettings, "site_name" | "site_mode">>) => {
    if (!settings) return false;
    const { error } = await supabase
      .from("site_settings")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", settings.id);
    if (error) return false;
    await fetchSettings();
    return true;
  };

  return { settings, loading, fetchSettings, updateSettings };
}
