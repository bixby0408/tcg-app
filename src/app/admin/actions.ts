"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type ActionResult = { error?: string; success?: boolean } | null;

async function getAdminClient() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData?.user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", authData.user.id)
    .single();

  if (!profile?.is_admin) return null;
  return supabase;
}

export async function createCard(_: ActionResult, formData: FormData): Promise<ActionResult> {
  const supabase = await getAdminClient();
  if (!supabase) return { error: "권한이 없습니다" };

  const { error } = await supabase.from("cards").insert({
    name: formData.get("name") as string,
    description: (formData.get("description") as string) || null,
    image_url: (formData.get("image_url") as string) || null,
    rarity: formData.get("rarity") as string,
    card_type: (formData.get("card_type") as string) || null,
    card_number: (formData.get("card_number") as string) || null,
    series: (formData.get("series") as string) || null,
    current_price: Number(formData.get("current_price")) || 0,
  });

  if (error) return { error: error.message };
  revalidatePath("/admin");
  return { success: true };
}

export async function createPack(_: ActionResult, formData: FormData): Promise<ActionResult> {
  const supabase = await getAdminClient();
  if (!supabase) return { error: "권한이 없습니다" };

  const { error } = await supabase.from("packs").insert({
    name: formData.get("name") as string,
    description: (formData.get("description") as string) || null,
    image_url: (formData.get("image_url") as string) || null,
    price: Number(formData.get("price")),
    cards_per_pack: Number(formData.get("cards_per_pack")) || 5,
    is_active: formData.get("is_active") === "on",
    release_date: (formData.get("release_date") as string) || null,
  });

  if (error) return { error: error.message };
  revalidatePath("/admin");
  return { success: true };
}

export async function addCardToPack(_: ActionResult, formData: FormData): Promise<ActionResult> {
  const supabase = await getAdminClient();
  if (!supabase) return { error: "권한이 없습니다" };

  const { error } = await supabase.from("pack_cards").upsert({
    pack_id: formData.get("pack_id") as string,
    card_id: formData.get("card_id") as string,
    weight: Number(formData.get("weight")) || 1,
  });

  if (error) return { error: error.message };
  revalidatePath("/admin");
  return { success: true };
}

export async function deletePack(_: ActionResult, formData: FormData): Promise<ActionResult> {
  const supabase = await getAdminClient();
  if (!supabase) return { error: "권한이 없습니다" };

  const { error } = await supabase
    .from("packs")
    .delete()
    .eq("id", formData.get("pack_id") as string);

  if (error) return { error: error.message };
  revalidatePath("/admin");
  return { success: true };
}

export async function removeCardFromPack(_: ActionResult, formData: FormData): Promise<ActionResult> {
  const supabase = await getAdminClient();
  if (!supabase) return { error: "권한이 없습니다" };

  const { error } = await supabase
    .from("pack_cards")
    .delete()
    .eq("pack_id", formData.get("pack_id") as string)
    .eq("card_id", formData.get("card_id") as string);

  if (error) return { error: error.message };
  revalidatePath("/admin");
  return { success: true };
}

export async function updatePackPrice(_: ActionResult, formData: FormData): Promise<ActionResult> {
  const supabase = await getAdminClient();
  if (!supabase) return { error: "권한이 없습니다" };

  const { error } = await supabase
    .from("packs")
    .update({ price: Number(formData.get("price")) })
    .eq("id", formData.get("pack_id") as string);

  if (error) return { error: error.message };
  revalidatePath("/admin");
  return { success: true };
}

export async function updateCardPrice(_: ActionResult, formData: FormData): Promise<ActionResult> {
  const supabase = await getAdminClient();
  if (!supabase) return { error: "권한이 없습니다" };

  const { error } = await supabase
    .from("cards")
    .update({ current_price: Number(formData.get("price")) })
    .eq("id", formData.get("card_id") as string);

  if (error) return { error: error.message };
  revalidatePath("/admin");
  return { success: true };
}

export async function deleteCard(_: ActionResult, formData: FormData): Promise<ActionResult> {
  const supabase = await getAdminClient();
  if (!supabase) return { error: "권한이 없습니다" };

  const cardId = formData.get("card_id") as string;

  // 팩에서도 먼저 제거
  await supabase.from("pack_cards").delete().eq("card_id", cardId);

  const { error } = await supabase.from("cards").delete().eq("id", cardId);

  if (error) return { error: error.message };
  revalidatePath("/admin");
  return { success: true };
}
