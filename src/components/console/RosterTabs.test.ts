import { describe, expect, it } from 'vitest';
import { TABS } from './RosterTabs';

/**
 * RosterTabs는 EventConsoleShell과 달리 aria-current·E2E 활성 단언이 전부 없는 무방비
 * 지점이다(ADR-005) — 이 단위 테스트가 이중 접두(/app/app) 회귀를 잡는 유일한 자동 게이트다.
 * vitest.config.ts의 전역 NEXT_PUBLIC_BASE_PATH='/app' 아래에서 실행되므로, path 빌더에
 * basePath가 섞이면(usePathname()과 좌표계 불일치) 즉시 RED가 된다.
 */
describe('RosterTabs — TABS 좌표계 (basePath 이중 적용 회귀 가드)', () => {
  it('tab href는 basePath를 포함하지 않는다 — usePathname()이 strip한 값과 같은 좌표계여야 활성 판정이 성립한다', () => {
    expect(TABS.map((tab) => tab.path('e1'))).toEqual(['/events/e1/roster', '/events/e1/roster/template']);
  });
});
