import { ImageResponse } from 'next/og';

export const size = { width: 512, height: 512 };
export const contentType = 'image/png';

/**
 * PWA·매니페스트 아이콘을 코드로 생성한다(바이너리 자산 회피 — `public/` 폴더 자체가 없다).
 * 1차는 단색 배경 + 텍스트 마크로 충분하다(installability 경고 회피 목적). 실 로고 자산은 후속 교체
 * 대상. 배경색은 globals.css의 최심층 배경 토큰과 값을 맞춘다 — 정적 이미지 생성 코드라 CSS
 * 변수를 참조할 수 없으므로, 다크 시그니처 배경값이 바뀌면 이 값도 함께 수정할 것.
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
          background: '#08090C',
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
