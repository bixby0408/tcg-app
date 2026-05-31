import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "./LogoutButton";

export default async function Navbar() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData?.user ?? null;

  let profile = null;
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("nickname, avatar_url, is_admin")
      .eq("id", user.id)
      .single();
    profile = data;
  }

  const displayName =
    profile?.nickname || user?.email?.split("@")[0] || "사용자";
  const initial = displayName[0].toUpperCase();

  return (
    <nav className="bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between sticky top-0 z-40 backdrop-blur-sm">
      {/* Logo */}
      <Link
        href="/"
        className="text-lg font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent"
      >
        어인섬 카드샵
      </Link>

      {/* Center nav links */}
      <div className="hidden md:flex items-center gap-1">
        <NavLink href="/">홈</NavLink>
        <NavLink href="/packs">팩 뽑기</NavLink>
        <NavLink href="/cards">내 카드</NavLink>
        <NavLink href="/market">마켓플레이스</NavLink>
        {user && <NavLink href="/dashboard">대시보드</NavLink>}
        {(profile as any)?.is_admin && (
          <Link
            href="/admin"
            className="text-sm text-violet-600 hover:text-violet-700 hover:bg-violet-50 px-3 py-2 rounded-lg transition-colors font-semibold"
          >
            ⚙ 관리자
          </Link>
        )}
      </div>

      {/* Right — profile */}
      <div className="flex items-center gap-3">
        <Link
          href="/profile"
          className="flex items-center gap-2 hover:bg-gray-50 px-3 py-1.5 rounded-xl transition-colors"
        >
          {profile?.avatar_url ? (
            <Image
              src={profile.avatar_url}
              alt="avatar"
              width={32}
              height={32}
              className="rounded-full object-cover w-8 h-8"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
              {initial}
            </div>
          )}
          <span className="text-sm font-medium text-gray-700 hidden sm:block max-w-[100px] truncate">
            {displayName}
          </span>
        </Link>

        <LogoutButton />
      </div>
    </nav>
  );
}

function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="text-sm text-gray-500 hover:text-gray-900 hover:bg-gray-50 px-3 py-2 rounded-lg transition-colors font-medium"
    >
      {children}
    </Link>
  );
}
