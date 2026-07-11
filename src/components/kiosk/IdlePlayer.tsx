'use client';

import { useKioskIdleContents } from '@/hooks/useKioskIdleContents';
import type { IdleContent } from '@/types/kiosk';

interface IdlePlayerProps {
  eid: string;
  onTouch: () => void;
}

/**
 * fileUrl이 있으면(후속 백엔드) kind로 미디어 분기해 렌더한다 — 1차엔 fileUrl이 항상 null이라
 * 이 분기는 비활성 경로로 남는다(실 미디어 저장이 구현되면 자동 활성화되는 자리 확보).
 */
function IdleContentBody({ content }: { content: IdleContent }) {
  if (content.fileUrl) {
    if (content.kind === '영상') {
      return <video src={content.fileUrl} autoPlay loop muted className="max-h-[50vh] max-w-full rounded-card" />;
    }
    return (
      // eslint-disable-next-line @next/next/no-img-element -- 관리자 업로드 원격 URL, next/image 최적화 대상 아님
      <img src={content.fileUrl} alt={content.name} className="max-h-[50vh] max-w-full rounded-card" />
    );
  }
  return <p className="text-desk-lg font-semibold text-ink">{content.name}</p>;
}

/**
 * 대기화면 — idle-contents 소비(브랜딩 색 없이 디자인 토큰 기본색 사용 / 미디어는 1차 null
 * 방어 / eid 사전 유효성 게이트 없음 — 항상 렌더되고, 최초 액션의 404가 무효 eid를 대체
 * 처리한다). 터치 시 onTouch(메뉴 전이·전체화면 요청은 호출부 책임).
 */
export function IdlePlayer({ eid, onTouch }: IdlePlayerProps) {
  const { data: contents } = useKioskIdleContents(eid);
  const first = contents?.[0];

  return (
    <button
      type="button"
      onClick={onTouch}
      className="flex min-h-[60vh] w-full flex-col items-center justify-center gap-6"
    >
      {first ? (
        <IdleContentBody content={first} />
      ) : (
        <p className="text-desk-lg font-semibold text-ink">행사에 오신 것을 환영합니다</p>
      )}
      <p className="text-desk text-ink-muted">화면을 터치하세요</p>
    </button>
  );
}
