/**
 * GET 3분법 판정 헬퍼 (단일 진실 소스) — api SecurityConfig 인증 정책을 구조적으로 미러한다.
 *
 * ⚠️ 동기화 의무: api SecurityConfig가 공개 matcher(permitAll)를 추가하면 PUBLIC_PREFIXES를,
 *    nullable-principal(있어도 없어도 응답하는) GET을 추가하면 HYBRID_PATTERNS를 함께 갱신한다.
 *    새 authenticated 엔드포인트 추가는 디폴트가 이미 PRIVATE라 이 파일 갱신이 불요하다.
 *
 * 분류 의미:
 *   PRIVATE = api가 authenticated()로 막은 나머지 전부(디폴트) — Bearer 필수
 *   HYBRID  = nullable-principal enrich GET — 토큰 있으면 attach, 없으면/만료면 익명 응답
 *   PUBLIC  = api SecurityConfig가 permitAll로 명시한 prefix — 토큰 strip
 *
 * api 실 정책이 parkgolf24와 정반대 형상이라(공개는 예외, 인증이 규칙 — `/api/public/**`·
 * `/actuator/health`만 permitAll이고 나머지는 anyRequest().authenticated()) 판정도 뒤집는다:
 * PUBLIC-prefix를 열거하고 나머지는 fail-closed PRIVATE 디폴트로 둔다. 미지의 경로가 새로
 * authenticated로 추가돼도 이 파일 변경 없이 자동으로 PRIVATE 처리되어 안전 열화(캐시 이득
 * 상실뿐)로 수렴한다 — parkgolf24식 PRIVATE-allowlist는 열거 누락 시 인증 데이터가 PUBLIC으로
 * 새는 반대 방향 위험이라 이 형상엔 부적합하다.
 *
 * 판정 우선순위 (순서 변경 금지): 비-GET → HYBRID → PUBLIC prefix → PRIVATE 디폴트.
 * HYBRID를 PUBLIC보다 먼저 검사하는 이유: 개인정보를 포함한 HYBRID 경로가 `/api/public/` 아래
 * 살 수 있어(예: 방문자용 슬롯 조회) PUBLIC으로 먼저 매칭되면 캐시 누출로 이어진다.
 */

export type AuthMode = 'private' | 'hybrid' | 'public';

/**
 * api SecurityConfig의 permitAll matcher 미러. 이 prefix로 시작하는 GET만 PUBLIC.
 * ⚠️ api SecurityConfig 공개 matcher 변경 시 이 목록도 함께 갱신.
 */
const PUBLIC_PREFIXES = ['/api/public/', '/actuator/health'] as const;

/**
 * nullable-principal enrich GET — 토큰 있으면 있는 대로, 없어도 공개 응답 가능한 경로.
 * 단일/고정 세그먼트 앵커 정규식만 사용한다(prefix 금지 — list와 detail이 동시에 잡히는 것을 방지).
 * foundation은 해당 엔드포인트가 없어 빈 배열로 시작한다.
 * ⚠️ api가 nullable-principal GET을 추가하면 이 목록 갱신 의무.
 */
const HYBRID_PATTERNS: RegExp[] = [];

/**
 * path와 method로 인증 모드를 3분법으로 판정한다.
 *
 * @param path   API 경로 (쿼리스트링 있어도 무관, leading slash 없어도 무관)
 * @param method HTTP 메서드 (대소문자 무관, 디폴트 GET)
 */
export function getAuthMode(path: string, method: string = 'GET'): AuthMode {
  // 비-GET은 항상 PRIVATE — 쓰기는 토큰 필수
  if (method.toUpperCase() !== 'GET') return 'private';

  const cleanPath = path.split('?')[0];
  const normalized = cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`;

  // HYBRID를 PUBLIC보다 먼저 검사 — 개인정보 포함 경로가 PUBLIC prefix 아래 살 수 있다
  if (HYBRID_PATTERNS.some((pattern) => pattern.test(normalized))) {
    return 'hybrid';
  }

  if (PUBLIC_PREFIXES.some((prefix) => normalized.startsWith(prefix))) {
    return 'public';
  }

  // 나머지는 fail-closed PRIVATE 디폴트
  return 'private';
}
