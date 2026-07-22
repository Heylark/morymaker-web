import Link from 'next/link';

interface MenuItem {
  href: string;
  label: string;
  description: string;
}

const MENU_ITEMS: MenuItem[] = [
  { href: '/staff/search', label: '통합 조회', description: '이름·차량번호로 참석자 찾기' },
  { href: '/staff/parking-board', label: '주차 보드', description: '자리 현황 확인·등록·출차' },
  { href: '/staff/scan', label: '체크인 스캔', description: 'QR 스캔으로 참석 확인' },
];

/**
 * 실행자 업무 선택 홈 — 데이터 조회 없는 정적 네비게이션(Server Component로 충분).
 * 3버튼은 각각 조회·보드·스캔 업무로 진입한다.
 */
export default function StaffHomePage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-6 bg-surface-sunken p-6">
      <h1 className="text-desk-lg font-semibold text-ink">실행자 업무</h1>
      <div className="flex flex-col gap-4">
        {MENU_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            prefetch={false}
            className="flex min-h-touch flex-col justify-center gap-1 rounded-card bg-surface p-5 shadow-sm ring-1 ring-line-soft"
          >
            <span className="text-desk font-semibold text-primary">{item.label}</span>
            <span className="text-sm text-ink-muted">{item.description}</span>
          </Link>
        ))}
      </div>
    </main>
  );
}
