import { describe, expect, it } from 'vitest';
import { initialKioskState, kioskReducer } from './machine';
import type { KioskState } from './machine';
import type { KioskCheckinResult, PublicAttendee, PublicParkingRecord } from '@/types/kiosk';

const attendee: PublicAttendee = {
  guestId: 'g1',
  name: '김민준',
  org: '모리메이커',
  seatLabel: 'A-1',
  status: '참석',
};

const checkinResult: KioskCheckinResult = {
  resultCode: 'CHECKED_IN',
  guest: { name: '김민준', org: '모리메이커', status: '참석', seatLabel: 'A-1' },
  parking: { display: '지하 2층 A구역 3' },
};

const parkingRecord: PublicParkingRecord = { plate: '12가3456', slotDisplay: '지하 2층 A구역 3번' };

describe('kioskReducer — 상태 전이 전수(설계 §2-3 전이표 커버)', () => {
  it('idle에서 TOUCH_START → menu', () => {
    const next = kioskReducer(initialKioskState, { type: 'TOUCH_START' });
    expect(next.screen).toBe('menu');
  });

  it('menu에서 GOTO_NAME_SEARCH → search-name', () => {
    const state: KioskState = { ...initialKioskState, screen: 'menu' };
    const next = kioskReducer(state, { type: 'GOTO_NAME_SEARCH' });
    expect(next.screen).toBe('search-name');
  });

  it('menu에서 GOTO_PLATE_SEARCH → search-plate', () => {
    const state: KioskState = { ...initialKioskState, screen: 'menu' };
    const next = kioskReducer(state, { type: 'GOTO_PLATE_SEARCH' });
    expect(next.screen).toBe('search-plate');
  });

  it('search-name에서 SELECT_ATTENDEE → confirm-identity, 선택 결과를 보관한다', () => {
    const state: KioskState = { ...initialKioskState, screen: 'search-name' };
    const next = kioskReducer(state, { type: 'SELECT_ATTENDEE', attendee });
    expect(next.screen).toBe('confirm-identity');
    expect(next.selectedAttendee).toEqual(attendee);
  });

  it('confirm-identity에서 CHECKIN_DONE → seat-guide, 체크인 결과를 보관한다(체크인 side-effect는 이 전이에서만)', () => {
    const state: KioskState = { ...initialKioskState, screen: 'confirm-identity', selectedAttendee: attendee };
    const next = kioskReducer(state, { type: 'CHECKIN_DONE', result: checkinResult });
    expect(next.screen).toBe('seat-guide');
    expect(next.checkinResult).toEqual(checkinResult);
  });

  it('confirm-identity에서 REJECT_IDENTITY → search-name 복귀, 선택은 폐기한다', () => {
    const state: KioskState = { ...initialKioskState, screen: 'confirm-identity', selectedAttendee: attendee };
    const next = kioskReducer(state, { type: 'REJECT_IDENTITY' });
    expect(next.screen).toBe('search-name');
    expect(next.selectedAttendee).toBeNull();
  });

  it('search-plate에서 SELECT_PARKING → park-location, 선택 결과를 보관한다', () => {
    const state: KioskState = { ...initialKioskState, screen: 'search-plate' };
    const next = kioskReducer(state, { type: 'SELECT_PARKING', record: parkingRecord });
    expect(next.screen).toBe('park-location');
    expect(next.selectedParking).toEqual(parkingRecord);
  });

  it('임의 화면에서 BACK_TO_MENU → menu, 전 payload를 폐기한다', () => {
    const state: KioskState = {
      screen: 'seat-guide',
      selectedAttendee: attendee,
      checkinResult,
      selectedParking: parkingRecord,
    };
    const next = kioskReducer(state, { type: 'BACK_TO_MENU' });
    expect(next).toEqual({ screen: 'menu', selectedAttendee: null, checkinResult: null, selectedParking: null });
  });

  it('임의 화면에서 RESET → idle, initialKioskState로 완전 초기화한다(무동작 타임아웃 개인정보 초기화 핵심)', () => {
    const state: KioskState = {
      screen: 'park-location',
      selectedAttendee: attendee,
      checkinResult,
      selectedParking: parkingRecord,
    };
    const next = kioskReducer(state, { type: 'RESET' });
    expect(next).toEqual(initialKioskState);
  });

  it('매칭 없는 전이는 방어적으로 현재 상태를 유지한다(idle에서 GOTO_NAME_SEARCH 무시)', () => {
    const next = kioskReducer(initialKioskState, { type: 'GOTO_NAME_SEARCH' });
    expect(next).toEqual(initialKioskState);
  });

  it('매칭 없는 전이는 방어적으로 현재 상태를 유지한다(menu에서 SELECT_ATTENDEE 무시)', () => {
    const state: KioskState = { ...initialKioskState, screen: 'menu' };
    const next = kioskReducer(state, { type: 'SELECT_ATTENDEE', attendee });
    expect(next).toEqual(state);
  });

  it('매칭 없는 전이는 방어적으로 현재 상태를 유지한다(search-name에서 SELECT_PARKING 무시)', () => {
    const state: KioskState = { ...initialKioskState, screen: 'search-name' };
    const next = kioskReducer(state, { type: 'SELECT_PARKING', record: parkingRecord });
    expect(next).toEqual(state);
  });
});
