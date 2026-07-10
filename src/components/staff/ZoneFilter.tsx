export interface ZoneOption {
  zoneId: string;
  label: string;
  count: number;
}

interface ZoneFilterProps {
  zones: ZoneOption[];
  selected: string | null;
  onSelect: (zoneId: string | null) => void;
}

/**
 * 구획 선택기 — parking-zones API(관리자 전용이라 실행자 세션은 호출할 수 없음)를 대신해
 * parking-records 응답에서 zoneId를 파생한다. 차량이 한 번도 등록되지 않은 빈 구획은 이 목록에
 * 나타나지 않는다(운영 초기 구획 세팅 직후~첫 등록 전까지의 알려진 제약).
 */
export function ZoneFilter({ zones, selected, onSelect }: ZoneFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => onSelect(null)}
        className={`min-h-touch rounded-card px-4 text-sm font-medium ${
          selected === null ? 'bg-primary text-primary-ink' : 'bg-surface text-ink ring-1 ring-black/10'
        }`}
      >
        전체
      </button>
      {zones.map((zone) => (
        <button
          key={zone.zoneId}
          type="button"
          onClick={() => onSelect(zone.zoneId)}
          className={`min-h-touch rounded-card px-4 text-sm font-medium ${
            selected === zone.zoneId ? 'bg-primary text-primary-ink' : 'bg-surface text-ink ring-1 ring-black/10'
          }`}
        >
          {zone.label} ({zone.count})
        </button>
      ))}
    </div>
  );
}
