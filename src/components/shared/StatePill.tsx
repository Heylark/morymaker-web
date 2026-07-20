interface StatePillProps {
  children: React.ReactNode;
  /** 새 색조 도입 금지 — 기존 팔레트(champagne/ivory/faint) 톤 차이로만 상태 구분. 기본 pending */
  tone?: 'pending' | 'done' | 'void';
  className?: string;
}

/** 상태 캡슐 칩 — ui-kit state-pills.html의 state/state.done/state.void. */
export function StatePill({ children, tone = 'pending', className }: StatePillProps) {
  const toneClass = tone === 'pending' ? '' : tone;
  return <span className={['state', toneClass, className ?? ''].filter(Boolean).join(' ')}>{children}</span>;
}
