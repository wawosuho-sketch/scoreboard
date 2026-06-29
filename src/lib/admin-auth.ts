import { cookies } from "next/headers";
import { createHash } from "crypto";
import { supabaseAdmin } from "@/lib/supabase-admin";

export function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export async function requireAdmin(allowedRoles: string[]) {
  const cookieStore = await cookies();
  const rawToken = cookieStore.get("admin_session")?.value;

  if (!rawToken) {
    throw new Error("UNAUTHORIZED");
  }

  const tokenHash = sha256(rawToken);

  const { data: session, error } = await (supabaseAdmin
    .from("admin_sessions") as any)
    .select("admin_users(id, name, role, is_active), expires_at")
    .eq("token_hash", tokenHash)
    .gt("expires_at", new Date().toISOString())
    .single();

  if (error || !session) {
    throw new Error("UNAUTHORIZED");
  }

  const admin = session.admin_users as unknown as { id: string; name: string; role: string; is_active: boolean };

  if (!admin || !admin.is_active) {
    throw new Error("UNAUTHORIZED");
  }

  if (!allowedRoles.includes(admin.role)) {
    throw new Error("FORBIDDEN");
  }

  return admin;
}
