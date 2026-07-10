import type { UseFormRegisterReturn } from 'react-hook-form';

interface ManualLocationInputProps {
  zoneIdRegister: UseFormRegisterReturn;
  slotSigRegister: UseFormRegisterReturn;
}

/**
 * 구획·자리 위치 수동 입력 — parking-zones API가 EVENT_STAFF에 닫혀 있어 정식 구획 선택기를
 * 만들 수 없는 대신 쓰는 보조 입력이다. zoneId·자리 시그는 관리 콘솔에서 확인한 값을 그대로
 * 타이핑한다(1차 제약 — 빈 구획에 새로 등록할 때만 필요, 기존 자리 처리는 보드에서 바로 진입한다).
 */
export function ManualLocationInput({ zoneIdRegister, slotSigRegister }: ManualLocationInputProps) {
  return (
    <div className="flex flex-col gap-3 rounded-card bg-surface p-4 ring-1 ring-black/5">
      <label className="flex flex-col gap-1">
        <span className="text-sm text-ink-muted">구획 ID</span>
        <input
          {...zoneIdRegister}
          placeholder="예: z1"
          className="min-h-touch rounded-card border border-black/10 px-4 text-desk"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm text-ink-muted">자리 시그 (예: 지하 2층·A구역·3)</span>
        <input
          {...slotSigRegister}
          placeholder="지하 2층·A구역·3"
          className="min-h-touch rounded-card border border-black/10 px-4 text-desk"
        />
      </label>
    </div>
  );
}
