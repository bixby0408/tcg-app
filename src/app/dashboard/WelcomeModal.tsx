"use client";

import { useState } from "react";
import { markWelcomed } from "./actions";

export default function WelcomeModal() {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  async function handleClose() {
    setVisible(false);
    await markWelcomed();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />

      {/* Modal */}
      <div className="relative bg-[#13131f] border border-white/10 rounded-2xl p-8 w-full max-w-sm text-center shadow-2xl">
        {/* Glow */}
        <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-24 bg-violet-600/20 blur-2xl" />
        </div>

        <div className="relative">
          <div className="text-5xl mb-4">🎉</div>
          <h2 className="text-xl font-bold text-white mb-1">환영해요!</h2>
          <p className="text-gray-400 text-sm mb-5">가입을 축하해요. 첫 로그인 보너스로</p>

          {/* Coin badge */}
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-600/30 to-amber-500/30 border border-amber-400/30 rounded-full px-5 py-2.5 mb-6">
            <span className="text-amber-400 font-black text-2xl">5,000</span>
            <span className="text-amber-300 font-semibold text-lg">코인</span>
            <span className="text-gray-300 text-sm">지급!</span>
          </div>

          <p className="text-gray-500 text-xs mb-6">팩 뽑기에서 나만의 카드를 모아보세요</p>

          <button
            onClick={handleClose}
            className="w-full py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-semibold rounded-xl text-sm transition-all cursor-pointer"
          >
            시작하기
          </button>
        </div>
      </div>
    </div>
  );
}
