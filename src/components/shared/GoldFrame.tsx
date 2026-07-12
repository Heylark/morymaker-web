interface GoldFrameProps {
  children: React.ReactNode;
  /** 광택 스윕 모션(발광 아님) — 초대장 씬 한정. 기본 false */
  sheen?: boolean;
  className?: string;
}

/**
 * 이중 금선 프레임 — 초대장류 컨테이너 전용(ui-kit gold-frame.html의 inv-frame/sheen).
 * 원본 클래스의 고정폭(260px)까지 그대로 이식했다 — 다른 폭이 필요한 소비처는 `className`으로
 * Tailwind 유틸리티(예: `w-full`)를 얹으면 유틸리티 레이어가 이 컴포넌트 레이어보다 우선한다.
 */
export function GoldFrame({ children, sheen = false, className }: GoldFrameProps) {
  const classes = ['inv-frame', sheen ? 'sheen' : '', className ?? ''].filter(Boolean).join(' ');
  return <div className={classes}>{children}</div>;
}

interface OrnamentProps {
  children: React.ReactNode;
}

/** 프레임 상단 장식 슬롯 — ui-kit gold-frame.html의 ornament. */
export function Ornament({ children }: OrnamentProps) {
  return <div className="ornament">{children}</div>;
}

/** 금선 디바이더(중앙 마름모 장식) — ui-kit gold-frame.html의 inv-div. */
export function GoldDivider() {
  return (
    <div className="inv-div">
      <span>◆</span>
    </div>
  );
}
