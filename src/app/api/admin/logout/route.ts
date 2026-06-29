import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sha256 } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const rawToken = cookieStore.get("admin_session")?.value;

    if (rawToken) {
      const tokenHash = sha256(rawToken);
      
      // DB 세션 삭제
      await supabaseAdmin.from("admin_sessions").delete().eq("token_hash", tokenHash);
      
      // 쿠키 삭제
      cookieStore.delete("admin_session");
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Logout failed" }, { status: 500 });
  }
}
