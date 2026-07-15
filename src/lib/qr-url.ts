/**
 * 체크인 QR URL 검증·토큰 추출 — 도메인 화이트리스트 + `/u/{token}` 경로 패턴만 인정한다.
 * 무효·타 도메인·타 패턴 URL은 null을 반환해 호출부(QrScanner)가 오인식으로 무시하고 계속
 * 스캔하게 한다(외부 QR·명함 QR 오인식 차단).
 *
 * 두 겹은 독립된 차단막이다 — 한쪽만 갱신하면 파손이 유지된다:
 *   ① 호스트: 운영 도메인 변경 시 ALLOWED_HOSTS를 갱신한다.
 *   ② 경로: QR이 basePath 하위(`/app/u/{token}`)로 발급되므로 BASE_PATH로 패턴을 구동한다
 *      (하드코딩 금지 — 하드코딩하면 로컬 개발(basePath='')에서 파서가 죽는다).
 */
import { BASE_PATH } from '@/lib/base-path';

const ALLOWED_HOSTS = ['mm.i-commtech.co.kr', 'localhost', '127.0.0.1'];

// 실기기 LAN 접근(mkcert 로컬 HTTPS) 대비 — 사설 대역 호스트는 개발 환경마다 IP가 달라
// 고정 목록 대신 패턴으로 허용한다. 운영 도메인은 위 화이트리스트로만 제한된다.
const PRIVATE_LAN_PATTERNS = [/^192\.168\.\d{1,3}\.\d{1,3}$/, /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/];

// 선두 앵커(^)는 보안 자산 — 버리면 `https://host/evil/u/token` 같은 경로도 수용되어 검증이
// 느슨해진다. BASE_PATH가 ''(로컬)이면 `^/u/...`, '/app'(배포)이면 `^/app/u/...`로 환경별 자동 정합.
const TOKEN_PATH_PATTERN = new RegExp(`^${BASE_PATH}/u/([^/]+)$`);

function isAllowedHost(hostname: string): boolean {
  if (ALLOWED_HOSTS.includes(hostname)) return true;
  return PRIVATE_LAN_PATTERNS.some((pattern) => pattern.test(hostname));
}

/**
 * 디코딩된 QR 원문(URL 문자열)에서 체크인 토큰을 추출한다.
 * 도메인이 화이트리스트 밖이거나 경로가 `/u/{token}` 형태가 아니면 null.
 */
export function parseCheckinToken(rawText: string): string | null {
  let url: URL;
  try {
    url = new URL(rawText);
  } catch {
    return null; // URL 형식 자체가 아닌 QR(예: 명함 vCard) — 무시
  }
  if (!isAllowedHost(url.hostname)) return null;

  const match = TOKEN_PATH_PATTERN.exec(url.pathname);
  return match ? match[1] : null;
}
