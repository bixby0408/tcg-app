"use server";

import { createClient } from "@/lib/supabase/server";

export async function markWelcomed() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return;
  await supabase.from("profiles").update({ welcomed: true }).eq("id", data.user.id);
}
