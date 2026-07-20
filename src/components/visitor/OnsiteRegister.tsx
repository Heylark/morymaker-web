'use client';

import { useOnsiteForm } from '@/hooks/useOnsiteForm';
import { VisitorApiError } from '@/lib/api/visitor';
import { BrandingScope } from '@/components/branding/BrandingScope';
import { NoticeView } from './NoticeView';
import { OnsiteRegisterForm } from './OnsiteRegisterForm';

interface OnsiteRegisterProps {
  eventCode: string;
}

/**
 * VIS-02 현장등록 오케스트레이션 — 로딩 / 무효 링크(404) / 종료(409) / 성공 폼 4분기.
 * 행사 액센트 색은 성공 분기에서만 도착하므로 스코프는 전 분기를 감싸는 래퍼 1겹으로 두고
 * 분기 자체는 건드리지 않는다.
 */
export function OnsiteRegister({ eventCode }: OnsiteRegisterProps) {
  const { data: form, isLoading, error } = useOnsiteForm(eventCode);

  return <BrandingScope pointColor={form?.event.pointColor}>{renderBody()}</BrandingScope>;

  function renderBody() {
    if (isLoading) {
      return (
        <div className="flex min-h-dvh items-center justify-center bg-surface p-6">
          <p className="text-desk text-ink-muted">불러오는 중...</p>
        </div>
      );
    }

    if (error) {
      // 무효 eventCode는 404 — 개인허브의 무효 token과 코드가 동일해 메시지 파싱 없이 일반화한다.
      if (error instanceof VisitorApiError && error.status === 404) {
        return (
          <div className="min-h-dvh bg-surface p-6">
            <NoticeView title="유효하지 않은 링크입니다" message="행사 안내를 다시 확인해 주세요." />
          </div>
        );
      }
      // 409는 코드가 달라 구분 가능 — 종료 안내를 별도 문구로 노출한다.
      if (error instanceof VisitorApiError && error.status === 409) {
        return (
          <div className="min-h-dvh bg-surface p-6">
            <NoticeView title="종료된 행사입니다" message="현장등록이 마감되었습니다." />
          </div>
        );
      }
      return (
        <div className="min-h-dvh bg-surface p-6">
          <NoticeView title="잠시 후 다시 시도해 주세요" />
        </div>
      );
    }

    if (!form) return null;

    return (
      <div className="mx-auto flex min-h-dvh max-w-xl flex-col gap-4 bg-surface p-6">
        <p className="text-desk-lg font-extrabold text-ink">{form.event.name}</p>
        <OnsiteRegisterForm eventCode={eventCode} />
      </div>
    );
  }
}
