/**
 * 관리자 콘솔 주차 구획(ADM-07) 응답/요청 타입 — 실측 api DTO 미러(spec 예시 아님).
 * 성공 래퍼는 실행자(staff) 목록과 달리 `{data: T}` 단일 키(meta 없음). part1~4는 응답에서
 * nullable(String?)이나 요청에서 part1은 필수(@NotBlank) — 비대칭 그대로 반영.
 */

// GET /api/events/{eid}/parking-zones → {data: ZoneResponse[]}
export interface ZoneResponse {
  id: string;
  part1: string | null;
  part2: string | null;
  part3: string | null;
  part4: string | null;
  zoneName: string; // 서버 파생(part1~4 빈값제외 공백결합) — 프론트 재계산 금지
  outdoor: boolean; // 서버 파생(part1에 '야외' 포함) — 프론트 재판정 금지
  startNo: number;
  slotCount: number;
  titleOverrides: Record<string, string>; // 非null, 빈맵 기본. 키=slotNo 문자열, 값=override 타이틀
}

// POST → 201 {data: ZoneResponse}
export interface ZoneCreateRequest {
  part1: string; // 필수(@NotBlank) — 폼 클라측 required 강제
  part2?: string | null;
  part3?: string | null;
  part4?: string | null;
  startNo?: number; // 서버 기본 1
  slotCount: number; // @Min 1
}

// PUT /{zid} → 200 {data: ZoneResponse}
export interface ZoneUpdateRequest extends ZoneCreateRequest {
  // null/생략 = 타이틀 미변경 / 값·빈맵 = zone_id 기준 delete-insert(전삭제 후 재삽입)
  titleOverrides?: Record<string, string> | null;
}

// GET /{zid}/slots → {data: SlotForQrResponse[]}
export interface SlotForQrResponse {
  slotNo: number;
  slotCode: string; // 서버 조립(zid-slotIndex). web은 파싱·조립하지 않음
  slotFullName: string; // 서버 조립 표시명. SlotAutoLabel이 그대로 렌더
  scanUrl: string; // 서버 조립 절대 URL. QrPreview가 그대로 인코딩(자체 조립 금지)
}

/**
 * 관리자 콘솔 행사(ADM-01/02) 응답/요청 타입 — 실측 api DTO 미러(EventResponse.kt·
 * EventCreateRequest.kt·EventUpdateRequest.kt 직접 대조, 스펙 JSON 예시 아님).
 *
 * create/update 요청 필드셋은 서버 계약이 비대칭이다: create는 브랜딩 컬러 4종을 optional로
 * 받지만 status/active는 안 받고(서버 기본값), update는 반대로 컬러 없이 status/active를 받는다.
 * 브랜딩 컬러 4종은 두 요청 타입 모두에서 구조적으로 제외한다 — 서버가 별도 게이트
 * (PUT .../branding)로 분리해 지키는 불변식을 프론트도 타입 레벨에서 미러해, 실수로 컬러 필드를
 * 채워 보내는 코드 자체가 컴파일되지 않게 막는다(라이브 키오스크 화면에 반영되는 값이라 실수
 * 반영 비용이 크다).
 */

// GET /api/events, /api/events/{eid} → {data: EventResponse | EventResponse[]}
export interface EventResponse {
  id: string;
  name: string;
  eventDate: string | null; // Instant? → ISO-8601 offset 문자열
  place: string | null;
  type: string | null; // 연회식 / 극장식 지정석 / 극장식 자유석 (분류 라벨, 좌석 구성 미결정)
  status: string; // 준비 / 운영중 / 종료
  active: boolean; // 키오스크·공개 화면 노출 여부
  bgColor: string | null;
  pointColor: string | null;
  titleColor: string | null;
  bodyColor: string | null;
  kv: string | null; // 키비주얼 텍스트/식별자
  defaultIdleMode: string | null; // 응답 전용(본 REQ 폼 미편집 — 브랜딩 REQ 범위)
  smsPolicy: string | null; // 응답 전용(본 REQ 폼 미편집)
}

// POST /api/events → 201 {data: EventResponse} (권한 SYSTEM_ADMIN)
// 브랜딩 컬러·status·active는 타입에서 제외(서버 기본값 상속 — 위 설명 참조)
export interface EventCreateRequest {
  name: string;
  eventDate?: string | null;
  place?: string | null;
  type?: string | null;
  kv?: string | null;
}

// PUT /api/events/{eid} → 200 {data: EventResponse}
// Kotlin EventUpdateRequest 정확 미러 — 브랜딩 컬러 없음(§2-4 게이트 분리)
export interface EventUpdateRequest {
  name: string;
  eventDate?: string | null;
  place?: string | null;
  type?: string | null;
  kv?: string | null;
  status: string;
  active: boolean;
}

/**
 * PUT /api/events/{eid}/branding → 200 {data: EventResponse} — 컬러 4종 편집은 행사 수정
 * (EventUpdateRequest)과 분리된 별도 엔드포인트다. null=미지정(게스트 기본색 상속) — 값이
 * 유의미한 상태라 옵셔널이 아닌 명시 `| null`로 둔다. kv·defaultIdleMode는 이 폼이 편집하지
 * 않는 필드지만 요청 바디에는 포함해야 한다 — PUT이 full-replace 의미일 때 컬러만 보내면 두
 * 필드가 조용히 지워지므로, 호출부(BrandingForm)가 현재값을 그대로 라운드트립해 되돌려 보낸다.
 */
export interface EventBrandingUpdateRequest {
  bgColor: string | null;
  pointColor: string | null;
  titleColor: string | null;
  bodyColor: string | null;
  kv: string | null;
  defaultIdleMode: string | null;
}
