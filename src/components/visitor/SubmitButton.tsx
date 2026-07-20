import { Button } from '@/components/shared/Button';

interface SubmitButtonProps {
  pending: boolean;
  children: React.ReactNode;
  /** gold(기본) = 화면의 유일한 발광 CTA(T3) / ghost = 발광 없는 보조 행동(VIS-00 차량 사전등록
   *  미니폼 전용 — 체크인 QR의 T1 발광 예산과 충돌하지 않도록 이 버튼은 발광하지 않는다). */
  tone?: 'gold' | 'ghost';
}

/**
 * 폼 제출 버튼(공용 — 사전등록·현장등록·셀프주차 폼 공유). 골드 CTA primitive를 소비한다.
 * 최소 터치 타깃(44px)은 primitive 자체 패딩으로도 충족되나, 현장 장갑·거리 고려 원칙(§터치 타깃)을
 * 명시적으로 보장하기 위해 min-h-touch를 얹는다.
 */
export function SubmitButton({ pending, children, tone = 'gold' }: SubmitButtonProps) {
  if (tone === 'ghost') {
    return (
      <Button type="submit" variant="ghost" disabled={pending} className="min-h-touch disabled:opacity-50">
        {children}
      </Button>
    );
  }
  return (
    <Button type="submit" variant="gold" glow disabled={pending} className="min-h-touch disabled:opacity-50">
      {children}
    </Button>
  );
}
