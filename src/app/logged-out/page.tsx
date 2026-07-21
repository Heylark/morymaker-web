import Link from 'next/link';

/**
 * 로그아웃 종결 화면 — `SessionZone`의 로그아웃 하드 내비게이션 목적지(ADR-023).
 *
 * `/oauth/login`을 목적지로 두지 않는 이유: `POST /api/auth/logout`은 web 쿠키만 지울 뿐 IdP
 * 세션을 종결하지 않는다. 그 상태에서 `/oauth/login`으로 보내면 auth가 살아 있는 세션을 폼·동의
 * 화면 없이 재인정해 사용자가 로그아웃 화면을 한 번도 보지 못한 채 같은 계정으로 재로그인된다
 * (공용 태블릿 계정 유출 경로). 이 화면은 그 재인정 왕복 자체를 만들지 않는다.
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
      <Link
        href="/oauth/login?prompt=login"
        className="rounded-[var(--radius-frame)] border border-[var(--line)] px-[var(--space-16)] py-[var(--space-8)] text-[length:var(--fs-body)] text-[var(--ivory)] transition-colors hover:border-[var(--champagne)]"
      >
        다시 로그인
      </Link>
    </main>
  );
}
