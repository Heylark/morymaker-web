import type { KioskAttendee, KioskCheckinResult, KioskParkingRecord } from '@/types/kiosk';

export type KioskScreen =
  | 'idle'
  | 'menu'
  | 'search-name'
  | 'confirm-identity'
  | 'seat-guide'
  | 'search-plate'
  | 'park-location';

export interface KioskState {
  screen: KioskScreen;
  selectedAttendee: KioskAttendee | null; // 이름검색 선택 → 본인확인 재사용
  checkinResult: KioskCheckinResult | null; // 체크인 POST 응답(재조회 없음)
  selectedParking: KioskParkingRecord | null; // 주차검색 선택 → 주차위치안내 재사용
}

export const initialKioskState: KioskState = {
  screen: 'idle',
  selectedAttendee: null,
  checkinResult: null,
  selectedParking: null,
};

export type KioskAction =
  | { type: 'TOUCH_START' } // idle → menu
  | { type: 'GOTO_NAME_SEARCH' } // menu → search-name
  | { type: 'GOTO_PLATE_SEARCH' } // menu → search-plate
  | { type: 'SELECT_ATTENDEE'; attendee: KioskAttendee } // search-name → confirm-identity
  | { type: 'CHECKIN_DONE'; result: KioskCheckinResult } // confirm-identity → seat-guide (POST 성공 후)
  | { type: 'REJECT_IDENTITY' } // confirm-identity → search-name
  | { type: 'SELECT_PARKING'; record: KioskParkingRecord } // search-plate → park-location
  | { type: 'BACK_TO_MENU' } // 임의 → menu (뒤로 버튼)
  | { type: 'RESET' }; // 임의 → idle + 전 payload 폐기(타임아웃·개인정보)

/**
 * 키오스크 상태머신 — 순수 함수(types만 import, DOM·네트워크 의존 없음). 설계 전이표(§2-3)를
 * 그대로 구현한다. 정의되지 않은 (현재 screen, action) 조합은 방어적으로 현재 상태를 유지한다
 * (예: idle에서 GOTO_NAME_SEARCH를 받아도 무시 — 화면이 잘못된 시점에 액션을 보내는 경우를 대비).
 */
export function kioskReducer(state: KioskState, action: KioskAction): KioskState {
  switch (action.type) {
    case 'TOUCH_START':
      return state.screen === 'idle' ? { ...state, screen: 'menu' } : state;

    case 'GOTO_NAME_SEARCH':
      return state.screen === 'menu' ? { ...state, screen: 'search-name' } : state;

    case 'GOTO_PLATE_SEARCH':
      return state.screen === 'menu' ? { ...state, screen: 'search-plate' } : state;

    case 'SELECT_ATTENDEE':
      return state.screen === 'search-name'
        ? { ...state, screen: 'confirm-identity', selectedAttendee: action.attendee }
        : state;

    case 'CHECKIN_DONE':
      // 체크인 side-effect는 이 화면(confirm-identity)의 [맞아요]에서만 발생 — 선택·검색 시점엔
      // 절대 호출되지 않는다(호출부 계약, 서버 200 멱등이 재확정도 안전하게 만든다).
      return state.screen === 'confirm-identity'
        ? { ...state, screen: 'seat-guide', checkinResult: action.result }
        : state;

    case 'REJECT_IDENTITY':
      return state.screen === 'confirm-identity'
        ? { ...state, screen: 'search-name', selectedAttendee: null }
        : state;

    case 'SELECT_PARKING':
      return state.screen === 'search-plate'
        ? { ...state, screen: 'park-location', selectedParking: action.record }
        : state;

    case 'BACK_TO_MENU':
      return {
        ...state,
        screen: 'menu',
        selectedAttendee: null,
        checkinResult: null,
        selectedParking: null,
      };

    case 'RESET':
      // 무동작 타임아웃 개인정보 초기화의 핵심 — 이름·차량뒷자리·검색결과·재사용 payload 전부 폐기.
      return initialKioskState;

    default:
      return state;
  }
}
