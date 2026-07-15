/**
 * basePath 단일 진실 소스 — next.config.ts 의 basePath 와 같은 env 를 읽는다.
 *
 * ⚠️ 빌드타임 인라인(DefinePlugin)이라 런타임 env 주입은 클라 번들에 반영되지 않는다.
 *    값은 빌드 시점 .env(.env.local / .env.example)로만 결정된다.
 *
 * ⚠️ 이 상수는 "외부 좌표계"로 나가는 경계에서만 쓴다. <Link>·router.push·redirect()(Server
 *    Component)·usePathname() 비교 대상은 Next.js가 자동 처리하므로 붙이면 /app/app 이중 적용이 된다.
 */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '';
