"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Status = "pending" | "done" | "error";

export default function ExtSuccessPage() {
  const params = useSearchParams();
  const [status, setStatus] = useState<Status>("pending");

  useEffect(() => {
    const extId = params.get("ext_id");
    if (!extId) { setStatus("error"); return; }

    const supabase = createClient();
    let done = false;

    async function sendSession() {
      // Supabase가 세션을 쿠키에 저장할 시간을 잠깐 기다림
      await new Promise((r) => setTimeout(r, 500));

      const { data, error } = await supabase.auth.getSession();
      if (error || !data.session) { setStatus("error"); return; }

      try {
        // externally_connectable 덕분에 웹 페이지에서 chrome.runtime 사용 가능
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const cr = (window as any).chrome?.runtime;
        if (!cr) { setStatus("error"); return; }

        cr.sendMessage(extId, { type: "EXT_SESSION", session: data.session }, () => {
          done = true;
          if (cr.lastError) { setStatus("error"); return; }
          setStatus("done");
        });

        // 5초 내 응답 없으면 에러
        setTimeout(() => { if (!done) setStatus("error"); }, 5000);
      } catch {
        setStatus("error");
      }
    }

    sendSession();
  }, [params]);

  return (
    <div className="min-h-screen bg-[#07070f] flex items-center justify-center px-4">
      <div className="text-center space-y-3">
        {status === "pending" && (
          <>
            <div className="text-4xl animate-spin">⏳</div>
            <p className="text-gray-400 text-sm">로그인 처리 중...</p>
          </>
        )}
        {status === "done" && (
          <>
            <div className="text-4xl">✅</div>
            <p className="text-white font-semibold text-lg">로그인 완료!</p>
            <p className="text-gray-500 text-sm">이 탭은 자동으로 닫힙니다.</p>
          </>
        )}
        {status === "error" && (
          <>
            <div className="text-4xl">❌</div>
            <p className="text-red-400 font-medium">로그인에 실패했습니다</p>
            <p className="text-gray-500 text-sm">확장프로그램이 설치되어 있는지 확인하고 다시 시도해주세요.</p>
          </>
        )}
      </div>
    </div>
  );
}
