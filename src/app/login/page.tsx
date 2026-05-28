"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const ERROR_MESSAGES: Record<string, string> = {
  verify_token: "토큰 검증 실패 — 다시 로그인해주세요",
};

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const err = params.get("error");
    if (err) {
      const desc = params.get("error_description");
      setError(ERROR_MESSAGES[err] ?? (desc ? decodeURIComponent(desc.replace(/\+/g, " ")) : `오류 코드: ${err}`));
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError("이메일 또는 비밀번호가 올바르지 않아요");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  async function handleOAuth(provider: "google" | "kakao") {
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) setError(error.message);
  }

  return (
    <div className="min-h-screen bg-[#07070f] flex items-center justify-center px-4">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-violet-700/15 rounded-full blur-[120px]" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link
            href="/"
            className="text-2xl font-bold bg-gradient-to-r from-violet-400 to-amber-400 bg-clip-text text-transparent"
          >
            어인섬 카드샵
          </Link>
          <p className="text-gray-500 text-sm mt-2">계정에 로그인하세요</p>
        </div>

        {/* Card */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-7 backdrop-blur-sm">
          {/* 소셜 로그인 */}
          <div className="space-y-3 mb-6">
            <button
              onClick={() => handleOAuth("google")}
              className="w-full flex items-center justify-center gap-3 px-4 py-2.5 bg-white hover:bg-gray-100 rounded-xl text-sm font-medium text-gray-800 transition-colors cursor-pointer"
            >
              <GoogleIcon />
              Google로 로그인
            </button>
            <button
              onClick={() => handleOAuth("kakao")}
              className="w-full flex items-center justify-center gap-3 px-4 py-2.5 bg-[#FEE500] hover:bg-[#F5DB00] rounded-xl text-sm font-medium text-[#191919] transition-colors cursor-pointer"
            >
              <KakaoIcon />
              카카오로 로그인
            </button>
          </div>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-transparent px-3 text-xs text-gray-600">또는 이메일로 로그인</span>
            </div>
          </div>

          {/* 이메일 폼 */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                이메일
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                비밀번호
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl px-3.5 py-2.5">
                <span>⚠</span>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl text-sm transition-all shadow-lg shadow-violet-900/30"
            >
              {loading ? "로그인 중..." : "로그인"}
            </button>
          </form>
        </div>

        {/* 회원가입 링크 */}
        <p className="text-sm text-center text-gray-600 mt-5">
          계정이 없으신가요?{" "}
          <Link href="/signup" className="text-violet-400 hover:text-violet-300 font-medium transition-colors">
            회원가입
          </Link>
        </p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18Z" />
      <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17Z" />
      <path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 0 1 0-3.04V5.41H1.83a8 8 0 0 0 0 7.18l2.67-2.07Z" />
      <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4L4.5 7.49a4.77 4.77 0 0 1 4.48-3.31Z" />
    </svg>
  );
}

function KakaoIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 512 512" fill="#191919">
      <path d="M255.5 48C139.1 48 43.9 120.2 43.9 209.5c0 58.5 39.9 110.1 100.7 140.6-4.4 16.6-28.4 103.7-29 108.1 0 0 .2 1.6 1.3 2.2 1.1.6 2.4.3 2.4.3 3.2-.4 37.2-24.5 52.9-35.2 16.3 2.8 33.2 4.2 50.3 4.2 116.4 0 211.6-72.2 211.6-161.5C434.1 120.2 371.9 48 255.5 48z" />
    </svg>
  );
}
