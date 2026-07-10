'use client';

import { useHub } from '@/hooks/useHub';
import { VisitorApiError } from '@/lib/api/visitor';
import { CheckinQr } from './CheckinQr';
import { InviteCard } from './InviteCard';
import { NoticeView } from './NoticeView';
import { ParkEntryNotice } from './ParkEntryNotice';
import { PlatePreregForm } from './PlatePreregForm';

interface PersonalHubProps {
  token: string;
}

/** VIS-00 개인허브 오케스트레이션 — 로딩 / 무효 링크(404) / 성공 3분기. */
export function PersonalHub({ token }: PersonalHubProps) {
  const { data: hub, isLoading, error } = useHub(token);

  if (isLoading) {
    return <p className="p-6 text-desk text-ink-muted">불러오는 중...</p>;
  }

  if (error) {
    // 무효 token은 404 — 현장등록의 무효 eventCode와 코드가 동일해 메시지 파싱 없이 일반화한다.
    if (error instanceof VisitorApiError && error.status === 404) {
      return (
        <div className="p-6">
          <NoticeView title="유효하지 않은 링크입니다" message="초대 문자에 포함된 링크를 다시 확인해 주세요." />
        </div>
      );
    }
    return (
      <div className="p-6">
        <NoticeView title="잠시 후 다시 시도해 주세요" />
      </div>
    );
  }

  if (!hub) return null;

  return (
    <div className="mx-auto flex min-h-dvh max-w-xl flex-col gap-4 bg-surface-sunken p-6">
      <InviteCard hub={hub} />
      <CheckinQr url={hub.checkinQr.url} />
      <PlatePreregForm token={token} prereg={hub.prereg} />
      <ParkEntryNotice />
    </div>
  );
}
