import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomBytes } from "crypto";
import { sha256 } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  try {
    const forwardedFor = request.headers.get("x-forwarded-for");
    const ip = forwardedFor?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
    
    // 1. Rate Limit 검증 (최근 5분 이내 5회 이상 실패 시 차단)
    const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { count, error: countError } = await supabaseAdmin
      .from("admin_login_attempts")
      .select("*", { count: "exact", head: true })
      .eq("ip_address", ip)
      .eq("success", false)
      .gte("attempt_time", fiveMinsAgo);

    if (countError) throw countError;

    if (count !== null && count >= 5) {
      return NextResponse.json(
        { error: "Too many failed attempts. Please try again in 5 minutes." },
        { status: 429 }
      );
    }

    const { pin } = await request.json();
    if (!pin) {
      return NextResponse.json({ error: "PIN is required" }, { status: 400 });
    }

    // 2. 계정 조회 (MVP이므로 name이나 코드가 없다면 우선 모두 가져와서 일치하는 PIN을 찾습니다. 
    // 이상적으로는 id나 username을 입력받아야 하지만, 요구사항 유지상 PIN만으로 조회)
    const { data: admins, error: fetchError } = await (supabaseAdmin
      .from("admin_users") as any)
      .select("id, name, role, pin_hash, pin_salt")
      .eq("is_active", true);

    if (fetchError || !admins || admins.length === 0) {
      await logAttempt(ip, false);
      return NextResponse.json({ error: "Invalid PIN or inactive account" }, { status: 401 });
    }

    let authenticatedAdmin = null;

    for (const admin of admins) {
      const saltedInput = admin.pin_salt ? admin.pin_salt + pin : pin; // 하위 호환성 (salt가 없는 MVP 계정)
      const inputHash = sha256(saltedInput);

      if (inputHash === admin.pin_hash) {
        authenticatedAdmin = admin;
        break;
      }
    }

    if (!authenticatedAdmin) {
      await logAttempt(ip, false);
      return NextResponse.json({ error: "Invalid PIN or inactive account" }, { status: 401 });
    }

    await logAttempt(ip, true);

    // 3. 세션 토큰 생성 및 발급
    const rawToken = randomBytes(32).toString("hex");
    const tokenHash = sha256(rawToken);
    
    // 12시간 유효 (현장 운영 특화)
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 12);

    const { error: sessionError } = await (supabaseAdmin
      .from("admin_sessions") as any)
      .insert({
        admin_user_id: authenticatedAdmin.id,
        token_hash: tokenHash,
        expires_at: expiresAt.toISOString(),
      });

    if (sessionError) {
      throw new Error("Failed to create session in DB");
    }

    const cookieStore = await cookies();
    cookieStore.set("admin_session", rawToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      expires: expiresAt,
    });

    return NextResponse.json({ 
      success: true, 
      admin: { id: authenticatedAdmin.id, name: authenticatedAdmin.name, role: authenticatedAdmin.role } 
    });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

async function logAttempt(ip: string, success: boolean) {
  await (supabaseAdmin.from("admin_login_attempts") as any).insert({
    ip_address: ip,
    success
  });
}
