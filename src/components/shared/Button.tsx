interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** gold = 주 CTA(화면당 원칙적으로 1개) / ghost = 발광 없는 보조 행동 */
  variant: 'gold' | 'ghost';
  /** gold 전용 — T3 엘리베이션(화면당 발광 예산 1) opt-in. 기본 false(발광 없는 flat 골드) */
  glow?: boolean;
}

/** 공유 버튼 primitive — ui-kit buttons.html의 btn-gold/btn-ghost를 그대로 소비한다. */
export function Button({ variant, glow = false, className, ...rest }: ButtonProps) {
  const classes = [
    variant === 'gold' ? 'btn-gold' : 'btn-ghost',
    variant === 'gold' && glow ? 'is-glow' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');
  return <button className={classes} {...rest} />;
}
