/**
 * JWT 클레임 추출 — 서명 검증 없이 디코딩만 한다.
 *
 * web은 Resource Server가 아니다. 토큰을 불투명 bearer 자격증명으로 상류(api)에 전달할 뿐이고,
 * 여기서 꺼내는 값은 전부 비권위적 UI 힌트다(만료 선제 판단·게이트 판정·표시용). 실 보안 경계는
 * api(서명·issuer·timestamp를 모두 검증하는 JwtDecoder + 행사 스코프 가드)다 — web은 api가 재검증
 * 하지 않는 인가 결정을 내리지 않는다(게이트를 속여도 api가 무권한 호출을 거부한다).
 */

/** base64url payload를 UTF-8 문자열로 디코딩 (Node 런타임 — Buffer 사용) */
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const json = Buffer.from(parts[1], 'base64url').toString('utf-8');
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/**
 * exp 클레임(Unix초)을 추출한다. 만료 선제 판단에 사용 — expires_in 값은 단위(초/밀리초)가
 * 서버마다 다를 수 있어 신뢰하지 않고, 항상 토큰 자체의 exp를 권위 있는 값으로 쓴다.
 * 부재/malformed → 0(호출자가 "이미 만료"로 안전하게 취급).
 */
export function getJwtExp(token: string): number {
  const payload = decodeJwtPayload(token);
  return typeof payload?.exp === 'number' ? payload.exp : 0;
}

/**
 * access token의 roles 클레임을 추출한다. auth TokenCustomizer가 이미 ROLE_ 접두사를 제거해
 * 발급하므로 여기서 추가 가공하지 않는다. 부재/malformed → 빈 배열(게이트 거부로 자연 수렴).
 */
export function extractRoles(accessToken: string): string[] {
  const payload = decodeJwtPayload(accessToken);
  const roles = payload?.roles;
  if (!Array.isArray(roles)) return [];
  return roles.filter((r): r is string => typeof r === 'string');
}

/**
 * id_token의 email 클레임을 추출한다(scope=email 인가 시에만 auth가 발급 — 미포함이면 계정에
 * email이 없다는 뜻). 표시용이라 부재 시 빈 문자열로 안전하게 수렴한다.
 */
export function extractEmail(idToken: string): string {
  const payload = decodeJwtPayload(idToken);
  return typeof payload?.email === 'string' ? payload.email : '';
}
