/**
 * 행사 액센트 파생 — 저장된 포인트 색 하나를 디자인 시스템의 액센트 변수군으로 전개한다.
 *
 * 디자인 규약은 행사 브랜딩을 "액센트 채널 하나"로 한정하되 주입 대상은 밝은 변주·어두운
 * 변주·그라데이션까지 4개 변수 전부로 규정한다. 콘솔은 색을 하나만 저장하므로 나머지 셋을
 * 여기서 파생한다. 섞는 비율(65/75)은 임의값이 아니라, 디자인 규약이 예시로 못박은 행사
 * 브랜딩 색(버건디)의 손수 지정된 밝은/어두운 변주를 역산해 지각 차이가 임계 이하로
 * 떨어지는 지점을 고른 값이다. 색 연산 자체는 브라우저의 지각 균등 보간에 맡기고 여기서는
 * 같은 색 문자열을 끼워 넣기만 한다 — 변환 상수를 코드로 들이지 않기 위함이다.
 */
const HI_RATIO = 65;
const LO_RATIO = 75;

/** 골드 전제로 설계된 기본 CTA 잉크(거의 검정)와 흰 잉크 — 대비가 높은 쪽을 고른다. */
const INK_DARK = '#14100A';
const INK_LIGHT = '#FFFFFF';

/** 두 잉크 후보의 대비가 같아지는 휘도 — 이보다 밝으면 어두운 잉크가 유리하다. */
const INK_PIVOT_LUMINANCE = 0.192;

/** WCAG 상대 휘도(sRGB 감마 역보정 후 가중합). */
export function relativeLuminance(hex: string): number {
  const channels = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const linear = channels.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

/**
 * 주 CTA는 액센트 그라데이션을 배경으로 깔고 잉크로 글자를 얹는다. 기본 잉크는 시스템
 * 골드(밝은 색)를 전제로 고른 거의 검정이라, 행사가 어두운 브랜드 색을 고르면 글자가
 * 배경에 묻는다. 콘솔은 색 형식만 검증하고 명도를 제약하지 않으므로 여기서 방어한다.
 */
export function ctaInkFor(pointColor: string): string {
  return relativeLuminance(pointColor) > INK_PIVOT_LUMINANCE ? INK_DARK : INK_LIGHT;
}

/** 섞기 함수를 브라우저가 모르면 배경이 투명으로 무너져 CTA·그라데이션 글자가 사라진다 — 주입을 통째로 접고 시스템 기본색을 유지한다. */
export function canDeriveAccent(): boolean {
  return (
    typeof CSS !== 'undefined' &&
    typeof CSS.supports === 'function' &&
    CSS.supports('color', 'color-mix(in oklab, #000 50%, #fff)')
  );
}

export function accentVars(pointColor: string): Record<string, string> {
  const hi = `color-mix(in oklab, ${pointColor} ${HI_RATIO}%, white)`;
  const lo = `color-mix(in oklab, ${pointColor} ${LO_RATIO}%, black)`;
  return {
    '--champagne': pointColor,
    '--champagne-hi': hi,
    '--champagne-lo': lo,
    // 그라데이션 각도·정지점은 시스템 기본 정의와 동일하게 유지하고 색만 갈아끼운다.
    '--gold-grad': `linear-gradient(135deg, ${hi} 0%, ${pointColor} 45%, ${lo} 100%)`,
    '--btn-ink': ctaInkFor(pointColor),
  };
}
