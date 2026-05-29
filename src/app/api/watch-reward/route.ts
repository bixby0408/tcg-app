import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createHash } from "crypto";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const MAX_COINS_PER_CALL = 1000;

// 허용 채널 해시 목록 (서버에만 존재 — 클라이언트 코드에 채널 ID 없음)
const ALLOWED_HASHES = new Set(
  (process.env.ALLOWED_STREAMER_HASHES ?? "").split(",").filter(Boolean)
);

function hashStreamerId(id: string): string {
  return createHash("sha256").update(id.toLowerCase().trim()).digest("hex");
}

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, accessToken, coins, streamerId } = body;

    // 기본 유효성 검사
    if (!userId || !accessToken || typeof coins !== "number" || !streamerId) {
      return NextResponse.json({ error: "잘못된 요청입니다" }, { status: 400, headers: CORS });
    }
    if (coins <= 0 || coins > MAX_COINS_PER_CALL) {
      return NextResponse.json({ error: "코인 값이 유효하지 않습니다" }, { status: 400, headers: CORS });
    }

    // 허용된 채널인지 서버에서 검증 (클라이언트에 채널 목록 미노출)
    const hash = hashStreamerId(streamerId);
    if (!ALLOWED_HASHES.has(hash)) {
      return NextResponse.json({ error: "허용되지 않은 채널입니다" }, { status: 403, headers: CORS });
    }

    // JWT 검증
    const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: userData, error: authError } = await anonClient.auth.getUser(accessToken);

    if (authError || !userData?.user) {
      return NextResponse.json({ error: "인증에 실패했습니다" }, { status: 401, headers: CORS });
    }
    if (userData.user.id !== userId) {
      return NextResponse.json({ error: "사용자 정보가 일치하지 않습니다" }, { status: 403, headers: CORS });
    }

    // 잔액 업데이트
    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: profile } = await adminClient
      .from("profiles")
      .select("balance")
      .eq("id", userId)
      .single();

    const { error: updateError } = await adminClient
      .from("profiles")
      .update({ balance: (profile?.balance ?? 0) + coins })
      .eq("id", userId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500, headers: CORS });
    }

    return NextResponse.json({ success: true, awarded: coins }, { headers: CORS });
  } catch {
    return NextResponse.json({ error: "서버 오류가 발생했습니다" }, { status: 500, headers: CORS });
  }
}
