interface BadgeProps {
  children: React.ReactNode;
  className?: string;
}

/** 세리프 신원 배지(VIP 등급 표기 전용) — ui-kit badges-chips.html의 badge-vip. */
export function Badge({ children, className }: BadgeProps) {
  return <span className={['badge-vip', className ?? ''].filter(Boolean).join(' ')}>{children}</span>;
}
