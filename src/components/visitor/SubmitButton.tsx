interface SubmitButtonProps {
  pending: boolean;
  children: React.ReactNode;
}

/** 폼 제출 버튼(공용 — 사전등록·현장등록 두 폼 공유). 터치 타깃·비활성 스타일을 단일화한다. */
export function SubmitButton({ pending, children }: SubmitButtonProps) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="min-h-touch rounded-card bg-primary px-6 text-desk font-semibold text-primary-ink disabled:opacity-50"
    >
      {children}
    </button>
  );
}
