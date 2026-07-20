interface KioskMenuProps {
  onNameSearch: () => void;
  onPlateSearch: () => void;
}

/**
 * 메인메뉴 — 참가자 등록(이름검색) / 주차 확인(차량 뒷자리) 2버튼 전이. 두 선택지는 동등한
 * 행동이라 위계를 두지 않는다(둘 다 outline만, 채움·그림자·발광 없음) — 공유 Button
 * primitive는 gold/ghost 어느 variant도 이 동등-outline 문법과 정확히 일치하지 않아 화면
 * 로컬 스타일로 구현한다.
 */
export function KioskMenu({ onNameSearch, onPlateSearch }: KioskMenuProps) {
  return (
    <div className="flex w-full flex-1 items-stretch gap-4">
      <button
        type="button"
        onClick={onNameSearch}
        className="min-h-touch flex-1 rounded-card border border-line px-6 py-8 text-center text-desk-lg font-bold tracking-[0.06em] text-primary"
      >
        참가자
        <br />
        등록
      </button>
      <button
        type="button"
        onClick={onPlateSearch}
        className="min-h-touch flex-1 rounded-card border border-line px-6 py-8 text-center text-desk-lg font-bold tracking-[0.06em] text-primary"
      >
        주차
        <br />
        확인
      </button>
    </div>
  );
}
