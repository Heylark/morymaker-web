interface QrGlowBoxProps {
  /** QR 그래픽(QrPreview 등) — 이 컴포넌트는 골드 hairline·발광 합성 레이어만 담당하고 QR 자체는 그리지 않는다 */
  children: React.ReactNode;
  /** T1 호흡 발광(화면당 예산 1) opt-in. 기본 false(정적 골드 hairline만, breathe 없음) */
  glow?: boolean;
  /** 하단 안내 문구 */
  hint?: React.ReactNode;
  className?: string;
}

/** QR 발광 합성 박스 — ui-kit qr-glow-box.html의 qr-box/qr-glow. */
export function QrGlowBox({ children, glow = false, hint, className }: QrGlowBoxProps) {
  const classes = ['qr-glow', glow ? 'is-glow' : '', className ?? ''].filter(Boolean).join(' ');
  return (
    <div className="qr-box">
      <div className={classes}>{children}</div>
      {hint ? <div className="qr-hint">{hint}</div> : null}
    </div>
  );
}
