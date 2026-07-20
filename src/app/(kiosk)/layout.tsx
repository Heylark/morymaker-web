import type { Viewport } from 'next';

// kiosk 표면 한정 viewport 고정 — 핀치 줌·확대를 막아 무인 오조작을 차단한다.
// themeColor는 globals.css의 최심층 배경 토큰과 정합시킨다(다크 시그니처 배경값 변경 시 이 값도
// 함께 갱신할 것). 다른 표면(staff·visitor·console)은 무영향.
export const viewport: Viewport = {
  maximumScale: 1,
  userScalable: false,
  themeColor: '#08090C',
};

// 행사가 라이트를 선택해도 키오스크만은 항상 다크로 고정한다 — 이 래퍼 요소가 그 지점이다.
// 기존엔 패스스루(`<>`)라 다크를 걸 루트 요소가 없었고, 페이지의 상단 nav가 셸 컴포넌트의
// 형제 노드라 테마가 누락될 위험이 있었다. 이제 nav와 셸 둘 다 이 래퍼 하위가 되어 한 번에
// 다크 고정·누락 문제가 함께 해결된다.
export default function KioskLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div data-theme="dark" className="min-h-dvh bg-[var(--void)] text-[var(--ivory)]">
      {children}
    </div>
  );
}
