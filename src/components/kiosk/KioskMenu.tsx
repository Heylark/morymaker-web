interface KioskMenuProps {
  onNameSearch: () => void;
  onPlateSearch: () => void;
}

/** 메인메뉴 — 참가자 등록(이름검색) / 주차 확인(차량 뒷자리) 2버튼 전이. */
export function KioskMenu({ onNameSearch, onPlateSearch }: KioskMenuProps) {
  return (
    <div className="flex w-full flex-col gap-6">
      <button
        type="button"
        onClick={onNameSearch}
        className="min-h-touch rounded-card bg-primary px-6 py-8 text-desk-lg font-semibold text-primary-ink"
      >
        참가자 등록
      </button>
      <button
        type="button"
        onClick={onPlateSearch}
        className="min-h-touch rounded-card bg-surface px-6 py-8 text-desk-lg font-semibold text-ink shadow-sm ring-1 ring-black/5"
      >
        주차 확인
      </button>
    </div>
  );
}
