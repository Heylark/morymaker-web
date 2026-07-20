'use client';

import { useState } from 'react';
import { useSlotView } from '@/hooks/useSlotView';
import { VisitorApiError } from '@/lib/api/visitor';
import { BrandingScope } from '@/components/branding/BrandingScope';
import { NoticeView } from './NoticeView';
import { ParkSelfForm } from './ParkSelfForm';

interface SlotViewProps {
  slotCode: string;
  token?: string;
}

/**
 * VIS-01 자리 QR 진입 오케스트레이션 — 로딩 / 무효 자리(404) / 성공(viewType 2분기) 3분기.
 * 주차중(OCCUPIED_NOTICE) 자리는 타인정보 미노출 1단계 안내를 먼저 보여주고, 사용자가
 * "그래도 제 차 등록"을 명시적으로 눌러야만 승계 폼(2단계)이 열린다 — 확인 없이 곧바로
 * 폼·POST가 노출되는 오클릭 경로를 차단한다(서버는 승계 POST를 조용히 200으로 받아준다).
 * 행사 액센트 색은 성공 분기(1·2단계 모두)에서만 도착하므로 스코프는 전 분기를 감싸는
 * 래퍼 1겹으로 두고 분기 자체는 건드리지 않는다.
 */
export function SlotView({ slotCode, token }: SlotViewProps) {
  const { data: view, isLoading, error } = useSlotView(slotCode);
  const [occupiedConfirmed, setOccupiedConfirmed] = useState(false);

  return <BrandingScope pointColor={view?.event.pointColor}>{renderBody()}</BrandingScope>;

  function renderBody() {
    if (isLoading) {
      return (
        <div className="flex min-h-dvh items-center justify-center bg-surface p-6">
          <p className="text-desk text-ink-muted">불러오는 중...</p>
        </div>
      );
    }

    if (error) {
      // 무효 slotCode는 404 — 다른 방문자 공개 화면과 동일 코드라 메시지 파싱 없이 일반화한다(enumeration-safe).
      if (error instanceof VisitorApiError && error.status === 404) {
        return (
          <div className="min-h-dvh bg-surface p-6">
            <NoticeView title="유효하지 않은 자리입니다" message="자리 QR을 다시 확인해 주세요." />
          </div>
        );
      }
      return (
        <div className="min-h-dvh bg-surface p-6">
          <NoticeView title="잠시 후 다시 시도해 주세요" />
        </div>
      );
    }

    if (!view) return null;

    if (view.viewType === 'OCCUPIED_NOTICE' && !occupiedConfirmed) {
      return (
        <div className="mx-auto flex min-h-dvh max-w-xl flex-col gap-4 bg-surface p-6">
          <NoticeView title="이미 주차 기록이 있는 자리입니다" message="본인 차량이면 아래에서 등록해 주세요." />
          <button
            type="button"
            onClick={() => setOccupiedConfirmed(true)}
            className="min-h-touch flex items-center justify-center rounded-[var(--radius-sharp)] border border-line bg-transparent px-6 text-desk font-bold tracking-[var(--ls-cta)] text-primary"
          >
            그래도 제 차 등록
          </button>
        </div>
      );
    }

    return (
      <div className="mx-auto flex min-h-dvh max-w-xl flex-col gap-4 bg-surface p-6">
        <ParkSelfForm
          slotCode={slotCode}
          slot={view.slot}
          occupied={view.viewType === 'OCCUPIED_NOTICE'}
          token={token}
        />
      </div>
    );
  }
}
