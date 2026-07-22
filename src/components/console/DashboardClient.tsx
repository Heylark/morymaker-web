'use client';

import { useStats } from '@/hooks/useStats';
import { RealtimeCharts } from './RealtimeCharts';
import { StatsExcelButton } from './StatsExcelButton';

interface DashboardClientProps {
  eid: string;
}

/**
 * ADM-03 행사 현황 오케스트레이터 — 최상위 `<div>`(`ConsoleShell`이 이미 `<main>`을
 * 보유하고 있어 여기서 또 `<main>`을 두면 랜드마크가 중복된다 — SeatsClient/ZoneList와 동일
 * 관용구). `useStats`가 15초 폴링을 국소 적용하므로 이 컴포넌트는 조회 상태 분기만 담당한다.
 */
export function DashboardClient({ eid }: DashboardClientProps) {
  const { data: stats, isLoading, isError } = useStats(eid);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-desk-lg font-semibold text-ink">행사 현황</h1>
        <StatsExcelButton eid={eid} />
      </div>

      {isLoading && <p className="text-ink-muted">불러오는 중...</p>}
      {isError && <p className="text-danger">통계를 불러오지 못했습니다.</p>}
      {stats && <RealtimeCharts stats={stats} />}
    </div>
  );
}
