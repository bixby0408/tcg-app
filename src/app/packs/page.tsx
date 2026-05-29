import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/Navbar";
import PackList from "./_components/PackList";

export default async function PacksPage() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData?.user ?? null;

  if (!user) redirect("/login");

  const [{ data: packs }, { data: profile }, { count: cardCount }] = await Promise.all([
    supabase.from("packs").select("*").eq("is_active", true).order("created_at"),
    supabase.from("profiles").select("balance").eq("id", user.id).single(),
    supabase.from("user_cards").select("*", { count: "exact", head: true }).eq("user_id", user.id),
  ]);

  const totalCards = cardCount ?? 0;

  return (
    <div className="min-h-screen bg-[#07070f]">
      <Navbar />
      <main className="max-w-5xl mx-auto px-6 py-10">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">팩 뽑기</h1>
            <p className="text-sm text-gray-500 mt-1">팩을 구매해 랜덤 카드를 획득하세요</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-right">
            <p className="text-xs text-gray-500">보유 코인</p>
            <p className="text-xl font-bold text-amber-400">{(profile?.balance ?? 0).toLocaleString()} C</p>
          </div>
        </div>

        <PackList packs={(packs ?? []) as any} balance={profile?.balance ?? 0} cardCount={totalCards} />
      </main>
    </div>
  );
}
