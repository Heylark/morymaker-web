import type {
  StatsResponse,
  RegistrationResponse,
  AttendanceResponse,
  ParkingResponse,
  ArrivalResponse,
  TimelineResponse,
} from '@/types/stats';

/**
 * ADM-03 통계 시각화 — 5블록 전부 단순(도넛·수평막대·진행바·6점 라인·리스트)해 차트 라이브러리를
 * 도입하지 않고 inline SVG/CSS로 직접 그린다(CP-2 A 확정). 색은 전부 `var(--*)` 토큰만 참조해
 * `[data-theme]` 재매핑을 무비용으로 상속한다 — 콘솔은 라이트 스코프라 발광 예산은 자동 0.
 * 서버가 집계·포맷을 완료한 값을 표시만 한다(재집계·재포맷 금지) — 표시-단위 변환(0~1 → ×100%,
 * occupied/slotCount → 막대 폭 %)만 렌더 기하 계산으로 허용된다.
 *
 * 각 서브가 30줄 내외라 별도 파일로 과분해하지 않고 이 파일에 colocate한다(사용처가 대시보드
 * 1곳뿐이라 전역 primitive로 승격하지 않음 — YAGNI).
 */

interface StatCardProps {
  title: string;
  className?: string;
  children: React.ReactNode;
}

function StatCard({ title, className, children }: StatCardProps) {
  return (
    <div className={['rounded-card border border-line-soft bg-surface p-4', className ?? ''].filter(Boolean).join(' ')}>
      <h2 className="mb-3 text-sm font-semibold text-ink-muted">{title}</h2>
      {children}
    </div>
  );
}

function RegistrationDonut({ registration }: { registration: RegistrationResponse }) {
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const onLength = registration.onRatio * circumference;
  const preLength = registration.preRatio * circumference;

  return (
    <StatCard title="등록 현황">
      <div className="flex flex-col items-center">
        <svg viewBox="0 0 120 120" className="h-32 w-32" role="img" aria-label={`전체 등록 ${registration.total}명`}>
          <g transform="rotate(-90 60 60)">
            <circle cx="60" cy="60" r={radius} fill="none" stroke="var(--line-soft)" strokeWidth="16" />
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke="var(--champagne)"
              strokeWidth="16"
              strokeDasharray={`${onLength} ${circumference - onLength}`}
            />
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke="var(--champagne-lo)"
              strokeWidth="16"
              strokeDasharray={`${preLength} ${circumference - preLength}`}
              strokeDashoffset={-onLength}
            />
          </g>
          <text x="60" y="56" textAnchor="middle" fontSize="22" fill="currentColor" className="font-serif text-ink">
            {registration.total}
          </text>
          <text x="60" y="72" textAnchor="middle" fontSize="9" fill="var(--muted)">
            총 등록
          </text>
        </svg>
        <div className="mt-3 flex gap-4 text-xs text-ink-muted">
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: 'var(--champagne)' }} />
            현장 {registration.on}
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: 'var(--champagne-lo)' }} />
            사전 {registration.pre}
          </span>
        </div>
      </div>
    </StatCard>
  );
}

function AttendanceBars({ attendance }: { attendance: AttendanceResponse }) {
  const rows = [
    { label: '사전등록', rate: attendance.preRate, count: attendance.preAtt },
    { label: '현장등록', rate: attendance.onRate, count: attendance.onAtt },
    { label: '전체', rate: attendance.totRate, count: attendance.totAtt },
  ];

  return (
    <StatCard title="참석 현황">
      <div className="flex flex-col gap-3">
        {rows.map((row) => (
          <div key={row.label} className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-sm text-ink-muted">
              <span>
                {row.label} ({row.count})
              </span>
              <span className="font-serif text-ink">{Math.round(row.rate * 100)}%</span>
            </div>
            <div className="h-2 w-full rounded-card" style={{ backgroundColor: 'var(--line-soft)' }}>
              <div
                className="h-2 rounded-card"
                style={{ width: `${Math.min(row.rate * 100, 100)}%`, backgroundColor: 'var(--champagne)' }}
              />
            </div>
          </div>
        ))}
      </div>
    </StatCard>
  );
}

