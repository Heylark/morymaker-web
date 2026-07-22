import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE_AUTH, decodeAuthCookieNode } from "@/lib/cookies";

/**
 * 루트 진입 세션 분기(§1 시나리오1·2) — 루트는 딥링크가 아니므로 returnTo를 붙이지 않는다.
 * 역할은 판정하지 않는다 — `/landing` 자체 게이트(STAFF_ROLES)가 FORBIDDEN 처리를 담당한다
 * (미인증/역할을 여기서 겹쳐 판정하면 §4 "계층 책임 분리"가 깨져 리다이렉트 경로가 갈라진다).
 */
export default async function RootPage() {
  const cookieStore = await cookies();
  const auth = cookieStore.get(COOKIE_AUTH);
  const payload = auth ? decodeAuthCookieNode(auth.value) : null;

  if (payload) {
    redirect("/landing");
  }
  redirect("/oauth/login");
}
