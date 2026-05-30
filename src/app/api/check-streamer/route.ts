import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createHash } from "crypto";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

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
    const { userId, accessToken, streamerId } = await req.json();
    if (!userId || !accessToken || !streamerId) {
      return NextResponse.json({ allowed: false }, { headers: CORS });
    }

    // JWT 검증 (로그인된 사용자만 조회 가능)
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: userData } = await supabase.auth.getUser(accessToken);
    if (!userData?.user || userData.user.id !== userId) {
      return NextResponse.json({ allowed: false }, { headers: CORS });
    }

    const allowed = ALLOWED_HASHES.has(hashStreamerId(streamerId));
    return NextResponse.json({ allowed }, { headers: CORS });
  } catch {
    return NextResponse.json({ allowed: false }, { headers: CORS });
  }
}
