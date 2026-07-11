import type { MetadataRoute } from 'next';

/**
 * PWA manifest — 앱 공통 경로에 둔다(route group 하위엔 manifest 파일을 배치할 수 없다). standalone
 * 홈스크린은 부가 이득이고, 키오스크 전체화면의 1차 주 수단은 Fullscreen API다(`app/(kiosk)/kiosk/[eid]/page.tsx`
 * 참조). manifest는 정적이라 eid별로 나눌 수 없어 `start_url`은 eid 비의존 '/'로 둔다.
 * basePath가 비어 있는 1차는 상대경로가 그대로 안전하다.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'morymaker',
    short_name: 'morymaker',
    description: '행사 참석확인·주차의전·좌석안내 키오스크',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#0c1322',
    theme_color: '#0c1322',
    icons: [{ src: '/icon', sizes: '512x512', type: 'image/png' }],
  };
}
