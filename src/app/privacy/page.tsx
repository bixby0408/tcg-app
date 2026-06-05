import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "개인정보처리방침 | 어인섬 카드샵",
  description: "어인섬 카드샵 및 SOOP TCG 코인 리워드 확장프로그램 개인정보처리방침",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#07070f] text-gray-300">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-2xl font-bold text-white mb-2">개인정보처리방침</h1>
        <p className="text-sm text-gray-500 mb-10">최종 수정일: 2026년 6월 5일</p>

        <section className="mb-10">
          <p className="leading-relaxed">
            어인섬 카드샵(이하 &quot;서비스&quot;)은 SOOP TCG 코인 리워드 크롬 확장프로그램(이하 &quot;확장프로그램&quot;)을 포함한 서비스 운영 과정에서
            수집하는 개인정보를 아래와 같이 처리합니다. 본 방침은 개인정보 보호법 및 관련 법령에 따라 작성되었습니다.
          </p>
        </section>

        <Section title="1. 수집하는 개인정보 항목">
          <Subsection title="가. 회원가입 및 로그인">
            <ul className="list-disc pl-5 space-y-1">
              <li>이메일 주소</li>
              <li>비밀번호 (암호화 저장, 서비스가 직접 보관하지 않음)</li>
              <li>소셜 로그인(Google, 카카오) 이용 시 해당 서비스에서 제공하는 계정 식별자 및 이메일</li>
              <li>서비스 내 사용 닉네임</li>
            </ul>
          </Subsection>
          <Subsection title="나. 확장프로그램 사용 시 (자동 수집)">
            <ul className="list-disc pl-5 space-y-1">
              <li>SOOP에서 시청한 스트리머의 채널 ID</li>
              <li>시청 시간 (코인 적립 임계값 달성 시에만 서버로 전송)</li>
              <li>획득한 코인 수량</li>
            </ul>
          </Subsection>
          <Subsection title="다. 수집하지 않는 정보">
            <ul className="list-disc pl-5 space-y-1">
              <li>SOOP 외 다른 웹사이트 방문 기록</li>
              <li>검색어, 클릭, 스크롤 등 상세 행동 데이터</li>
              <li>기기 고유 식별자</li>
              <li>위치 정보</li>
            </ul>
          </Subsection>
        </Section>

        <Section title="2. 개인정보 수집 방법">
          <ul className="list-disc pl-5 space-y-1">
            <li>회원가입 및 로그인 시 사용자 직접 입력</li>
            <li>Google · 카카오 OAuth 인증을 통한 소셜 로그인</li>
            <li>확장프로그램의 SOOP 페이지 URL 분석을 통한 자동 수집</li>
          </ul>
        </Section>

        <Section title="3. 개인정보 이용 목적">
          <ul className="list-disc pl-5 space-y-1">
            <li>회원 식별 및 서비스 이용 자격 확인</li>
            <li>SOOP 시청 시간에 따른 코인 적립 및 지급</li>
            <li>코인 적립 대상 스트리머 여부 검증</li>
            <li>서비스 내 코인 잔액 관리 및 이력 조회</li>
            <li>부정 이용 방지</li>
          </ul>
        </Section>

        <Section title="4. 개인정보 보유 및 이용 기간">
          <ul className="list-disc pl-5 space-y-1">
            <li>회원 탈퇴 시까지 보유 후 지체 없이 파기</li>
            <li>단, 관련 법령에 의해 보존이 필요한 경우 해당 기간 동안 보관
              <ul className="list-disc pl-5 mt-1 space-y-1 text-gray-400">
                <li>전자상거래 관련 기록: 5년 (전자상거래법)</li>
                <li>접속 로그 기록: 3개월 (통신비밀보호법)</li>
              </ul>
            </li>
          </ul>
        </Section>

        <Section title="5. 개인정보 제3자 제공">
          <p>서비스는 수집한 개인정보를 제3자에게 제공하지 않습니다. 단, 아래의 경우는 예외로 합니다.</p>
          <ul className="list-disc pl-5 space-y-1 mt-3">
            <li>사용자가 사전에 동의한 경우</li>
            <li>법령의 규정에 따라 수사 기관 등의 요청이 있는 경우</li>
          </ul>
        </Section>

        <Section title="6. 개인정보 처리 위탁">
          <p className="mb-3">서비스는 원활한 운영을 위해 아래 업체에 개인정보 처리를 위탁합니다.</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-2 pr-4 text-gray-400 font-medium">수탁 업체</th>
                  <th className="text-left py-2 pr-4 text-gray-400 font-medium">위탁 업무</th>
                  <th className="text-left py-2 text-gray-400 font-medium">보유 기간</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-800">
                  <td className="py-2 pr-4">Supabase Inc.</td>
                  <td className="py-2 pr-4">회원 인증, 데이터베이스 저장</td>
                  <td className="py-2">회원 탈퇴 시</td>
                </tr>
                <tr className="border-b border-gray-800">
                  <td className="py-2 pr-4">Vercel Inc.</td>
                  <td className="py-2 pr-4">서버 API 운영 및 서비스 호스팅</td>
                  <td className="py-2">서비스 종료 시</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">Google LLC</td>
                  <td className="py-2 pr-4">소셜 로그인 인증 (이용자 선택 시)</td>
                  <td className="py-2">인증 완료 즉시</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Section>

        <Section title="7. 확장프로그램의 데이터 처리">
          <ul className="list-disc pl-5 space-y-1">
            <li>확장프로그램은 SOOP 도메인의 페이지에만 동작하며 다른 웹사이트의 정보에 접근하지 않습니다.</li>
            <li>인증 토큰은 브라우저 로컬 스토리지(chrome.storage.local)에만 저장되며 제3자에게 전달되지 않습니다.</li>
            <li>시청 기록은 코인 적립 목적으로만 자체 서버에 전송되며 마케팅·광고 목적으로 활용되지 않습니다.</li>
            <li>
              <strong className="text-gray-200">scripting 권한 사용:</strong> 확장프로그램 설치·업데이트·브라우저 재시작 시
              이미 열려 있는 SOOP 탭에 콘텐츠 스크립트를 자동으로 주입하기 위해 사용됩니다.
              이 과정에서 추가적인 개인정보는 수집되지 않으며, 주입 대상은 manifest에 선언된
              SOOP 도메인(sooplive.com, sooplive.co.kr, soop.com, afreecatv.com)으로만 제한됩니다.
            </li>
          </ul>
        </Section>

        <Section title="8. 정보주체의 권리">
          <p className="mb-3">이용자는 언제든지 아래 권리를 행사할 수 있습니다.</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>개인정보 열람 요청</li>
            <li>개인정보 정정·삭제 요청</li>
            <li>개인정보 처리 정지 요청</li>
            <li>회원 탈퇴 (즉시 처리, 탈퇴 시 모든 개인정보 파기)</li>
          </ul>
          <p className="mt-3 text-gray-400 text-sm">권리 행사는 아래 이메일로 요청하시면 지체 없이 조치합니다.</p>
        </Section>

        <Section title="9. 개인정보 보호책임자">
          <ul className="list-disc pl-5 space-y-1">
            <li>이메일: <a href="mailto:qkrtnqls456789@gmail.com" className="text-purple-400 hover:underline">qkrtnqls456789@gmail.com</a></li>
          </ul>
        </Section>

        <Section title="10. 개인정보처리방침 변경">
          <p>
            본 방침은 법령·서비스 변경에 따라 개정될 수 있으며, 변경 시 서비스 내 공지 또는 이메일로 안내합니다.
            변경된 방침은 공지 후 7일이 경과한 날부터 효력이 발생합니다.
          </p>
        </Section>

        <p className="mt-12 text-xs text-gray-600 text-center">시행일: 2026년 6월 5일</p>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-base font-semibold text-white mb-3 pb-2 border-b border-gray-800">{title}</h2>
      <div className="space-y-2 text-sm leading-relaxed">{children}</div>
    </section>
  );
}

function Subsection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <h3 className="text-sm font-medium text-gray-300 mb-2">{title}</h3>
      {children}
    </div>
  );
}
