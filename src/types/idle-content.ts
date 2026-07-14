/**
 * 관리자 콘솔 대기화면 콘텐츠(ADM-04) 요청 타입 — 실측 api DTO 미러(spec 예시 아님).
 * 응답은 신규 타입을 만들지 않고 키오스크 소비측 `types/kiosk.ts IdleContent`를 재사용한다
 * (콘솔 admin 경로와 키오스크 공개 경로가 실측상 같은 응답 DTO를 공유한다).
 *
 * create/update 필드셋은 서버 계약이 비대칭이다: 등록은 name·kind가 필수이고 mode·play·
 * sortOrder를 옵션으로 받지만, 수정은 반대로 name·kind·fileUrl을 받지 않는다(불변 — 등록 후
 * 변경 불가). 컬러 4종을 EventCreate/UpdateRequest에서 구조적으로 제외한 console.ts 선례와
 * 동일 정신으로, update 타입에서 name·kind를 타입 레벨에서 제외해 실수로 불변 필드를 채워
 * 보내는 코드 자체가 컴파일되지 않게 막는다.
 */

// POST /api/events/{eid}/idle-contents → 201 {data: IdleContent}
export interface IdleContentCreateRequest {
  name: string; // 필수
  kind: string; // '이미지' | '영상' — 한글 리터럴, kiosk.ts IdleContent.kind와 동일 정신(union 강제 안 함)
  mode?: string | null; // 'branded' | 'fullbleed' | null
  play?: string | null; // 한글 자유 텍스트('자동재생'…) — union 절대 금지(kiosk.ts 주석 준수)
  sortOrder: number;
}

// PUT /api/events/{eid}/idle-contents/{cid} → 200 {data: IdleContent}
// name·kind·fileUrl 불변 — 이 3필드는 타입에서 아예 제외한다(전송 자체가 불가능하게).
export interface IdleContentUpdateRequest {
  mode?: string | null;
  play?: string | null;
  sortOrder?: number;
}
