interface PlateSearchProps {
  value: string;
  onChange: (value: string) => void;
}

/** 차량 뒷자리 검색 — 서버 plateTail 쿼리와 동일 의미(끝자리 일치)를 이미 로드된 목록에서 클라 필터링한다. */
export function PlateSearch({ value, onChange }: PlateSearchProps) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="차량 뒷자리 4자리"
      inputMode="numeric"
      className="min-h-touch rounded-card border border-black/10 bg-surface px-4 text-desk text-ink"
    />
  );
}
