"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const PRIVACY_POLICY = `개인정보처리방침

본 사이트(이하 "회사")는 이용자의 개인정보를 중요하게 생각하며, 「개인정보 보호법」 등 관련 법령을 준수합니다. 회사는 회원가입 및 서비스 제공을 위해 최소한의 개인정보를 수집하며, 아래와 같이 개인정보처리방침을 안내합니다.

1. 수집하는 개인정보 항목

회사는 회원가입 및 서비스 이용 과정에서 아래의 개인정보를 수집할 수 있습니다.
• 이메일
• 비밀번호(암호화 저장)

2. 개인정보의 수집 및 이용 목적

회사는 수집한 개인정보를 아래 목적에 한하여 사용합니다.
• 회원 식별 및 로그인
• 서비스 운영 및 관리

수집된 개인정보는 위 목적 외 용도로 사용되지 않으며, 이용자의 동의 없이 외부에 제공되지 않습니다.

3. 개인정보의 보관 및 이용 기간

회사는 이용자의 개인정보를 서비스 운영 기간 동안 보관하며, 사이트 폐쇄 시 관련 법령에 따라 처리 후 안전하게 파기합니다.

4. 개인정보의 제3자 제공

회사는 이용자의 개인정보를 외부에 제공하지 않습니다. 다만, 관련 법령에 따른 요청이 있는 경우에는 예외로 할 수 있습니다.

5. 개인정보의 보호

회사는 이용자의 개인정보 보호를 위해 비밀번호 암호화 등 안전성 확보 조치를 적용하고 있습니다.

6. 이용자의 권리

이용자는 언제든지 자신의 개인정보에 대한 조회, 수정, 삭제를 요청할 수 있습니다.

7. 개인정보처리방침의 변경

본 개인정보처리방침은 관련 법령 및 서비스 정책에 따라 변경될 수 있으며, 변경 시 사이트를 통해 공지합니다.

시행일: 2026년 5월 28일`;

export default function SignupPage() {
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { nickname },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  }

  async function handleOAuth(provider: "google" | "kakao") {
    if (!agreed) {
      setError("개인정보처리방침에 동의해주세요.");
      return;
    }
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) setError(error.message);
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#07070f] flex items-center justify-center px-4">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-violet-700/15 rounded-full blur-[120px]" />
        </div>
        <div className="relative w-full max-w-sm bg-white/5 border border-white/10 rounded-2xl p-8 text-center backdrop-blur-sm">
          <div className="w-14 h-14 bg-violet-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-white mb-2">이메일을 확인하세요</h1>
          <p className="text-sm text-gray-400 mb-6">
            <span className="font-medium text-gray-300">{email}</span>으로
            <br />
            인증 링크를 보냈습니다.
          </p>
          <Link
            href="/login"
            className="inline-block text-sm text-violet-400 hover:text-violet-300 font-medium transition-colors"
          >
            로그인 페이지로 이동 →
          </Link>
        </div>
      </div>
    );
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
          <p className="text-gray-500 text-sm mt-2">새 계정을 만드세요</p>
        </div>

        {/* Card */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-7 backdrop-blur-sm">
          {/* 소셜 로그인 */}
          <div className="space-y-3 mb-6">
            <button
              onClick={() => handleOAuth("google")}
              className="w-full flex items-center justify-center gap-3 px-4 py-2.5 bg-white hover:bg-gray-100 rounded-xl text-sm font-medium text-gray-800 transition-colors"
            >
              <GoogleIcon />
              Google로 계속하기
            </button>
            <button
              onClick={() => handleOAuth("kakao")}
              className="w-full flex items-center justify-center gap-3 px-4 py-2.5 bg-[#FEE500] hover:bg-[#F5DB00] rounded-xl text-sm font-medium text-[#191919] transition-colors"
            >
              <KakaoIcon />
              카카오로 계속하기
            </button>
          </div>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-transparent px-3 text-xs text-gray-600">또는 이메일로 가입</span>
            </div>
          </div>

          {/* 폼 */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                닉네임
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                required
                maxLength={20}
                placeholder="사용할 닉네임"
                className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
              />
            </div>

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
                minLength={6}
                placeholder="최소 6자"
                className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
              />
            </div>

            {/* 개인정보처리방침 동의 */}
            <label className="flex items-start gap-2.5 cursor-pointer group">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-violet-500 cursor-pointer flex-shrink-0"
              />
              <span className="text-xs text-gray-400 leading-relaxed">
                <button
                  type="button"
                  onClick={() => setShowPrivacy(true)}
                  className="text-violet-400 hover:text-violet-300 underline underline-offset-2 transition-colors"
                >
                  개인정보처리방침
                </button>
                에 동의합니다 <span className="text-red-400">*</span>
              </span>
            </label>

            {error && (
              <div className="flex items-center gap-2 text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl px-3.5 py-2.5">
                <span>⚠</span>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !agreed}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl text-sm transition-all shadow-lg shadow-violet-900/30"
            >
              {loading ? "가입 중..." : "회원가입"}
            </button>
          </form>
        </div>

        {/* 로그인 링크 */}
        <p className="text-sm text-center text-gray-600 mt-5">
          이미 계정이 있으신가요?{" "}
          <Link href="/login" className="text-violet-400 hover:text-violet-300 font-medium transition-colors">
            로그인
          </Link>
        </p>
      </div>

      {/* 개인정보처리방침 모달 */}
      {showPrivacy && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setShowPrivacy(false)}
        >
          <div
            className="relative w-full max-w-lg bg-[#12121e] border border-white/10 rounded-2xl flex flex-col max-h-[80vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <h2 className="text-base font-bold text-white">개인정보처리방침</h2>
              <button
                onClick={() => setShowPrivacy(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="overflow-y-auto px-6 py-5 text-sm text-gray-300 leading-relaxed whitespace-pre-wrap flex-1">
              {PRIVACY_POLICY}
            </div>
            <div className="px-6 py-4 border-t border-white/10">
              <button
                onClick={() => { setAgreed(true); setShowPrivacy(false); }}
                className="w-full py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-xl text-sm transition-colors"
              >
                동의하고 닫기
              </button>
            </div>
          </div>
        </div>
      )}
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
