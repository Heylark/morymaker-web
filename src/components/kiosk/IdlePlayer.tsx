'use client';

import { useCallback, useEffect, useState } from 'react';
import { useKioskIdleContents } from '@/hooks/useKioskIdleContents';
import { IDLE_CYCLE_INTERVAL_MS } from '@/lib/kiosk/constants';
import type { IdleContent } from '@/types/kiosk';

interface IdlePlayerProps {
  eid: string;
  onTouch: () => void;
}

/**
 * 한 항목을 렌더한다. 영상은 성공 재생 시 onEnded로 다음 항목을 요청하고(단일 항목이면 제자리
 * loop), 이미지·영상 실패 폴백·이름 텍스트 폴백은 고정 간격 타이머로 다음 항목을 요청한다.
 * `failed`는 렌더 대상이 바뀔 때마다 부모가 주는 `key`로 리마운트되며 초기화된다 — useEffect
 * props→state 동기화는 쓰지 않는다(미디어 폴백 오염 방지). onAdvance가 없으면(항목 1개) 전환
 * 자체가 없다.
 */
function IdleContentBody({
  content,
  onAdvance,
}: {
  content: IdleContent;
  onAdvance?: () => void;
}) {
  const [failed, setFailed] = useState(false);
  const isVideo = content.kind === '영상';
  const showMedia = Boolean(content.fileUrl) && !failed;

  // 성공 재생 중인 영상만 onEnded로 전환한다. 이미지·폴백·영상실패는 타이머로 전환.
  // (영상 onError → failed=true → showMedia=false → 이 effect가 타이머를 걸어 강제 전환)
  const usesTimer = Boolean(onAdvance) && (!showMedia || !isVideo);
  useEffect(() => {
    if (!usesTimer || !onAdvance) return;
    const t = setTimeout(onAdvance, IDLE_CYCLE_INTERVAL_MS);
    return () => clearTimeout(t);
  }, [usesTimer, onAdvance]);

  if (showMedia) {
    if (isVideo) {
      return (
        <video
          src={content.fileUrl!}
          autoPlay
          // 항목 1개(onAdvance 없음)면 제자리 loop, 다건이면 loop 해제해 onEnded가 발화하게 한다.
          loop={!onAdvance}
          muted
          playsInline
          onEnded={onAdvance}
          onError={() => setFailed(true)}
          className="max-h-[50vh] max-w-full rounded-card"
        />
      );
    }
    return (
      // eslint-disable-next-line @next/next/no-img-element -- 관리자 업로드 원격 URL, next/image 최적화 대상 아님
      <img
        src={content.fileUrl!}
        alt={content.name}
        onError={() => setFailed(true)}
        className="max-h-[50vh] max-w-full rounded-card"
      />
    );
  }
  return <p className="text-desk-lg font-semibold text-ink">{content.name}</p>;
}

/**
 * 대기화면 — idle-contents 소비(브랜딩 색은 상위 페이지가 BrandingScope로 주입 — 이 컴포넌트는
 * 액센트 자체를 계산하지 않는다) / eid 사전 유효성 게이트 없음 — 항상 렌더되고, 최초 액션의
 * 404가 무효 eid를 대체 처리한다). 터치 시 onTouch(메뉴 전이·전체화면 요청은 호출부 책임).
 *
 * 다건 콘텐츠는 순환한다 — 정렬은 서버가 이미 처리(`ORDER BY sort_order`)하므로 클라에서
 * 재정렬하지 않는다. 인덱스는 단조 증가시키고 읽을 때만 modulo — 콘텐츠 개수가 refetch로
 * 바뀌어도 out-of-bounds가 나지 않는다.
 *
 * 기본 문구(미디어 없음) 워드마크는 세리프 + 골드 그라데이션 텍스트 클립으로 각인한다 —
 * 필터 발광은 쓰지 않는다(이 화면은 장식 발광 예산 0, 행동을 요구하지 않는 대기 화면).
 */
export function IdlePlayer({ eid, onTouch }: IdlePlayerProps) {
  const { data: contents } = useKioskIdleContents(eid);
  const [index, setIndex] = useState(0);

  const count = contents?.length ?? 0;
  const hasMultiple = count > 1;
  const current = count > 0 ? contents![index % count] : undefined;

  const advance = useCallback(() => setIndex((i) => i + 1), []);

  return (
    <button
      type="button"
      onClick={onTouch}
      className="flex min-h-[60vh] w-full flex-col items-center justify-center gap-6"
    >
      {current ? (
        <IdleContentBody key={current.id} content={current} onAdvance={hasMultiple ? advance : undefined} />
      ) : (
        <p className="text-center font-[var(--serif)] text-[length:clamp(22px,3.6vw,40px)] leading-[1.25] bg-[image:var(--gold-grad)] bg-clip-text text-transparent">
          행사에 오신 것을 환영합니다
        </p>
      )}
      <p className="text-[13px] tracking-[0.2em] text-ink-muted">화면을 터치하세요</p>
    </button>
  );
}
