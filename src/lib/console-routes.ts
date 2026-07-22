export type HeaderMeta =
  | { variant: 'list'; title: string; backHref: string | null; action: { label: string; href: string } | null }
  | { variant: 'detail'; eyebrow: string; backHref: string }; // 제목·상태 pill은 셸이 useEvent로 채운다

/**
 * 동적 세그먼트 값 — useParams() 결과를 그대로 넘긴다. 레지스트리에 2-depth 동적 라우트
 * (`parking/{zid}`)가 있으므로 eid 단일 인자로는 그 행을 어떤 입력으로도 정확 매칭할 수 없다.
 * 향후 동적 세그먼트가 늘어도 시그니처가 다시 깨지지 않도록 객체 전달을 계약으로 고정한다.
 */
export interface RouteParams {
  eid?: string;
  zid?: string;
}

interface RegistryEntry {
  /** params로 이 행이 가리키는 pathname을 계산한다 — 필요한 세그먼트가 없으면 null(비매칭). */
  path: (params: RouteParams) => string | null;
  meta: (params: RouteParams) => HeaderMeta;
}

const REGISTRY: readonly RegistryEntry[] = [
  {
    path: () => '/events',
    meta: () => ({ variant: 'list', title: '행사 목록', backHref: null, action: { label: '+ 새 행사', href: '/events/new' } }),
  },
  {
    path: () => '/events/new',
    meta: () => ({ variant: 'list', title: '새 행사', backHref: '/events', action: null }),
  },
  {
    path: () => '/accounts',
    meta: () => ({
      variant: 'list',
      title: '계정 관리',
      backHref: null,
      action: { label: '+ 계정 추가', href: '/accounts/new' },
    }),
  },
  {
    path: () => '/accounts/new',
    meta: () => ({ variant: 'list', title: '계정 추가', backHref: '/accounts', action: null }),
  },
  {
    path: () => '/staff/scan',
    meta: () => ({ variant: 'list', title: '체크인 스캔', backHref: null, action: null }),
  },
  {
    path: () => '/staff/scan/confirm',
    meta: () => ({ variant: 'list', title: '본인 확인', backHref: '/staff/scan', action: null }),
  },
  {
    path: (p) => (p.eid ? `/events/${p.eid}/edit` : null),
    meta: () => ({ variant: 'detail', eyebrow: '행사 · 행사 정보', backHref: '/events' }),
  },
  {
    path: (p) => (p.eid ? `/events/${p.eid}/roster` : null),
    meta: () => ({ variant: 'detail', eyebrow: '행사 · 명단', backHref: '/events' }),
  },
  {
    path: (p) => (p.eid ? `/events/${p.eid}/roster/template` : null),
    meta: (p) => ({ variant: 'detail', eyebrow: '행사 · 명단 · 문자 템플릿', backHref: `/events/${p.eid}/roster` }),
  },
  {
    path: (p) => (p.eid ? `/events/${p.eid}/seats` : null),
    meta: () => ({ variant: 'detail', eyebrow: '행사 · 좌석', backHref: '/events' }),
  },
  {
    path: (p) => (p.eid ? `/events/${p.eid}/parking` : null),
    meta: () => ({ variant: 'detail', eyebrow: '행사 · 주차', backHref: '/events' }),
  },
  {
    path: (p) => (p.eid && p.zid ? `/events/${p.eid}/parking/${p.zid}` : null),
    meta: (p) => ({ variant: 'detail', eyebrow: '행사 · 주차 · 구획', backHref: `/events/${p.eid}/parking` }),
  },
  {
    path: (p) => (p.eid ? `/events/${p.eid}/branding` : null),
    meta: () => ({ variant: 'detail', eyebrow: '행사 · 브랜딩', backHref: '/events' }),
  },
  {
    path: (p) => (p.eid ? `/events/${p.eid}/dashboard` : null),
    meta: () => ({ variant: 'detail', eyebrow: '행사 · 통계', backHref: '/events' }),
  },
];

/**
 * pathname(앱 좌표계) + params(useParams) → 헤더 메타.
 * 등록되지 않은 경로는 null — 셸은 헤더를 렌더하지 않고 main만 렌더한다(안전 퇴화).
 *
 * 매칭은 레지스트리 배열의 위에서부터 첫 매치로 한다. `{eid}`·`{zid}` 세그먼트는
 * params.eid·params.zid 값으로 치환해 정확 비교한다(정규식 자유 매칭 금지 — `/events/new`가
 * eid로 오인되는 사고를 구조적으로 차단한다. `/events/new`에는 eid 파라미터 자체가 없으므로
 * eid 필요 행은 candidate가 null이 되어 애초에 후보에서 제외된다).
 */
export function resolveHeaderMeta(pathname: string | null, params: RouteParams): HeaderMeta | null {
  if (!pathname) return null;
  for (const entry of REGISTRY) {
    const candidate = entry.path(params);
    if (candidate !== null && candidate === pathname) {
      return entry.meta(params);
    }
  }
  return null;
}

export type StatusPillTone = 'pending' | 'done' | 'void';

/**
 * 행사 상태 → StatePill 톤. 시각 정본 adm08-console-shell.html 기준:
 *   운영중 → 'pending'  = `.state` 기본(champagne 텍스트 + --line 테두리) = 정본 `.pill`
 *   준비   → 'void'      = `.state.void`(faint + line-soft)                = 정본 `.pill dim`
 *   종료   → 'void'      = 〃                                              = 정본 `.pill dim`
 * 미지의 상태 문자열은 'void'(저강조)로 안전 퇴화 — 새 상태값이 추가돼도 잘못 강조되지 않는다.
 * 'done'(--card-hi 채움)은 정본 콘솔 셸 씬에 대응물이 0건이므로 사용하지 않는다.
 */
export function statusPillTone(status: string | null | undefined): StatusPillTone {
  if (status === '운영중') return 'pending';
  return 'void';
}
