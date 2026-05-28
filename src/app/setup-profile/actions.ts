"use server";

import { createClient } from "@/lib/supabase/server";

export async function saveNickname(nickname: string): Promise<{ error?: string; success?: boolean }> {
  if (!nickname || nickname.length > 20) return { error: "닉네임은 1~20자로 입력해주세요" };

  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return { error: "로그인이 필요합니다" };

  const { error } = await supabase
    .from("profiles")
    .update({ nickname })
    .eq("id", data.user.id);

  if (error) return { error: error.message };
  return { success: true };
}
