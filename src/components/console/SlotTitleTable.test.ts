import { describe, expect, it } from 'vitest';
import { buildFullOverrides } from './SlotTitleTable';

/**
 * 렌더 없이 override 맵 구축 로직만 단위 테스트한다(vitest.config.ts가 jsdom 없이 node 환경만
 * 제공 — 컴포넌트 렌더 테스트는 별도 인프라 필요, tech-debt 등록). R8 핵심 위험(부분 편집 시
 * 기존 override 유실)을 이 순수 함수 레벨에서 검증한다.
 */
describe('SlotTitleTable — buildFullOverrides (R8: 부분 편집도 전체 맵으로 전송)', () => {
  it('일부 자리만 편집해도 기존 override + 이번 편집을 모두 포함한 전체 맵을 반환한다', () => {
    const zone = { startNo: 1, slotCount: 5 };
    // 3번 자리만 새로 편집, 1번은 기존 override 유지 상태로 시드되어 있다고 가정
    const titles = { '1': '입구', '3': '출구 옆' };

    const result = buildFullOverrides(zone, titles);

    expect(result).toEqual({ '1': '입구', '3': '출구 옆' });
  });

  it('값이 번호와 같으면(수정 없음) 맵에서 제외한다', () => {
    const zone = { startNo: 1, slotCount: 3 };
    const titles = { '1': '1', '2': '입구', '3': '3' };

    const result = buildFullOverrides(zone, titles);

    expect(result).toEqual({ '2': '입구' });
  });

  it('공백만 있는 값은 trim 후 제외한다', () => {
    const zone = { startNo: 1, slotCount: 2 };
    const titles = { '1': '   ', '2': '주차요원 데스크' };

    const result = buildFullOverrides(zone, titles);

    expect(result).toEqual({ '2': '주차요원 데스크' });
  });

  it('titles에 없는 자리는 번호 기본값으로 취급해 맵에서 제외한다', () => {
    const zone = { startNo: 10, slotCount: 3 }; // 10, 11, 12
    const titles = { '11': '장애인 전용' };

    const result = buildFullOverrides(zone, titles);

    expect(result).toEqual({ '11': '장애인 전용' });
  });

  it('빈맵 저장 시(전부 번호로 리셋) 빈 객체를 반환한다', () => {
    const zone = { startNo: 1, slotCount: 2 };
    const titles = {};

    const result = buildFullOverrides(zone, titles);

    expect(result).toEqual({});
  });
});
