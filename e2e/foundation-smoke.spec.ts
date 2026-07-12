import { test, expect } from '@playwright/test';

/**
 * 디자인 파운데이션 스모크 — 루트 페이지(백엔드 무관 정적 화면)를 기준으로 세 가지만 확인한다:
 * 1) 다크 테마가 앱 디폴트로 걸려 있는지, 2) 자가호스팅 웹폰트가 실제로 로드됐는지(폴백이 아닌지),
 * 3) 공유 primitives 스타일 층이 로드되어 토큰 기반 컬러로 정확히 계산되는지(hex 리터럴이 아닌
 * CSS 변수 유래 값). hex 리터럴 자체의 부재는 grep으로 별도 검증하며, 여기서는 런타임 렌더 결과가
 * 그 토큰 값과 실제로 일치하는지를 확인한다.
 */
test('다크 시그니처 파운데이션 — 테마·웹폰트·primitives 렌더', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

  // 루트 페이지 자체는 세리프·한글 폰트를 렌더에 쓰지 않아 브라우저가 자동으로 내려받지
  // 않는다(font-display:swap은 실제 사용 시에만 로드) — document.fonts.load로 명시 요청해
  // self-host된 파일이 실제로 fetch·파싱 가능한지 확인한다.
  const fontsLoaded = await page.evaluate(async () => {
    await Promise.all([
      document.fonts.load('16px "Bodoni Moda"'),
      document.fonts.load('16px "Pretendard Variable"'),
    ]);
    return {
      serif: document.fonts.check('16px "Bodoni Moda"'),
      kr: document.fonts.check('16px "Pretendard Variable"'),
    };
  });
  expect(fontsLoaded.serif).toBe(true);
  expect(fontsLoaded.kr).toBe(true);

  // primitives.css가 실제로 로드되어 토큰 기반 컬러로 계산되는지 확인 — DOM에 없던 요소를
  // 기존 컴포넌트 5종(SubmitButton·SearchStatusBadge·ReviewBadge·SlotAutoLabel·QrGlowBox)이
  // 실제로 내보내는 것과 동일한 클래스 조합으로 즉석 생성해 계산 스타일을 읽는다. 이 5종은
  // 실행자·방문자·콘솔 백엔드 데이터가 있어야 실제 화면에서 렌더되므로(본 REQ 범위 밖 — 표면
  // 트랙 REQ가 그 화면 자체를 검증한다), 여기서는 각 컴포넌트가 만들어내는 클래스명이 실제
  // 브라우저에서 올바른 토큰 색으로 풀리는지를 확인한다.
  const rendered = await page.evaluate(() => {
    const cases: Array<{ name: string; tag: 'button' | 'span' | 'div'; className: string; text: string }> = [
      { name: 'btn-gold', tag: 'button', className: 'btn-gold', text: '참석 여부 회신' },
      { name: 'state.done', tag: 'span', className: 'state done', text: '확인 필요' },
      { name: 'num', tag: 'span', className: 'num', text: 'B1-014' },
      { name: 'qr-glow', tag: 'div', className: 'qr-glow', text: '' },
    ];
    const host = document.createElement('div');
    host.style.cssText =
      'position:fixed;top:0;left:0;display:flex;gap:16px;align-items:center;padding:24px;background:var(--void);z-index:9999';
    const elements = cases.map((c) => {
      const el = document.createElement(c.tag);
      el.className = c.className;
      el.textContent = c.text;
      host.appendChild(el);
      return el;
    });
    document.body.appendChild(host);
    const results = cases.map((c, i) => ({ name: c.name, color: getComputedStyle(elements[i]).color }));
    host.remove();
    return results;
  });

  // --btn-ink(다크) = #14100A = rgb(20, 16, 10) — btn-gold 글자색
  expect(rendered.find((r) => r.name === 'btn-gold')?.color).toBe('rgb(20, 16, 10)');
  // --ivory(다크) = #EDE9E0 = rgb(237, 233, 224) — state.done 톤
  expect(rendered.find((r) => r.name === 'state.done')?.color).toBe('rgb(237, 233, 224)');
  // --champagne(다크) = #D4B36A = rgb(212, 179, 106) — num 세리프 각인 색
  expect(rendered.find((r) => r.name === 'num')?.color).toBe('rgb(212, 179, 106)');

  await page.screenshot({ path: 'test-screenshots/foundation-smoke.png' });

  // 5종 전환 컴포넌트가 실제로 내보내는 클래스 조합을 나열해 primitives 렌더를 육안으로도 남긴다
  await page.evaluate(() => {
    const swatches: Array<{ tag: 'button' | 'span'; className: string; text: string }> = [
      { tag: 'button', className: 'btn-gold', text: '참석 여부 회신' },
      { tag: 'span', className: 'state', text: '체크인 대기' },
      { tag: 'span', className: 'state done', text: '확인 필요' },
      { tag: 'span', className: 'badge-vip', text: 'VIP' },
      { tag: 'span', className: 'num', text: 'B1-014' },
    ];
    const host = document.createElement('div');
    host.style.cssText =
      'min-height:100vh;display:flex;flex-wrap:wrap;gap:20px;align-items:center;padding:32px;background:var(--void)';
    for (const s of swatches) {
      const el = document.createElement(s.tag);
      el.className = s.className;
      el.textContent = s.text;
      if (s.tag === 'button') el.style.width = 'auto';
      host.appendChild(el);
    }
    document.body.replaceChildren(host);
  });
  await page.screenshot({ path: 'test-screenshots/foundation-primitives-matrix.png' });
});
