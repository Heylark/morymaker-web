/**
 * 관리자 콘솔 행사 현황·통계(ADM-03) 응답 타입 — 실측 api DTO 1:1 미러(스펙 §8 예시 아님).
 * 성공 래퍼는 `{data}` 단일 키, meta 없음(단건 집계 응답이라 페이지네이션 불필요).
 */

// GET /api/events/{eid}/stats → {data: StatsResponse}
export interface StatsResponse {
  registration: RegistrationResponse;
  attendance: AttendanceResponse;
  parking: ParkingResponse;
  arrivals: ArrivalResponse[];
  timeline: TimelineResponse[];
}

// pre/on/total = 등록 인원 수. preRatio/onRatio = 구성비(그룹 ÷ total), 0~1 Double — 표시 시 ×100만 허용.
export interface RegistrationResponse {
  pre: number;
  on: number;
  total: number;
  preRatio: number;
  onRatio: number;
}

// preAtt/onAtt/totAtt = 실참석 인원 수. preRate/onRate/totRate = 참석률(실참석 ÷ 그룹 등록), 0~1 Double.
// Ratio(구성비)와 Rate(참석률)는 분모가 달라 필드명을 반드시 구분한다(혼용 시 실제 수치 오류로 이어짐).
export interface AttendanceResponse {
  preAtt: number;
  onAtt: number;
  totAtt: number;
  preRate: number;
  onRate: number;
  totRate: number;
}

export interface ParkingResponse {
  parked: number;
  byZone: ZoneOccupancyResponse[];
}

export interface ZoneOccupancyResponse {
  zoneId: string;
  zoneName: string;
  slotCount: number;
  occupied: number;
  reviewNeeded: number;
}

// guestId는 String(UUID) — api 정수 예시 스펙 문서는 문서만 오도(동작 무영향), 실 DTO가 SSOT.
export interface ArrivalResponse {
  guestId: string;
  name: string;
  visitAt: string; // 'HH:mm' 서버 포맷 완료 — 프론트 재포맷 금지
}

export interface TimelineResponse {
  t: string; // 카테고리 축 라벨(문자열) — 시간 파싱 대상 아님
  cumulative: number; // 서버 누적 완료값 — 프론트 재누적 금지
}
