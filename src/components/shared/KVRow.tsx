interface InvRowProps {
  label: React.ReactNode;
  children: React.ReactNode;
}

/** 초대장 카드 내부 key-value(라벨 좌측 고정폭) — ui-kit key-value-rows.html의 inv-row. */
export function InvRow({ label, children }: InvRowProps) {
  return (
    <div className="inv-row">
      <span className="k">{label}</span>
      <span className="v">{children}</span>
    </div>
  );
}

interface HubRowProps {
  label: React.ReactNode;
  children: React.ReactNode;
}

/** 리스트형 key-value(구분선 포함) — ui-kit key-value-rows.html의 hub-row. */
export function HubRow({ label, children }: HubRowProps) {
  return (
    <div className="hub-row">
      <span className="k">{label}</span>
      <span className="v">{children}</span>
    </div>
  );
}

interface NumProps {
  children: React.ReactNode;
}

/** 값 안의 숫자만 세리프 골드로 각인 — hub-row .v .num과 동일 문법(발광 아님, qr-glow와 예산 분리). */
export function Num({ children }: NumProps) {
  return <span className="num">{children}</span>;
}
