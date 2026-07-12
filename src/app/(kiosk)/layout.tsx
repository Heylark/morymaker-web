import type { Viewport } from 'next';

// kiosk 표면 한정 viewport 고정 — 핀치 줌·확대를 막아 무인 오조작을 차단한다.
// themeColor는 manifest의 theme_color(#0c1322)와 정합시킨다. 다른 표면(staff·visitor·console)은 무영향.
export const viewport: Viewport = {
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0c1322',
};

export default function KioskLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
