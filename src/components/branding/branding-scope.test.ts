import { describe, expect, it } from 'vitest';
import { accentVars, ctaInkFor, relativeLuminance } from './branding-scope';

describe('relativeLuminance — WCAG 상대 휘도', () => {
  it('디자인 규약 정본 버건디(#B04A5A)는 어두운 색 쪽으로 계산된다', () => {
    expect(relativeLuminance('#B04A5A')).toBeCloseTo(0.147, 2);
  });
});

describe('ctaInkFor — 행사 색 대비 기준 CTA 잉크 자동 선택', () => {
  it('어두운 브랜드 색(버건디)은 흰 잉크를 고른다', () => {
    expect(ctaInkFor('#B04A5A')).toBe('#FFFFFF');
  });

  it('밝은 브랜드 색(시스템 골드)은 어두운 잉크를 고른다', () => {
    expect(ctaInkFor('#D4B36A')).toBe('#14100A');
  });
});

describe('accentVars — 포인트 색 1개에서 액센트 4변수 + CTA 잉크 파생', () => {
  it('정확히 5개 키를 반환한다', () => {
    const vars = accentVars('#B04A5A');
    expect(Object.keys(vars).sort()).toEqual(
      ['--btn-ink', '--champagne', '--champagne-hi', '--champagne-lo', '--gold-grad'].sort()
    );
  });

  it('--champagne은 입력 색 그대로다', () => {
    expect(accentVars('#B04A5A')['--champagne']).toBe('#B04A5A');
  });

  it('--gold-grad는 시스템 기본과 동일한 각도·정지점을 유지하고 색만 갈아끼운다', () => {
    const grad = accentVars('#B04A5A')['--gold-grad'];
    expect(grad).toContain('135deg');
    expect(grad).toContain('0%');
    expect(grad).toContain('45%');
    expect(grad).toContain('100%');
    expect(grad).toContain('#B04A5A 45%');
  });

  // 혼합비는 임의 상수가 아니라 디자인 규약이 정본 예시로 못박은 행사 색(버건디)의 손수 지정된
  // 밝은/어두운 변주를 역산해 얻은 값이다. 값을 바꾸면 파생 결과가 규약 예시에서 지각 가능한
  // 수준으로 벌어지므로 여기서 고정한다 — 비율만 조용히 틀어져도 나머지 단언(각도·정지점·기본색
  // 대조)은 전부 통과해 버려 이 단언이 없으면 회귀를 아무도 잡지 못한다.
  it('밝은 변주는 65%, 어두운 변주는 75% 혼합으로 파생된다(규약 정본 역산값 고정)', () => {
    const vars = accentVars('#B04A5A');
    expect(vars['--champagne-hi']).toBe('color-mix(in oklab, #B04A5A 65%, white)');
    expect(vars['--champagne-lo']).toBe('color-mix(in oklab, #B04A5A 75%, black)');
    expect(vars['--gold-grad']).toBe(
      'linear-gradient(135deg, color-mix(in oklab, #B04A5A 65%, white) 0%, #B04A5A 45%, color-mix(in oklab, #B04A5A 75%, black) 100%)'
    );
  });

  it('--btn-ink는 ctaInkFor와 동일한 값을 담는다(버건디 → 흰 잉크)', () => {
    expect(accentVars('#B04A5A')['--btn-ink']).toBe('#FFFFFF');
  });
});
