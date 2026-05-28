import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#07070f] text-white overflow-x-hidden">
      {/* ── Navigation ── */}
      <nav className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-6 py-4 bg-[#07070f]/80 backdrop-blur-md border-b border-white/5">
        <span className="text-xl font-bold bg-gradient-to-r from-violet-400 to-amber-400 bg-clip-text text-transparent">
          어인섬 카드샵
        </span>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm text-gray-400 hover:text-white transition-colors px-3 py-2"
          >
            로그인
          </Link>
          <Link
            href="/signup"
            className="text-sm bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-lg transition-colors font-medium"
          >
            시작하기
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative min-h-screen flex items-center pt-20">
        {/* Background glows */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/3 left-1/3 w-[500px] h-[500px] bg-violet-700/20 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] bg-amber-500/10 rounded-full blur-[100px]" />
        </div>

        <div className="relative max-w-6xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center w-full">
          {/* Left — text */}
          <div>
            <div className="inline-flex items-center gap-2 text-xs text-violet-400 bg-violet-400/10 border border-violet-400/20 px-3 py-1.5 rounded-full mb-6">
              <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-pulse" />
              온라인 디지털 TCG 플랫폼
            </div>

            <h1 className="text-5xl lg:text-6xl font-extrabold leading-tight mb-6 tracking-tight">
              나만의{" "}
              <span className="bg-gradient-to-r from-violet-400 via-pink-400 to-amber-400 bg-clip-text text-transparent">
                카드 유니버스
              </span>
              를<br />만들어보세요
            </h1>

            <p className="text-lg text-gray-400 mb-10 leading-relaxed">
              직접 디자인한 TCG 카드를 수집하고,
              <br />
              다른 플레이어와 거래하는 디지털 플랫폼.
            </p>

            <div className="flex items-center gap-4 flex-wrap">
              <Link
                href="/signup"
                className="px-7 py-3.5 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-violet-900/40 text-sm"
              >
                무료로 시작하기
              </Link>
              <Link
                href="/login"
                className="px-7 py-3.5 text-gray-300 hover:text-white border border-white/10 hover:border-white/25 rounded-xl transition-colors text-sm"
              >
                로그인
              </Link>
            </div>
          </div>

          {/* Right — card stack */}
          <div className="relative h-80 hidden lg:flex items-center justify-center">
            {/* Card 3 — back */}
            <div className="absolute w-44 h-60 rounded-2xl bg-gradient-to-br from-rose-600 to-pink-900 border border-white/10 shadow-2xl transform rotate-[18deg] translate-x-14 opacity-50">
              <div className="absolute inset-2 rounded-xl border border-white/10 flex flex-col items-center justify-center gap-1 p-3">
                <div className="text-3xl">🌸</div>
              </div>
            </div>
            {/* Card 2 — mid */}
            <div className="absolute w-44 h-60 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-800 border border-white/10 shadow-2xl transform rotate-[8deg] translate-x-6 opacity-75">
              <div className="absolute inset-2 rounded-xl border border-white/10 flex flex-col items-center justify-center gap-1 p-3">
                <div className="text-3xl">🔥</div>
                <div className="text-[10px] text-white/60 font-medium mt-1">FIRE TYPE</div>
              </div>
            </div>
            {/* Card 1 — front */}
            <div className="absolute w-44 h-60 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-900 border border-white/20 shadow-[0_20px_60px_rgba(99,102,241,0.4)] transform -rotate-[4deg] -translate-x-4">
              <div className="absolute inset-2 rounded-xl border border-white/20 flex flex-col items-center justify-between p-4">
                <div className="w-full flex justify-between items-center">
                  <span className="text-[10px] text-white/60 font-semibold">LV.42</span>
                  <span className="text-[10px] text-cyan-300 font-semibold">💧 WATER</span>
                </div>
                <div className="text-4xl my-2">💧</div>
                <div className="w-full space-y-1.5">
                  <div className="text-xs text-white font-bold">아쿠아 드래곤</div>
                  <div className="w-full h-px bg-white/10" />
                  <div className="flex justify-between text-[10px] text-white/50">
                    <span>HP 150</span>
                    <span>ATK 80</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-28">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              모든 것을 한 곳에서
            </h2>
            <p className="text-gray-400 text-lg">
              카드 제작부터 거래까지, 완전한 TCG 경험
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            <FeatureCard
              icon="🎨"
              color="violet"
              title="카드 제작"
              desc="원하는 능력치, 타입, 이름으로 나만의 독창적인 카드를 직접 만들어보세요."
            />
            <FeatureCard
              icon="📦"
              color="amber"
              title="컬렉션 관리"
              desc="보유한 카드를 덱별로 분류하고 컬렉션을 체계적으로 정리하세요."
            />
            <FeatureCard
              icon="⚡"
              color="cyan"
              title="P2P 거래"
              desc="마켓플레이스에서 다른 플레이어와 카드를 사고팔고 교환하세요."
            />
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-24 border-t border-white/5">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-3">이렇게 시작하세요</h2>
            <p className="text-gray-400">3단계로 바로 시작</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: "01", title: "회원가입", desc: "이메일 또는 소셜 계정으로 빠르게 가입" },
              { step: "02", title: "카드 제작", desc: "나만의 카드를 직접 디자인하고 능력치 설정" },
              { step: "03", title: "수집 & 거래", desc: "마켓플레이스에서 카드를 사고팔며 컬렉션 완성" },
            ].map((item) => (
              <div key={item.step} className="flex flex-col items-center text-center">
                <div className="text-4xl font-black text-violet-500/30 mb-3">{item.step}</div>
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="py-24 relative">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[300px] bg-violet-600/10 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-2xl mx-auto text-center px-6">
          <h2 className="text-4xl lg:text-5xl font-bold mb-5 leading-tight">
            지금 바로<br />
            <span className="bg-gradient-to-r from-violet-400 to-amber-400 bg-clip-text text-transparent">
              첫 카드를 만들어보세요
            </span>
          </h2>
          <p className="text-gray-400 mb-10 text-lg">
            무료로 가입하고 나만의 카드 유니버스를 시작하세요
          </p>
          <Link
            href="/signup"
            className="inline-block px-10 py-4 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-bold rounded-2xl transition-all shadow-2xl shadow-violet-900/50 text-base"
          >
            무료로 시작하기 →
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/5 py-8 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-sm text-gray-600">
          <span className="font-semibold text-gray-500">어인섬 카드샵</span>
          <span>© 2026</span>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  color,
  title,
  desc,
}: {
  icon: string;
  color: "violet" | "amber" | "cyan";
  title: string;
  desc: string;
}) {
  const colorMap = {
    violet: "bg-violet-500/15 border-violet-500/20",
    amber: "bg-amber-500/15 border-amber-500/20",
    cyan: "bg-cyan-500/15 border-cyan-500/20",
  };
  const iconBg = {
    violet: "bg-violet-500/20",
    amber: "bg-amber-500/20",
    cyan: "bg-cyan-500/20",
  };

  return (
    <div
      className={`border rounded-2xl p-6 hover:scale-[1.02] transition-transform ${colorMap[color]}`}
    >
      <div
        className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-5 ${iconBg[color]}`}
      >
        {icon}
      </div>
      <h3 className="text-lg font-semibold mb-2 text-white">{title}</h3>
      <p className="text-sm text-gray-400 leading-relaxed">{desc}</p>
    </div>
  );
}
