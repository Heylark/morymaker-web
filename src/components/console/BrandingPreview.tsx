interface BrandingPreviewProps {
  bgColor: string;
  pointColor: string;
}

/**
 * 프리뷰 전용 고정 잉크 — bgColor·pointColor는 사용자가 임의로 고르는 값이라(밝은 색도 가능)
 * 그 위에 얹히는 제목·본문·버튼 텍스트를 가변색으로 두면 대비가 깨질 수 있다. 무드 샘플의
 * `.btn-gold { color:#14100A }` 관용구를 그대로 계승해 항상 안전한 고정 톤으로 표시한다(제목·
 * 본문 잉크는 예전에 편집 가능했던 titleColor·bodyColor 기본값을 그대로 승계 — 공개 뷰가 그
 * 두 색을 소비한 적이 없어 편집 UI만 걷어내고 화면 톤은 바꾸지 않는다). 앱 전역의
 * `text-primary-ink` 등 테마 토큰은 라이트/다크에 따라 값이 바뀌므로(다크 #14100A, 라이트
 * #FFFFFF) 쓸 수 없다 — 이 목업은 앱 테마가 아니라 사용자가 고른 bgColor 위에 얹히는 카드라
 * 테마 전환과 무관하게 항상 동일한 대비가 보장돼야 한다. 게스트 실화면 계약이 아닌 프리뷰
 * 전용 결정이다.
 */
const PREVIEW_BUTTON_INK = '#14100a';
const PREVIEW_TITLE_INK = '#f0dca8';
const PREVIEW_BODY_INK = '#ede9e0';

/**
 * 선택 2색(배경·포인트)을 배경·포인트 버튼 역할에 배치한 자족 미니 목업 — 게스트 렌더 소비처가
 * 아직 배선돼 있지 않아(색을 저장해도 반영할 화면이 없음) 실시간 임베드 대신 색 배치 감각만
 * 전달하는 카드 1개로 충실도를 제한한다. 제목·본문은 공개 뷰가 소비한 적 없는 titleColor·
 * bodyColor 편집 UI를 걷어낸 자리라 고정 잉크로 표시한다(위 주석 참조). 그라데이션·
 * `bg-clip-text`는 쓰지 않고 솔리드 `color`만 사용한다 — `background` shorthand와
 * `bg-clip-text`를 함께 쓰면 텍스트가 불투명 사각형에 가려지는 캐스케이드 함정이 있는데,
 * 솔리드 색만 쓰면 그 함정 자체가 성립하지 않는다.
 */
export function BrandingPreview({ bgColor, pointColor }: BrandingPreviewProps) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-ink-muted">실제 게스트 화면 미리보기 아님 · 색상 배치 데모</p>
      <div className="flex flex-col gap-3 rounded-card border border-line-soft p-6" style={{ background: bgColor }}>
        <p className="text-lg font-semibold" style={{ color: PREVIEW_TITLE_INK }}>
          행사 제목 미리보기
        </p>
        <p className="text-sm" style={{ color: PREVIEW_BODY_INK }}>
          행사 부제·안내 문구가 이 자리에 표시됩니다.
        </p>
        <span
          className="w-fit rounded-card px-4 py-2 text-sm font-semibold"
          style={{ background: pointColor, color: PREVIEW_BUTTON_INK }}
        >
          참석 확인
        </span>
      </div>
    </div>
  );
}
