import { describe, expect, it } from 'vitest';
import { GET } from './route';

/**
 * 이 라우트가 지워지거나 다른 좌표로 옮겨져도 빌드·기존 스위트는 조용히 통과한다 —
 * 컨테이너 헬스체크 probe가 참조하는 유일한 계약(상태 200 + 고정 본문)을 이 테스트가 고정한다.
 */
describe('GET /api/health', () => {
  it('상태 200과 고정 본문을 반환한다', async () => {
    const response = await GET();

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ status: 'ok' });
  });
});
