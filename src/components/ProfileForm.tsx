"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types/supabase";

type NicknameStatus = "idle" | "checking" | "available" | "taken" | "invalid";

type Props = {
  userId: string;
  email: string;
  profile: Profile | null;
};

export default function ProfileForm({ userId, email, profile }: Props) {
  const [nickname, setNickname] = useState(profile?.nickname ?? "");
  const [nicknameStatus, setNicknameStatus] = useState<NicknameStatus>("idle");
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url ?? "");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const currentNickname = profile?.nickname ?? "";

  // 닉네임 중복 체크 (디바운스 300ms)
  const checkNickname = useCallback(
    (value: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);

      const trimmed = value.trim();

      // 변경 없음
      if (trimmed === currentNickname) {
        setNicknameStatus("idle");
        return;
      }

      // 길이 검사
      if (trimmed.length < 2) {
        setNicknameStatus(trimmed.length === 0 ? "idle" : "invalid");
        return;
      }

      setNicknameStatus("checking");

      debounceRef.current = setTimeout(async () => {
        const { data } = await supabase
          .from("profiles")
          .select("id")
          .eq("nickname", trimmed)
          .neq("id", userId)
          .maybeSingle();

        setNicknameStatus(data ? "taken" : "available");
      }, 300);
    },
    [currentNickname, userId, supabase]
  );

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    };
  }, [avatarPreview]);

  function handleNicknameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setNickname(value);
    checkNickname(value);
  }

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: "error", text: "이미지는 2MB 이하여야 합니다." });
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();

    const trimmed = nickname.trim();
    if (trimmed.length < 2) {
      setMessage({ type: "error", text: "닉네임은 2자 이상이어야 합니다." });
      return;
    }
    if (nicknameStatus === "taken") {
      setMessage({ type: "error", text: "이미 사용 중인 닉네임입니다." });
      return;
    }
    if (nicknameStatus === "checking") {
      setMessage({ type: "error", text: "닉네임 확인 중입니다. 잠시 후 다시 시도하세요." });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      let newAvatarUrl = avatarUrl;

      if (avatarFile) {
        const ext = avatarFile.name.split(".").pop();
        const path = `${userId}/avatar.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(path, avatarFile, { upsert: true });
        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
        newAvatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;
        setAvatarUrl(newAvatarUrl);
        setAvatarFile(null);
        if (avatarPreview) { URL.revokeObjectURL(avatarPreview); setAvatarPreview(null); }
      }

      const { error: updateError } = await supabase
        .from("profiles")
        .upsert({ id: userId, nickname: trimmed, avatar_url: newAvatarUrl }, { onConflict: "id" });

      if (updateError) {
        if (updateError.code === "23505") throw new Error("이미 사용 중인 닉네임입니다.");
        throw updateError;
      }

      setMessage({ type: "success", text: "프로필이 저장되었습니다." });
      setNicknameStatus("idle");
      router.refresh();
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "저장 중 오류가 발생했습니다." });
    } finally {
      setSaving(false);
    }
  }

  const displayAvatar = avatarPreview ?? (avatarUrl || null);
  const initial = (nickname || email)[0]?.toUpperCase() ?? "?";

  const canSave =
    !saving &&
    nickname.trim().length >= 2 &&
    nicknameStatus !== "taken" &&
    nicknameStatus !== "checking" &&
    nicknameStatus !== "invalid";

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* 아바타 */}
      <div className="flex flex-col items-center gap-4">
        <button type="button" onClick={() => fileInputRef.current?.click()} className="relative group">
          {displayAvatar ? (
            <Image
              src={displayAvatar}
              alt="avatar"
              width={96}
              height={96}
              className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 text-3xl font-bold border-4 border-white shadow-md">
              {initial}
            </div>
          )}
          <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
        </button>
        <p className="text-xs text-gray-400">클릭하여 사진 변경 (최대 2MB)</p>
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
      </div>

      {/* 이메일 (읽기 전용) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
        <input
          type="text"
          value={email}
          disabled
          className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
        />
      </div>

      {/* 닉네임 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">닉네임</label>
        <div className="relative">
          <input
            type="text"
            value={nickname}
            onChange={handleNicknameChange}
            required
            maxLength={20}
            placeholder="닉네임을 입력하세요 (2~20자)"
            className={`w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-colors pr-8 ${
              nicknameStatus === "taken" || nicknameStatus === "invalid"
                ? "border-red-300 focus:ring-red-400 bg-red-50"
                : nicknameStatus === "available"
                ? "border-green-300 focus:ring-green-400 bg-green-50"
                : "border-gray-300 focus:ring-violet-500"
            }`}
          />
          {/* 상태 아이콘 */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm">
            {nicknameStatus === "checking" && (
              <span className="text-gray-400 animate-pulse">···</span>
            )}
            {nicknameStatus === "available" && (
              <span className="text-green-500 font-bold">✓</span>
            )}
            {nicknameStatus === "taken" && (
              <span className="text-red-500 font-bold">✗</span>
            )}
            {nicknameStatus === "invalid" && (
              <span className="text-red-400 font-bold">!</span>
            )}
          </div>
        </div>

        {/* 상태 메시지 */}
        <div className="flex justify-between items-center mt-1">
          <p className={`text-xs ${
            nicknameStatus === "taken" || nicknameStatus === "invalid" ? "text-red-500" :
            nicknameStatus === "available" ? "text-green-600" :
            "text-gray-400"
          }`}>
            {nicknameStatus === "taken"   && "이미 사용 중인 닉네임이에요"}
            {nicknameStatus === "invalid" && "닉네임은 2자 이상이어야 해요"}
            {nicknameStatus === "available" && "사용 가능한 닉네임이에요"}
            {(nicknameStatus === "idle" || nicknameStatus === "checking") && "2~20자, 중복 불가"}
          </p>
          <p className="text-xs text-gray-400">{nickname.length}/20</p>
        </div>
      </div>

      {/* 저장 결과 메시지 */}
      {message && (
        <p className={`text-sm rounded-xl px-3 py-2 ${
          message.type === "success" ? "text-green-700 bg-green-50 border border-green-200" : "text-red-600 bg-red-50 border border-red-200"
        }`}>
          {message.text}
        </p>
      )}

      <button
        type="submit"
        disabled={!canSave}
        className="w-full py-2.5 px-4 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl text-sm transition-colors"
      >
        {saving ? "저장 중..." : "저장"}
      </button>
    </form>
  );
}
