"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ExtLoginPage() {
  const params = useSearchParams();

  useEffect(() => {
    const provider = params.get("provider") as "google" | "kakao" | null;
    const extId = params.get("ext_id") ?? "";
    if (!provider) return;

    const supabase = createClient();
    const next = encodeURIComponent(`/auth/ext-success?ext_id=${extId}`);
    supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${next}`,
      },
    });
  }, [params]);

  return (
    <div className="min-h-screen bg-[#07070f] flex items-center justify-center">
      <p className="text-gray-400 text-sm">로그인 페이지로 이동 중...</p>
    </div>
  );
}
