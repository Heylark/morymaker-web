'use client';

import { useEffect, useId } from 'react';
import { useShellOverlay } from '../shell/shell-context';
import { useOverlayFocusTrap } from '../shell/use-overlay-focus-trap';

interface ConsoleModalProps {
  open: boolean;
  onClose: () => void;
  /** 접근성 제목 — <h2>로 렌더되며 aria-labelledby로 연결된다. */
  title: string;
  /** 편집 변경 존재 여부 — true면 스크림 클릭에만 확인 보호(§5). ESC·취소는 즉시 닫힘. */
  dirty?: boolean;
  /** 카드 최대 폭 — 기본 'md'(380px 상당). 좌석 배정처럼 넓은 편집은 'lg'(480px). */
  size?: 'md' | 'lg';
  children: React.ReactNode;
}

const SIZE_CLASS: Record<'md' | 'lg', string> = {
  md: 'md:max-w-[380px]',
  lg: 'md:max-w-[480px]',
};

/**
 * 공용 편집/확인 모달 카드 — 스크림·기하·닫기 3경로·dirty 보호를 여기 1곳에서 소유한다(§5).
 * 소비처는 제목·children(폼 필드·버튼·mutation)만 넘긴다. 카드 스타일(테두리·모서리·그림자)도
 * 이 래퍼가 소유 — 이관 전 각 모달이 반복하던 `rounded-card border ... shadow-lg` 조각을
 * 여기 1곳으로 모은다.
 *
 * 오버레이 기하는 `useShellOverlay()`가 계산한 문자열을 그대로 소비한다 — 사이드바
 * 폭·탭바 유무를 이 컴포넌트가 직접 알 필요가 없다. 셸 밖에서 쓰이면(컨텍스트 null) 전체 화면
 * `fixed inset-0`으로 안전 퇴화한다.
 *
 * 포커스 이동·Tab 트랩·복귀는 `useOverlayFocusTrap`(AccountSheet와 공유)이 소유한다 —
 * registerOverlay()의 inert는 사이드바·탭바에만 걸려 물리적 Tab 순서를 막지 못하기 때문.
 */
export function ConsoleModal({ open, onClose, title, dirty = false, size = 'md', children }: ConsoleModalProps) {
  const overlay = useShellOverlay();
  const titleId = useId();
  const dialogRef = useOverlayFocusTrap(open);

  useEffect(() => {
    if (!open) return;
    const unregister = overlay?.registerOverlay();
    document.body.style.overflow = 'hidden';

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      unregister?.();
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
    // open 전이 시점에만 등록/해제한다 — onClose·overlay 참조 변화로 재등록하지 않는다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  // 닫기 3경로 중 스크림 클릭만 dirty 보호 대상이다(§5). ESC·[취소]는 소비처·위 handleKeyDown이
  // 즉시 onClose를 호출한다 — "모달 위 모달"을 만들지 않도록 네이티브 confirm만 사용한다.
  const handleScrimClick = () => {
    if (dirty && !window.confirm('변경 내용이 저장되지 않았습니다. 닫을까요?')) return;
    onClose();
  };

  const frameClassName = overlay?.overlayFrameClassName ?? 'fixed inset-0 z-50';

  return (
    <div className={frameClassName} role="presentation">
      <div data-theme="dark" onClick={handleScrimClick} aria-hidden className="absolute inset-0 bg-[var(--void)] opacity-60" />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        data-theme="light"
        data-console-scope
        className={`absolute inset-x-0 bottom-0 flex w-full max-h-[85vh] flex-col gap-4 overflow-y-auto rounded-t-[var(--radius-frame)] border border-line-soft bg-surface p-6 [box-shadow:var(--shadow-kiosk)] md:relative md:mx-auto md:my-auto md:rounded-[var(--radius-frame)] ${SIZE_CLASS[size]}`}
      >
        <div className="mx-auto h-1 w-10 shrink-0 rounded-full bg-[var(--line-soft)] md:hidden" />
        <h2 id={titleId} className="text-desk-lg font-semibold text-ink">
          {title}
        </h2>
        {children}
      </div>
    </div>
  );
}
