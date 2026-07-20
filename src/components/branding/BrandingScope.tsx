'use client';

import { accentVars, canDeriveAccent } from './branding-scope';

interface BrandingScopeProps {
  /** 행사가 저장한 포인트 색. 미지정 행사는 null — 시스템 기본색을 그대로 상속한다. */
  pointColor: string | null | undefined;
  children: React.ReactNode;
}

/**
 * 행사 액센트 스코프 — 하위 트리의 액센트 변수만 행사 색으로 갈아끼운다.
 *
 * 배경·본문 등 구조색은 건드리지 않는다(디자인 규약이 명시 금지 — 다크 시그니처 정체성).
 * 박스를 만들지 않는 캐리어로 두는 이유: 하위 분기들이 각자 전체 화면 높이 루트를 갖고
 * 있어 실제 요소를 한 겹 끼우면 레이아웃에 영향을 줄 수 있는데, 상속은 요소 트리를 따르므로
 * 박스 없이도 변수는 그대로 전파된다.
 *
 * 이 스코프는 "색이 서버 HTML에 실리지 않는다"는 전제 위에 있다 — 공개 조회는 클라이언트에서만
 * 페치되므로 서버 렌더에는 색이 없고, 주입은 항상 하이드레이션 이후에만 일어난다. 서버
 * 프리페치를 도입하면 브라우저 지원 판정이 서버와 클라이언트에서 갈려 하이드레이션이 어긋난다.
 */
export function BrandingScope({ pointColor, children }: BrandingScopeProps) {
  if (!pointColor || !canDeriveAccent()) return <>{children}</>;

  return (
    <div data-event-branded style={{ display: 'contents', ...accentVars(pointColor) } as React.CSSProperties}>
      {children}
    </div>
  );
}
