interface AltLocationGuideProps {
  variant?: 'onsite' | 'park';
}

/**
 * 대체 위치 안내(정적) — variant별 문구만 다르다. default('onsite')는 현장등록 완료 화면의
 * 기존 문구를 그대로 보존한다(무prop으로 호출하는 기존 소비처 회귀 없음). 'park'는 셀프 주차
 * 완료 화면(VIS-03) 전용 문구.
 */
export function AltLocationGuide({ variant = 'onsite' }: AltLocationGuideProps) {
  const message =
    variant === 'park'
      ? '다른 자리를 찾고 있다면 키오스크에서 위치를 다시 조회해 주세요.'
      : '행사장 위치는 초대 문자에 첨부된 지도를 참고해 주세요.';

  return (
    <div className="mt-auto rounded-[var(--radius-frame)] border border-line-soft bg-surface-sunken p-4 text-center">
      <p className="text-sm text-ink-muted">{message}</p>
    </div>
  );
}
