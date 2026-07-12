'use client';

import { useRef, useState } from 'react';
import { useSmsTemplate } from '@/hooks/useSmsTemplate';
import { useUpdateSmsTemplate } from '@/hooks/useUpdateSmsTemplate';
import { TokenPalette, insertTokenAtCursor } from './TokenPalette';
import type { SmsTemplateResponse } from '@/types/sms';

interface TemplateEditorProps {
  eid: string;
}

/** 템플릿 로드 게이트 — 로드 완료 후에만 `TemplateForm`을 마운트해 로컬 textarea state를 안전하게 시드한다. */
export function TemplateEditor({ eid }: TemplateEditorProps) {
  const { data: template, isLoading, isError } = useSmsTemplate(eid);

  if (isLoading) return <p className="text-ink-muted">불러오는 중...</p>;
  if (isError || !template) return <p className="text-danger">템플릿을 불러오지 못했습니다.</p>;

  return <TemplateForm eid={eid} template={template} />;
}

interface TemplateFormProps {
  eid: string;
  template: SmsTemplateResponse;
}

/**
 * `template`이 이미 로드된 뒤에만 마운트되므로(부모 게이트) textarea 로컬 state를
 * `template.body`로 안전하게 시드할 수 있다 — App Router `router.refresh()` 재유입 stale
 * 문제와 무관한 경로(react.md §2 방식 b — 저장 성공 시 반환값으로 재동기화하지 않고, 애초에
 * 사용자가 편집 중인 로컬 텍스트를 서버 재조회로 덮어쓰지 않는 편이 편집 UX에 맞다).
 */
function TemplateForm({ eid, template }: TemplateFormProps) {
  const [body, setBody] = useState(template.body);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const updateMutation = useUpdateSmsTemplate(eid);

  const handleInsert = (token: string) => {
    const cursor = textareaRef.current?.selectionStart ?? body.length;
    const { text, nextCursor } = insertTokenAtCursor(body, token, cursor);
    setBody(text);
    requestAnimationFrame(() => {
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(nextCursor, nextCursor);
    });
  };

  const handleSave = async () => {
    await updateMutation.mutateAsync({ body });
  };

  return (
    <div className="flex flex-col gap-3 rounded-card border border-line-soft bg-surface p-4">
      <h3 className="text-desk font-semibold text-ink">초대 문자 템플릿</h3>
      {template.updatedAt === null && body === '' && (
        <p className="text-sm text-ink-muted">아직 작성 안 함 — 아래에서 문구를 작성해 주세요.</p>
      )}

      <TokenPalette variables={template.variables} onInsert={handleInsert} />

      <textarea
        ref={textareaRef}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={6}
        className="min-h-32 rounded-card border border-line p-4 text-desk"
        placeholder="예: [$참석자]님, [$행사명]에 초대합니다. 아래 QR로 입장해 주세요. [$QR링크]"
      />
      {/* [$QR링크]는 서버가 이미 풀 URL로 치환 — 스킴을 별도로 덧붙이면 이중 스킴(사실 I) */}
      <p className="text-xs text-ink-muted">
        [$QR링크]는 이미 전체 주소로 치환됩니다 — 앞에 https:// 등 별도 스킴을 붙이지 마세요.
      </p>

      <button
        type="button"
        onClick={handleSave}
        disabled={updateMutation.isPending || body.trim() === ''}
        className="min-h-touch w-fit rounded-card bg-primary px-6 text-desk font-semibold text-primary-ink disabled:opacity-50"
      >
        {updateMutation.isPending ? '저장 중...' : '저장'}
      </button>
      {updateMutation.isError && <p className="text-sm text-danger">저장 중 오류가 발생했습니다.</p>}
      {updateMutation.isSuccess && <p className="text-sm text-ink">저장되었습니다.</p>}
    </div>
  );
}
