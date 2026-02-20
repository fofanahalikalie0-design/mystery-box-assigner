import { supabase } from "@/integrations/supabase/client";

// Type-safe wrappers for DB functions not yet in generated types
export async function dbUpsertProfile(userId: string, firstName: string, lastName: string, email: string, whatsapp: string | null) {
  return await (supabase.rpc as Function)("upsert_profile", {
    p_user_id: userId,
    p_first_name: firstName,
    p_last_name: lastName,
    p_email: email,
    p_whatsapp: whatsapp,
  });
}

export async function dbAssignAdminRole(userId: string) {
  return await (supabase.rpc as Function)("assign_admin_role", { p_user_id: userId });
}

export async function dbAssignSuperAdminRole(userId: string) {
  return await (supabase.rpc as Function)("assign_super_admin_role", { p_user_id: userId });
}

export async function dbGetAllAdminAssignments() {
  return await (supabase.rpc as Function)("get_all_admin_assignments");
}
