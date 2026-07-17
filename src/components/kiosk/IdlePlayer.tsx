'use client';

import { useState } from 'react';
import { useKioskIdleContents } from '@/hooks/useKioskIdleContents';
import type { IdleContent } from '@/types/kiosk';

interface IdlePlayerProps {
  eid: string;
  onTouch: () => void;
}

/**
 * fileUrl이 있으면 kind로 미디어 분기해 렌더한다. 로드 실패(파일 유실·미지원 코덱 등으로 인한
 * 404·디코드 에러) 시 이름 텍스트로 폴백해 죽은 화면을 막는다 — `failed` state는 렌더 대상
 * 콘텐츠가 바뀔 때마다 IdlePlayer가 부여하는 `key`로 컴포넌트가 리마운트되며 초기화된다
 * (useEffect props→state 동기화 안티패턴 회피).
 */
function IdleContentBody({ content }: { content: IdleContent }) {
  const [failed, setFailed] = useState(false);

  if (content.fileUrl && !failed) {
    if (content.kind === '영상') {
      return (
        <video
          src={content.fileUrl}
          autoPlay
          loop
          muted
          playsInline
          onError={() => setFailed(true)}
          className="max-h-[50vh] max-w-full rounded-card"
        />
      );
    }
    return (
      // eslint-disable-next-line @next/next/no-img-element -- 관리자 업로드 원격 URL, next/image 최적화 대상 아님
      <img
        src={content.fileUrl}
        alt={content.name}
        onError={() => setFailed(true)}
        className="max-h-[50vh] max-w-full rounded-card"
      />
    );
  }
  return <p className="text-desk-lg font-semibold text-ink">{content.name}</p>;
}

/**
 * 대기화면 — idle-contents 소비(브랜딩 색 없이 디자인 토큰 기본색 사용 / eid 사전 유효성 게이트
 * 없음 — 항상 렌더되고, 최초 액션의 404가 무효 eid를 대체 처리한다). 터치 시 onTouch(메뉴 전이·
 * 전체화면 요청은 호출부 책임).
 *
 * 기본 문구(미디어 없음) 워드마크는 세리프 + 골드 그라데이션 텍스트 클립으로 각인한다 —
 * 필터 발광은 쓰지 않는다(이 화면은 장식 발광 예산 0, 행동을 요구하지 않는 대기 화면).
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
        <IdleContentBody key={first.id} content={first} />
      ) : (
        <p className="text-center font-[var(--serif)] text-[length:clamp(22px,3.6vw,40px)] leading-[1.25] bg-[image:var(--gold-grad)] bg-clip-text text-transparent">
          행사에 오신 것을 환영합니다
        </p>
      )}
      <p className="text-[13px] tracking-[0.2em] text-ink-muted">화면을 터치하세요</p>
    </button>
  );
}
