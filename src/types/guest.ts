/**
 * 관리자 콘솔 명단(ADM-05) 응답/요청 타입 — 실측 api DTO 미러(spec 예시 아님).
 * 성공 래퍼는 `{data}` 단일 키. 단 목록 조회만 `{data, meta}` — meta 필드는 전부
 * NON_NULL이라 검색 관련 필드(searchState 등)는 `q` 미지정 시 응답에서 키 자체가 생략된다.
 */

// GET /api/events/{eid}/guests → {data: GuestResponse[], meta: {total, searchState?, page, size}}
export interface GuestResponse {
  id: string;
  name: string;
  org: string | null;
  title: string | null;
  phone: string | null;
  plate: string | null;
  seatGroupId: string | null;
  seatLabel: string | null; // GuestListItem 유래일 때만 채워짐(단건 등록 직후 등은 항상 null)
  status: GuestStatus;
  src: GuestSrc;
  visitAt: string | null; // Instant → ISO-8601 offset 문자열
  token: string;
  createdAt: string;
}

// POST /api/events/{eid}/guests → 201 {data: GuestResponse}
export interface GuestCreateRequest {
  name: string; // 필수(@NotBlank)
  org?: string | null;
  title?: string | null;
  phone?: string | null;
  plate?: string | null;
  seatGroupId?: string | null;
  src?: string | null; // 미지정 시 서버가 현장 등록으로 간주
}

// PUT /api/events/{eid}/guests/{gid} → {data: GuestResponse}
// status 필드 없음 — 상태 되돌리기(체크인 취소)는 §5-3 별도 엔드포인트, 이 REQ 범위 밖.
export interface GuestUpdateRequest {
  name?: string | null;
  org?: string | null;
  title?: string | null;
  phone?: string | null;
  plate?: string | null;
  seatGroupId?: string | null;
}

// POST /api/events/{eid}/guests/import/preview → {data: GuestImportPreviewResponse}
// 항목별 상세(이름·변경필드·before/after)는 반환하지 않는다 — 카운트 + 유효성 오류 행만.
export interface GuestImportPreviewResponse {
  newCount: number;
  updatedCount: number;
  excludedCount: number;
  invalidRows: InvalidImportRow[];
}

// POST /api/events/{eid}/guests/import → {data: GuestImportResultResponse}
// confirmImport는 preview 토큰을 재사용하지 않고 파일을 다시 받아 재파싱한다.
export interface GuestImportResultResponse {
  newCount: number;
  updatedCount: number;
  cancelledCount: number;
  invalidRows: InvalidImportRow[];
  tokenPreserved: boolean;
}

export interface InvalidImportRow {
  rowNumber: number;
  reason: string;
}

/** listGuests가 {data, meta}를 병합해 반환하는 web 파생 shape(실 api 응답 그대로가 아님). */
export interface GuestListResult {
  items: GuestResponse[];
  total: number;
  searchState: SearchState | null; // q 없으면 meta.searchState 키 자체가 생략됨(null로 정규화)
}

/** RosterTable 검색·필터 로컬 state → listGuests 쿼리 파라미터로 그대로 전달. */
export interface GuestSearchFilters {
  q?: string;
  status?: GuestStatus;
  src?: GuestSrc;
  includeCancelled?: boolean;
}

// Guest.kt companion 상수 그대로 미러 — 문자열 유니온(신규 값 추가는 서버 상수 변경과 함께).
export type GuestStatus = '대기' | '방문' | '참석' | '취소';
export type GuestSrc = '사전' | '현장';
export type SearchState = 'ONE' | 'MANY' | 'NONE';
