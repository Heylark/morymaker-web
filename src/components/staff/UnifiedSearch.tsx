'use client';

import { useState } from 'react';

interface UnifiedSearchProps {
  onSearch: (q: string) => void;
  placeholder?: string;
}

/** 이름∪차량번호 한 칸 검색 입력 — HLP-01 본문과 SCN-00 이름검색 폴백이 공유한다. */
export function UnifiedSearch({ onSearch, placeholder = '이름 또는 차량번호' }: UnifiedSearchProps) {
  const [value, setValue] = useState('');

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSearch(value);
      }}
      className="flex gap-2"
    >
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="min-h-touch flex-1 rounded-card border border-line bg-surface px-4 text-desk text-ink"
      />
      <button
        type="submit"
        className="min-h-touch rounded-card bg-primary px-6 text-desk font-semibold text-primary-ink"
      >
        검색
      </button>
    </form>
  );
}