function ParkingZoneBars({ parking }: { parking: ParkingResponse }) {
  return (
    <StatCard title="주차 현황">
      <p className="text-sm text-ink-muted">
        입차 <span className="font-serif text-ink">{parking.parked}</span>대
      </p>
      <div className="mt-3 flex flex-col gap-3">
        {parking.byZone.length === 0 && <p className="text-sm text-ink-muted">등록된 구획이 없습니다.</p>}
        {parking.byZone.map((zone) => {
          const pct = zone.slotCount > 0 ? Math.min((zone.occupied / zone.slotCount) * 100, 100) : 0;
          return (
            <div key={zone.zoneId} className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-sm text-ink-muted">
                <span className="flex items-center gap-2">
                  {zone.zoneName}
                  {zone.reviewNeeded > 0 && (
                    <span className="text-xs font-semibold text-danger">검토 {zone.reviewNeeded}건</span>
                  )}
                </span>
                <span className="text-ink">
                  {zone.occupied}/{zone.slotCount}
                </span>
              </div>
              <div className="h-2 w-full rounded-card" style={{ backgroundColor: 'var(--line-soft)' }}>
                <div className="h-2 rounded-card" style={{ width: `${pct}%`, backgroundColor: 'var(--champagne)' }} />
              </div>
            </div>
          );
        })}
      </div>
    </StatCard>
  );
}

function ArrivalsList({ arrivals }: { arrivals: ArrivalResponse[] }) {
  return (
    <StatCard title="도착 현황" className="xl:col-span-2">
      {arrivals.length === 0 ? (
        <p className="text-sm text-ink-muted">아직 도착한 게스트가 없습니다.</p>
      ) : (
        <ul className="flex max-h-64 flex-col gap-1 overflow-y-auto">
          {arrivals.map((arrival) => (
            <li
              key={arrival.guestId}
              className="flex items-center justify-between border-b border-line-soft py-1.5 text-sm last:border-b-0"
            >
              <span className="text-ink">{arrival.name}</span>
              <span className="text-ink-muted">{arrival.visitAt}</span>
            </li>
          ))}
        </ul>
      )}
    </StatCard>
  );
}

function CumulativeTimeline({ timeline }: { timeline: TimelineResponse[] }) {
  const width = 320;
  const height = 140;
  const paddingX = 24;
  const paddingY = 16;
  const innerWidth = width - paddingX * 2;
  const innerHeight = height - paddingY * 2;
  const maxValue = Math.max(...timeline.map((point) => point.cumulative), 1);
  const stepX = timeline.length > 1 ? innerWidth / (timeline.length - 1) : 0;

  const points = timeline.map((point, index) => ({
    x: paddingX + stepX * index,
    y: paddingY + innerHeight - (point.cumulative / maxValue) * innerHeight,
    point,
  }));
  const polylinePoints = points.map(({ x, y }) => `${x},${y}`).join(' ');

  return (
    <StatCard title="누적 참석 추이" className="xl:col-span-2">
      {timeline.length === 0 ? (
        <p className="text-sm text-ink-muted">데이터가 없습니다.</p>
      ) : (
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full" role="img" aria-label="시간대별 누적 참석 인원 추이">
          <line
            x1={paddingX}
            y1={paddingY + innerHeight}
            x2={width - paddingX}
            y2={paddingY + innerHeight}
            stroke="var(--line-soft)"
            strokeWidth="1"
          />
          <polyline points={polylinePoints} fill="none" stroke="var(--champagne)" strokeWidth="2" />
          {points.map(({ x, y, point }, index) => (
            <g key={`${point.t}-${index}`}>
              <circle cx={x} cy={y} r="3" fill="var(--champagne)" />
              <text x={x} y={height - 2} textAnchor="middle" fontSize="9" fill="var(--muted)">
                {point.t}
              </text>
            </g>
          ))}
        </svg>
      )}
    </StatCard>
  );
}

interface RealtimeChartsProps {
  stats: StatsResponse;
}

export function RealtimeCharts({ stats }: RealtimeChartsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      <RegistrationDonut registration={stats.registration} />
      <AttendanceBars attendance={stats.attendance} />
      <ParkingZoneBars parking={stats.parking} />
      <ArrivalsList arrivals={stats.arrivals} />
      <CumulativeTimeline timeline={stats.timeline} />
    </div>
  );
}
