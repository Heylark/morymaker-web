interface BrandingPreviewProps {
  bgColor: string;
  pointColor: string;
  titleColor: string;
  bodyColor: string;
}

/**
 * 프리뷰 전용 고정 다크 잉크 — pointColor는 사용자가 임의로 고르는 값이라(밝은 색도 가능)
 * bodyColor 등 다른 가변색을 버튼 텍스트로 쓰면 대비가 깨질 수 있다. 무드 샘플의
 * `.btn-gold { color:#14100A }` 관용구를 그대로 계승해 항상 안전한 어두운 잉크로 고정한다.
 * 앱 전역의 `text-primary-ink` 토큰은 라이트/다크 테마에 따라 값이 바뀌므로(다크 #14100A,
 * 라이트 #FFFFFF) 쓸 수 없다 — 이 목업은 앱 테마가 아니라 사용자가 고른 bgColor 위에 얹히는
 * 카드라 테마 전환과 무관하게 항상 동일한 대비가 보장돼야 한다. 게스트 실화면 계약이 아닌
 * 프리뷰 전용 결정이다.
 */
const PREVIEW_BUTTON_INK = '#14100a';

/**
 * 선택 4색을 배경·제목·본문·포인트 버튼 4개 역할에 배치한 자족 미니 목업 — 게스트 렌더
 * 소비처가 아직 배선돼 있지 않아(색을 저장해도 반영할 화면이 없음) 실시간 임베드 대신 색
 * 배치 감각만 전달하는 카드 1개로 충실도를 제한한다. 그라데이션·`bg-clip-text`는 쓰지 않고
 * 솔리드 `color`만 사용한다 — `background` shorthand와 `bg-clip-text`를 함께 쓰면 텍스트가
 * 불투명 사각형에 가려지는 캐스케이드 함정이 있는데, 솔리드 색만 쓰면 그 함정 자체가
 * 성립하지 않는다.
 */
export function BrandingPreview({ bgColor, pointColor, titleColor, bodyColor }: BrandingPreviewProps) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-ink-muted">실제 게스트 화면 미리보기 아님 · 색상 배치 데모</p>
      <div className="flex flex-col gap-3 rounded-card border border-line-soft p-6" style={{ background: bgColor }}>
        <p className="text-lg font-semibold" style={{ color: titleColor }}>
          행사 제목 미리보기
        </p>
        <p className="text-sm" style={{ color: bodyColor }}>
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
