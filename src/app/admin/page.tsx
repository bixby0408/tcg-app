import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/Navbar";
import AdminTabs from "./_components/AdminTabs";

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData?.user ?? null;

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) redirect("/dashboard");

  const [{ data: cards }, { data: packs }, { data: packCards }] = await Promise.all([
    supabase.from("cards").select("*").order("created_at", { ascending: false }),
    supabase.from("packs").select("*").order("created_at", { ascending: false }),
    supabase.from("pack_cards").select("*, cards(name, rarity)"),
  ]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">관리자 패널</h1>
          <p className="text-sm text-gray-500 mt-1">카드 및 팩을 관리합니다</p>
        </div>
        <AdminTabs
          cards={(cards ?? []) as any}
          packs={(packs ?? []) as any}
          packCards={(packCards ?? []) as any}
        />
      </main>
    </div>
  );
}
