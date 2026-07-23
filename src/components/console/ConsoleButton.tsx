interface ConsoleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** primary=주 행동(화면/모달당 1) / secondary=버튼 affordance 보조 주요 행동 / ghost=경미 */
  variant: 'primary' | 'secondary' | 'ghost';
}

/**
 * 콘솔 전용 버튼 위계 primitive — §6 라이트 톤(솔리드 primary·골드 테두리 secondary·텍스트
 * ghost) 재조합, 신규 CSS 변수 0. 방문자 `shared/Button`(btn-gold/btn-ghost, 다크 시그니처
 * 그라데이션+glow)과 별개 컴포넌트다 — 콘솔 idiom(라이트·솔리드·발광 0)과 방문자 idiom(다크
 * 그라데이션·T3 발광)이 다르므로 primitive를 분리해 서로 오염시키지 않는다.
 *
 * base className은 폭 유틸(`w-fit` 등)을 의도적으로 미포함한다 — 재사용 컴포넌트가 소비처의
 * 컨테이너 폭 정책(flex-row vs flex-col)을 강제하지 않기 위함. flex-column 컨테이너의 직접
 * 자식으로 쓰이는 소비처는 `className="w-fit"`을 전달해 교차축 stretch로 전폭 늘어나는 것을
 * 방지해야 한다(flex-row 컨테이너는 기본이 content-width라 불요).
 */
export function ConsoleButton({ variant, className, ...rest }: ConsoleButtonProps) {
  const base = {
    primary:
      'min-h-touch rounded-card bg-primary px-6 text-desk font-semibold text-primary-ink disabled:opacity-50',
    secondary:
      'min-h-touch rounded-card border border-line bg-transparent px-5 text-desk font-semibold text-primary disabled:opacity-50 hover:bg-surface-sunken',
    ghost: 'min-h-touch rounded-card px-4 text-sm text-ink-muted hover:text-ink disabled:opacity-50',
  }[variant];
  return <button className={[base, className ?? ''].filter(Boolean).join(' ')} {...rest} />;
}
