'use client';

import { use, useReducer } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { initialKioskState, kioskReducer } from '@/lib/kiosk/machine';
import { useIdleTimeout } from '@/hooks/useIdleTimeout';
import { useKioskBranding } from '@/hooks/useKioskBranding';
import { clearKioskSession, IDLE_TIMEOUT_MS, kioskKeys } from '@/lib/kiosk/constants';
import { BrandingScope } from '@/components/branding/BrandingScope';
import { KioskShell } from '@/components/kiosk/KioskShell';
import { IdlePlayer } from '@/components/kiosk/IdlePlayer';
import { KioskMenu } from '@/components/kiosk/KioskMenu';
import { NameSearch } from '@/components/kiosk/NameSearch';
import { IdentityConfirm } from '@/components/kiosk/IdentityConfirm';
import { SeatGuide } from '@/components/kiosk/SeatGuide';
import { PlateSearch } from '@/components/kiosk/PlateSearch';
import { ParkLocationView } from '@/components/kiosk/ParkLocationView';

interface KioskPageProps {
  params: Promise<{ eid: string }>;
}

/**
 * 최초 사용자 제스처(idle 터치) 콜스택 안에서 동기 호출해야 브라우저 정책을 통과한다 — await
 * 이후에 호출하면 제스처 컨텍스트가 끊겨 거부될 수 있다. 전체화면·화면유지는 부가 기능이라
 * feature-detect + 실패 무시(non-fatal) — 미지원 기기에서도 흐름을 막지 않는다.
 */
function requestKioskFullscreen(): void {
  const el = document.documentElement;
  if (typeof el.requestFullscreen === 'function') {
    el.requestFullscreen().catch(() => {
      // 브라우저 정책·기기 제약으로 실패해도 무시 — 전체화면은 부가 기능
    });
  }
  if ('wakeLock' in navigator) {
    navigator.wakeLock.request('screen').catch(() => {
      // best-effort — 화면 꺼짐 방지 실패는 흐름에 영향 없음
    });
  }
}

/**
 * `/kiosk/[eid]` 단일 라우트 오케스트레이터 — useReducer 상태머신 + useIdleTimeout + 화면 렌더를
 * 이 파일이 직접 담당한다. eid 사전 게이트를 생략하는 정책에 따라 이 페이지 자체는 eid
 * 유효성을 확인하지 않는다 — idle·menu는 항상 렌더되고, 각 화면의 최초 조회 액션이 무효 eid를
 * 404로 자연스럽게 표면화한다.
 */
export default function KioskPage({ params }: KioskPageProps) {
  const { eid } = use(params);
  const [state, dispatch] = useReducer(kioskReducer, initialKioskState);
  const queryClient = useQueryClient();
  const { data: branding } = useKioskBranding(eid);

  function handleIdleTimeout() {
    // 무동작 타임아웃 개인정보 완전 초기화 3종: reducer RESET + RQ 캐시 제거 + 세션 저장소 clear.
    dispatch({ type: 'RESET' });
    queryClient.removeQueries({ queryKey: kioskKeys.all });
    clearKioskSession();
  }

  useIdleTimeout(handleIdleTimeout, IDLE_TIMEOUT_MS);

  function handleTouch() {
    dispatch({ type: 'TOUCH_START' });
    requestKioskFullscreen();
  }

  return (
    <BrandingScope pointColor={branding?.pointColor}>
      {state.screen !== 'idle' && (
        <nav className="flex w-full justify-between px-4 py-2 text-desk text-ink-muted">
          <button type="button" onClick={() => dispatch({ type: 'BACK_TO_MENU' })} className="min-h-touch">
            메뉴로
          </button>
          <button type="button" onClick={() => dispatch({ type: 'RESET' })} className="min-h-touch">
            처음으로
          </button>
        </nav>
      )}
      <KioskShell>
        {state.screen === 'idle' && <IdlePlayer eid={eid} onTouch={handleTouch} />}

        {state.screen === 'menu' && (
          <KioskMenu
            onNameSearch={() => dispatch({ type: 'GOTO_NAME_SEARCH' })}
            onPlateSearch={() => dispatch({ type: 'GOTO_PLATE_SEARCH' })}
          />
        )}

        {state.screen === 'search-name' && (
          <NameSearch eid={eid} onSelect={(attendee) => dispatch({ type: 'SELECT_ATTENDEE', attendee })} />
        )}

        {state.screen === 'confirm-identity' && state.selectedAttendee && (
          <IdentityConfirm
            eid={eid}
            attendee={state.selectedAttendee}
            onConfirmed={(result) => dispatch({ type: 'CHECKIN_DONE', result })}
            onReject={() => dispatch({ type: 'REJECT_IDENTITY' })}
          />
        )}

        {state.screen === 'seat-guide' && state.checkinResult && <SeatGuide result={state.checkinResult} />}

        {state.screen === 'search-plate' && (
          <PlateSearch eid={eid} onSelect={(record) => dispatch({ type: 'SELECT_PARKING', record })} />
        )}

        {state.screen === 'park-location' && state.selectedParking && (
          <ParkLocationView record={state.selectedParking} />
        )}
      </KioskShell>
    </BrandingScope>
  );
}
