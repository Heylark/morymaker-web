import { NextResponse } from 'next/server';

/**
 * GET /api/health — 컨테이너 liveness 전용. 인증·DB·외부 호출 0건, 항상 200.
 *
 * 헬스체크 probe가 이 라우트 없이 `/`를 찌르면 무쿠키 요청이 항상 로그인 리다이렉트 체인을 타고
 * 외부 auth 서버까지 나간다 — 이 라우트는 그 체인 자체를 건너뛰는 별도 좌표를 제공한다. 라우트
 * 파일 경로 자체가 basePath 자동 접두 대상(파일시스템 라우트)이라 코드 내부에서 BASE_PATH를
 * 수동으로 붙이지 않는다 — 붙이면 /app/app 이중 적용이 된다.
 *
 * 정적 최적화로 응답이 빌드 타임에 굳을 값이 없어(고정 200, 캐시 헤더 없음) export const dynamic은
 * 넣지 않는다 — Next.js가 이 핸들러를 정적으로 프리렌더해도 결과가 달라지지 않는다.
 */
export async function GET() {
  return NextResponse.json({ status: 'ok' });
}
