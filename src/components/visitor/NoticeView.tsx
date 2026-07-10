interface NoticeViewProps {
  title: string;
  message?: string;
}

/**
 * 무효 링크·빈 상태 공용 안내(공용 — VIS-00·02·03 공유). 무효 token(허브)과 무효 eventCode
 * (현장등록)는 api가 둘 다 404로 응답해 코드로 구분할 수 없다 — message 텍스트를 파싱해
 * 분기하지 않고 동일한 일반 안내로 렌더한다(enumeration-safe: 어느 리소스가 없는지 노출 안 함).
 */
export function NoticeView({ title, message }: NoticeViewProps) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-card bg-surface p-8 text-center shadow-sm ring-1 ring-black/5">
      <p className="text-desk-lg font-semibold text-ink">{title}</p>
      {message && <p className="text-desk text-ink-muted">{message}</p>}
    </div>
  );
}
