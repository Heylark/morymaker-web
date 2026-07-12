'use client';

import { useState } from 'react';
import { PLATE_TAIL_PATTERN } from '@/lib/kiosk/constants';

interface PlatePadProps {
  onSubmit: (plateTail: string) => void;
  pending?: boolean;
}

const PAD_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '지움', '0', '←'] as const;

/**
 * 차량 뒷자리 4자리 온스크린 숫자 키패드 — 숫자는 자모 조합이 없어 신설이 자명하다(한글
 * 이름검색의 OS 키보드 의존과 달리 이 컴포넌트는 결정 무관 신설).
 */
export function PlatePad({ onSubmit, pending = false }: PlatePadProps) {
  const [value, setValue] = useState('');
  const isValid = PLATE_TAIL_PATTERN.test(value);

  function handleKey(key: (typeof PAD_KEYS)[number]) {
    if (key === '지움') {
      setValue('');
      return;
    }
    if (key === '←') {
      setValue((prev) => prev.slice(0, -1));
      return;
    }
    setValue((prev) => (prev.length < 4 ? prev + key : prev));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isValid) onSubmit(value);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col items-center gap-6">
      <p className="text-desk-lg font-semibold tracking-[0.5em] text-ink" aria-live="polite">
        {value.padEnd(4, '_')}
      </p>
      <div className="grid grid-cols-3 gap-3">
        {PAD_KEYS.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => handleKey(key)}
            className="min-h-touch w-20 rounded-card bg-surface text-desk-lg font-semibold text-ink shadow-sm ring-1 ring-black/5"
          >
            {key}
          </button>
        ))}
      </div>
      <button
        type="submit"
        disabled={pending || !isValid}
        className="min-h-touch w-full rounded-card bg-primary px-6 text-desk font-semibold text-primary-ink disabled:opacity-50"
      >
        {pending ? '조회 중...' : '조회'}
      </button>
    </form>
  );
}
