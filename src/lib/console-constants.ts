import type { GuestSrc, GuestStatus } from '@/types/guest';
import type { SmsLogStatus } from '@/types/sms';

/**
 * 명단·초대 도메인 상수 — Guest.kt·SmsLog.kt companion 값의 단일 출처(문자열 자체가 이미
 * 한국어 라벨이라 별도 표시용 매핑은 두지 않는다). 필터 옵션 배열과 상태 배지 톤 매핑만
 * 순수 함수로 분리해 렌더 없이 단위 테스트 가능하게 한다(vitest가 jsdom 없이 node 환경만 제공).
 */

export const GUEST_STATUS_OPTIONS: GuestStatus[] = ['대기', '방문', '참석', '취소'];
export const GUEST_SRC_OPTIONS: GuestSrc[] = ['사전', '현장'];
export const SMS_LOG_STATUS_OPTIONS: SmsLogStatus[] = ['성공', '실패', '반송'];

export type PillTone = 'pending' | 'done' | 'void';

/** 게스트 상태 → StatePill 톤. 대기=pending(기본), 방문/참석=done, 취소=void(저강조). */
export function guestStatusTone(status: GuestStatus): PillTone {
  if (status === '방문' || status === '참석') return 'done';
  if (status === '취소') return 'void';
  return 'pending';
}

/** 발송 로그 상태 → StatePill 톤. 성공=done, 실패/반송=void(주의 필요 저강조 — 색+텍스트 이중표기). */
export function smsLogStatusTone(status: SmsLogStatus): PillTone {
  return status === '성공' ? 'done' : 'void';
}

/**
 * seatLabel 표시값 — 엑셀 임포트로는 seatGroupId가 채워지지 않아 null이 흔하다.
 * 빈 문자열이 아닌 안내 문구로 명시해 "좌석 배정 안 됨"과 "값이 비어 보임"을 구분한다.
 */
export function seatLabelDisplay(seatLabel: string | null): string {
  return seatLabel ?? '미배정 (별도 배정)';
}
