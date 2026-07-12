interface ChipProps {
  children: React.ReactNode;
  /** 강조 변형(champagne 톤) — 기본 false */
  hot?: boolean;
  className?: string;
}

/** 메타 정보 캡슐 — ui-kit badges-chips.html의 chip/chip.hot. */
export function Chip({ children, hot = false, className }: ChipProps) {
  const classes = ['chip', hot ? 'hot' : '', className ?? ''].filter(Boolean).join(' ');
  return <span className={classes}>{children}</span>;
}
