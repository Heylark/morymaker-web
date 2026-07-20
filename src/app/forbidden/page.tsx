import Link from 'next/link';

/**
 * 인증은 됐으나 role이 부족한 사용자가 도달하는 게이트 종결 페이지 — role-중립.
 *
 * 게이트 그룹((console)/(staff)/(kiosk)/(visitor)) 밖에 위치해 이 페이지 자신은 어떤 role
 * 게이트도 통과하지 않는다(FORBIDDEN_PATH — src/lib/roles.ts). 재인증해도 role은 바뀌지
 * 않으므로 로그인으로 되돌려보내지 않고, 여기서 명확히 종결한다. 콘솔의 라이트 스코프 밖이라
 * 상위 <html>의 다크 배경을 그대로 물려받는다(별도 테마 래퍼 불필요 — 단순 중앙 메시지).
 */
export default function ForbiddenPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-[var(--space-16)] px-[var(--space-22)] text-center">
      <p className="text-[length:var(--fs-eyebrow)] uppercase tracking-[var(--ls-eyebrow)] text-[var(--faint)]">
        403
      </p>
      <h1 className="text-[length:var(--fs-display)] text-[var(--ivory)]">접근 권한이 없습니다</h1>
      <p className="max-w-[420px] text-[length:var(--fs-body)] text-[var(--muted)]">
        현재 계정 권한으로는 이 화면을 열람할 수 없습니다. 필요하다면 관리자에게 권한을 문의하세요.
      </p>
      <Link
        href="/"
        className="rounded-[var(--radius-frame)] border border-[var(--line)] px-[var(--space-16)] py-[var(--space-8)] text-[length:var(--fs-body)] text-[var(--ivory)] transition-colors hover:border-[var(--champagne)]"
      >
        홈으로
      </Link>
    </main>
  );
}
