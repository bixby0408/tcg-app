"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function registerCard(formData: FormData) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData?.user) return;

  const setId = formData.get("set_id") as string;
  const cardId = formData.get("card_id") as string;
  const userId = authData.user.id;

  const { data: owned } = await supabase
    .from("user_cards")
    .select("id")
    .eq("user_id", userId)
    .eq("card_id", cardId)
    .limit(1)
    .maybeSingle();

  if (!owned) return;

  await supabase.from("dex_registrations").insert({
    user_id: userId,
    set_id: setId,
    card_id: cardId,
  });

  revalidatePath("/collection");
}

export async function unregisterCard(formData: FormData) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData?.user) return;

  await supabase
    .from("dex_registrations")
    .delete()
    .eq("user_id", authData.user.id)
    .eq("set_id", formData.get("set_id") as string)
    .eq("card_id", formData.get("card_id") as string);

  revalidatePath("/collection");
}
