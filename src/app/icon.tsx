import { ImageResponse } from 'next/og';

export const size = { width: 512, height: 512 };
export const contentType = 'image/png';

/**
 * PWA·매니페스트 아이콘을 코드로 생성한다(바이너리 자산 회피 — `public/` 폴더 자체가 없다).
 * 1차는 단색 네이비 배경 + 텍스트 마크로 충분하다(installability 경고 회피 목적). 실 로고 자산은 후속 교체 대상.
 */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0c1322',
          color: '#ffffff',
          fontSize: 260,
          fontWeight: 700,
        }}
      >
        M
      </div>
    ),
    { ...size },
  );
}
