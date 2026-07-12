interface EyebrowProps {
  children: React.ReactNode;
  /** invitation = 초대장 카드 내부 전용 더 넓은 자간(.42em). 기본 default(.34em, 최상위 섹션 레이블) */
  variant?: 'default' | 'invitation';
  className?: string;
}

/** 자간 대문자 섹션 레이블 — ui-kit labels.html의 eyebrow/inv-eyebrow. */
export function Eyebrow({ children, variant = 'default', className }: EyebrowProps) {
  const base = variant === 'invitation' ? 'inv-eyebrow' : 'eyebrow';
  return <div className={[base, className ?? ''].filter(Boolean).join(' ')}>{children}</div>;
}

interface KeyLabelProps {
  children: React.ReactNode;
  className?: string;
}

/** row 키 레이블(가장 작은 faint 톤) — key-value-rows.html의 .k 셀과 동일 문법. */
export function KeyLabel({ children, className }: KeyLabelProps) {
  return <span className={['key-label', className ?? ''].filter(Boolean).join(' ')}>{children}</span>;
}

interface GoldTextProps {
  children: React.ReactNode;
  as?: 'span' | 'div';
  className?: string;
}

/** 그라데이션 클립 골드 텍스트 유틸리티 — ui-kit labels.html의 gold. */
export function GoldText({ children, as = 'span', className }: GoldTextProps) {
  const Tag = as;
  return <Tag className={['gold', className ?? ''].filter(Boolean).join(' ')}>{children}</Tag>;
}
