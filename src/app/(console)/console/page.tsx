'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { proxyFetch } from '@/lib/proxy-fetch';

/** api EventResponse DTO 그대로 소비(추가 변환 불요 — api 응답 `{data: T}` 계약) */
interface EventSummary {
  id: string;
  name: string;
  eventDate: string | null;
  place: string | null;
  type: string | null;
  status: string;
  active: boolean;
}

type LoadState = { status: 'loading' } | { status: 'error'; message: string } | { status: 'ready'; events: EventSummary[] };

// route group((console))은 URL에 영향을 주지 않으므로, 이 하위의 실제 경로 세그먼트(console/)가
// 그룹별 placeholder를 서로 다른 URL로 분리한다. 서브도메인 rewrite로 각 그룹을 루트("/")에
// 매핑하는 것은 후속 REQ 범위 — 그 전까지는 이 경로가 임시 접근 지점이다.
export default function ConsolePage() {
  const [state, setState] = useState<LoadState>({ status: 'loading' });

  useEffect(() => {
    const controller = new AbortController();
    // api-절대경로('api/events')를 그대로 넘긴다 — 3분법 판정이 이 경로에 적용되어야 Spring
    // matcher(/api/public/**)와 문자 그대로 일치한다.
    proxyFetch('api/events', { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) {
          setState({ status: 'error', message: `행사 목록 조회 실패 (${res.status})` });
          return;
        }
        const body: { data: EventSummary[] } = await res.json();
        setState({ status: 'ready', events: body.data });
      })
      .catch((err) => {
        if (err.name === 'AbortError') return;
        setState({ status: 'error', message: '행사 목록 조회 중 오류가 발생했습니다.' });
      });
    return () => controller.abort();
  }, []);

  return (
    <div>
      <h1>관리자 콘솔 — 행사 목록</h1>
      {state.status === 'loading' && <p>불러오는 중...</p>}
      {state.status === 'error' && <p>{state.message}</p>}
      {state.status === 'ready' && (
        // event_ids 스코프 필터는 api EventService가 이미 적용해 반환한다 — web은 추가 필터링을
        // 수행하지 않는다(SYSTEM_ADMIN은 전체, EVENT_ADMIN은 담당 행사만 이 배열에 담겨 온다).
        <ul>
          {state.events.map((event) => (
            <li key={event.id}>
              {event.name} — {event.status} ·{' '}
              <Link href={`/events/${event.id}/parking`}>주차 구성</Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
