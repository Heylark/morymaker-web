import { Chip } from '@/components/shared/Chip';

/**
 * 커서 위치에 토큰 문자열을 삽입한 결과를 계산하는 순수 함수 — 렌더 없이 단위 테스트 가능하다.
 * 삽입 후 커서는 삽입된 토큰 바로 뒤로 이동한다(연속 삽입 시 자연스러운 이어쓰기).
 */
export function insertTokenAtCursor(
  value: string,
  token: string,
  cursorPos: number,
): { text: string; nextCursor: number } {
  const safePos = Math.max(0, Math.min(cursorPos, value.length));
  const text = value.slice(0, safePos) + token + value.slice(safePos);
  return { text, nextCursor: safePos + token.length };
}

interface TokenPaletteProps {
  /** 서버 응답(`SmsTemplateResponse.variables`) 소비 — 하드코딩 금지(SmsRenderer 정규식과 drift 방지). */
  variables: string[];
  onInsert: (token: string) => void;
}

/** 변수 토큰 팔레트 — 클릭 시 부모(TemplateEditor)가 보유한 커서 위치에 삽입한다. */
export function TokenPalette({ variables, onInsert }: TokenPaletteProps) {
  if (variables.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {variables.map((token) => (
        <button key={token} type="button" onClick={() => onInsert(token)}>
          <Chip>{token}</Chip>
        </button>
      ))}
    </div>
  );
}
