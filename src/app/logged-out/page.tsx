import Link from 'next/link';

/**
 * 로그아웃 종결 화면 — `GET /api/auth/logout`이 auth `/connect/logout`을 거쳐 돌아오는
 * 착지점(auth에 등록된 `post_logout_redirect_uri`와 이 경로가 byte-exact로 같아야 한다 —
 * 다르면 auth가 로그아웃 자체를 400으로 거부한다).
 *
 * `/oauth/login`을 목적지로 두지 않는 이유: 이 화면에 도달했다는 것은 이미 auth IdP 세션이
 * 종결됐다는 뜻이지만(로그아웃 라우트가 web 쿠키 삭제와 auth 세션 종결을 한 응답에서 함께
 * 수행한다), 그래도 `/oauth/login`으로 곧장 보내면 매 로그아웃마다 불필요한 OIDC 왕복이 한 번
 * 더 생긴다 — 이 화면은 그 왕복을 사용자의 "다시 로그인" 클릭 시점으로 미룬다.
 *
 * `/forbidden`과 동일 계층 — 게이트 그룹((console)/(staff)/(kiosk)/(visitor)) 밖에 위치해
 * 이 페이지 자신은 어떤 role 게이트도 걸리지 않는다(CLAUDE.md "역할 게이트 폴백" — 폴백 대상
 * 페이지에 게이트를 걸면 무한 루프).
 */
export default function LoggedOutPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-[var(--space-16)] px-[var(--space-22)] text-center">
      <h1 className="text-[length:var(--fs-display)] text-[var(--ivory)]">로그아웃되었습니다</h1>
      <p className="max-w-[420px] text-[length:var(--fs-body)] text-[var(--muted)]">
        안전하게 로그아웃되었습니다. 다시 이용하려면 로그인해 주세요.
      </p>
      {/* prefetch 비활성 필수 — /oauth/login은 Route Handler라 GET만으로 PKCE 페어를 생성하고
          mm_pkce 쿠키를 심은 뒤 auth로 307을 낸다. 기본 프리페치가 걸리면 사용자가 버튼을
          누르지 않아도 이 화면 진입만으로 그 왕복이 발생해(SavedRequest 오염 함정과 동종
          "조용한" 부작용), 실제 클릭 시 두 번째 PKCE 페어가 첫 번째를 덮어쓴다. */}
      <Link
        href="/oauth/login?prompt=login"
        prefetch={false}
        className="rounded-[var(--radius-frame)] border border-[var(--line)] px-[var(--space-16)] py-[var(--space-8)] text-[length:var(--fs-body)] text-[var(--ivory)] transition-colors hover:border-[var(--champagne)]"
      >
        다시 로그인
      </Link>
    </main>
  );
}
