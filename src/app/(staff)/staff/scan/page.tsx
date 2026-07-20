'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { QrScanner } from '@/components/QrScanner';
import { useStaffEvent } from '@/hooks/useStaffEvent';
import { useLookup } from '@/hooks/useLookup';
import { UnifiedSearch } from '@/components/staff/UnifiedSearch';

/**
 * SCN-00 체크인 QR 스캔 홈 — 인식 성공 시 토큰을 쿼리로 넘겨 SCN-01(확인 화면)에서 프리뷰·체크인을
 * 이어서 처리한다(프리뷰를 이 페이지가 아니라 확인 화면이 직접 조회 — 스캔 시점과 확인 시점 사이
 * 시간차가 있어도 항상 최신 상태를 보여준다). 카메라 권한 거부 시 HLP-01 검색 로직을 재사용한
 * 이름검색 폴백으로 전환한다.
 */
export default function ScanHomePage() {
  const router = useRouter();
  const { eid } = useStaffEvent();
  const [fallback, setFallback] = useState(false);
  const [query, setQuery] = useState('');
  const { data } = useLookup(eid, query);

  function handleDecode(token: string) {
    router.push(`/staff/scan/confirm?token=${encodeURIComponent(token)}`);
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-6 bg-surface-sunken p-6">
      <h1 className="text-desk-lg font-semibold text-ink">체크인 스캔</h1>

      {!fallback && (
        <QrScanner facingMode="user" onDecode={handleDecode} onPermissionDenied={() => setFallback(true)} />
      )}

      {fallback && (
        <div className="flex flex-col gap-3">
          <p className="text-ink-muted">카메라 접근이 거부되어 이름 검색으로 진행합니다.</p>
          <UnifiedSearch onSearch={setQuery} />
          {data && data.data.length > 0 && (
            <ul className="flex flex-col gap-2">
              {data.data.map((item) => (
                <li key={item.guestId}>
                  <button
                    type="button"
                    onClick={() => {
                      const orgParam = item.org ? `&org=${encodeURIComponent(item.org)}` : '';
                      router.push(
                        `/staff/scan/confirm?guestId=${item.guestId}&name=${encodeURIComponent(item.name)}${orgParam}`,
                      );
                    }}
                    className="min-h-touch w-full rounded-card bg-surface p-4 text-left shadow-sm ring-1 ring-line-soft"
                  >
                    {item.name} — {item.org ?? '-'}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </main>
  );
}
