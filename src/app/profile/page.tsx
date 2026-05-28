import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/Navbar";
import ProfileForm from "@/components/ProfileForm";

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData?.user ?? null;

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-lg mx-auto mt-12 px-6 pb-16">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">내 프로필</h1>
          <p className="text-sm text-gray-500 mt-1">닉네임과 아바타를 설정하세요</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <ProfileForm
            userId={user.id}
            email={user.email ?? ""}
            profile={profile}
          />
        </div>
      </main>
    </div>
  );
}
