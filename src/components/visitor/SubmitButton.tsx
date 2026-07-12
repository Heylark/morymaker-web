import { Button } from '@/components/shared/Button';

interface SubmitButtonProps {
  pending: boolean;
  children: React.ReactNode;
}

/**
 * 폼 제출 버튼(공용 — 사전등록·현장등록 두 폼 공유). 골드 CTA primitive를 소비한다.
 * 최소 터치 타깃(44px)은 primitive 자체 패딩으로도 충족되나, 현장 장갑·거리 고려 원칙(§터치 타깃)을
 * 명시적으로 보장하기 위해 min-h-touch를 얹는다.
 */
export function SubmitButton({ pending, children }: SubmitButtonProps) {
  return (
    <Button type="submit" variant="gold" disabled={pending} className="min-h-touch disabled:opacity-50">
      {children}
    </Button>
  );
}
