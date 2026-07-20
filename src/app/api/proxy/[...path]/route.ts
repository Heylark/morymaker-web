import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { API_BASE, AUTH_API_BASE } from '@/lib/api';
import {
  COOKIE_ACCESS_TOKEN,
  COOKIE_AUTH,
  COOKIE_EXPIRE_OPTIONS,
  COOKIE_REFRESH_TOKEN,
  SESSION_COOKIE_OPTIONS,
} from '@/lib/cookies';
import { getAuthMode } from '@/lib/api-auth-mode';
import { getJwtExp } from '@/lib/tokens';
import { refreshTokens } from '@/lib/auth-refresh';

/**
 * BFF 프록시 Route Handler — /api/proxy/[...path]
 *
 * HttpOnly 쿠키(mm_access_token)는 브라우저 JS가 읽을 수 없으므로, 이 핸들러가 쿠키를 읽어
 * Authorization: Bearer 헤더를 부착한 뒤 api에 전달한다. 3분법(PRIVATE/HYBRID/PUBLIC) 판정에
 * 따라 토큰 처리 경로가 갈린다 — 상세는 lib/api-auth-mode.ts 참조.
 *
 * 회전 계약: auth가 reuseRefreshTokens=false라 refresh 성공 시 access·refresh 쿠키를 반드시
 * 함께 갱신한다(하나만 갱신하면 다음 refresh가 소비된 옛 토큰을 재제시해 family-kill로 이어진다).
 */

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

const HEADERS_TO_REMOVE = new Set(['content-encoding', 'transfer-encoding', 'content-length']);

/**
 * auth 서버가 소유한 경로 프리픽스 — 이 목록에 매칭되면 업스트림을 api 대신 auth로 분기한다.
 * 신규 auth 도메인 REST 경로를 추가할 때는 이 배열을 갱신해야 한다(SSOT). 매칭 안 되는 경로는
 * 전부 기존 API_BASE로 흘러 api 경로 동작이 불변으로 유지된다(fail-safe — 오타는 api로 가서
 * 404로 시끄럽게 실패할 뿐, auth로 조용히 오배송되지 않는다).
 */
const AUTH_PROXY_PREFIXES = ['api/accounts'] as const;

/**
 * targetPath 프리픽스로 업스트림 base를 분기한다. 정확히 일치하거나 '/'로 이어지는 하위 경로만
 * 매칭한다(예: 'api/accounts-x'는 'api/accounts'로 시작하지만 오매칭되지 않는다 — 경계 매칭).
 */
function resolveUpstreamBase(targetPath: string): string {
  const isAuthOwned = AUTH_PROXY_PREFIXES.some(
    (prefix) => targetPath === prefix || targetPath.startsWith(`${prefix}/`),
  );
  return isAuthOwned ? AUTH_API_BASE! : API_BASE!;
}

/** exp 클레임 기준 만료 판정 — 클레임 부재/malformed(exp=0)는 안전하게 "이미 만료"로 취급한다(fail-closed). */
function isTokenExpired(token: string): boolean {
  const exp = getJwtExp(token);
  if (exp === 0) return true;
  return Date.now() >= exp * 1000;
}

/** upstream 응답 헤더 중 HEADERS_TO_REMOVE를 제외하고 복사한다(gzip/chunked 이중 처리 방지). */
function buildResponseHeaders(upstream: Response): Headers {
  const headers = new Headers();
  upstream.headers.forEach((value, key) => {
    if (!HEADERS_TO_REMOVE.has(key.toLowerCase())) {
      headers.set(key, value);
    }
  });
  return headers;
}

/** PRIVATE 인증 만료/실패 시 공통 응답 — 인증 쿠키 3종 삭제 + 401(즉시 로그아웃 유도, fail-closed). */
function unauthorizedResponse(message: string): NextResponse {
  const res = NextResponse.json({ error: message }, { status: 401 });
  res.cookies.set(COOKIE_AUTH, '', COOKIE_EXPIRE_OPTIONS);
  res.cookies.set(COOKIE_ACCESS_TOKEN, '', COOKIE_EXPIRE_OPTIONS);
  res.cookies.set(COOKIE_REFRESH_TOKEN, '', COOKIE_EXPIRE_OPTIONS);
  return res;
}

async function proxyRequest(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
): Promise<NextResponse> {
  const { path } = await context.params;
  const targetPath = path.join('/');
  const targetUrl = `${resolveUpstreamBase(targetPath)}/${targetPath}${request.nextUrl.search}`;

  const mode = getAuthMode(targetPath, request.method);

  // ─── PUBLIC: 토큰 기계 완전 skip → plain passthrough (메서드 무관 — 공개 쓰기 포함) ─────
  if (mode === 'public') {
    const requestHeaders: Record<string, string> = {};
    const contentType = request.headers.get('content-type');
    if (contentType) requestHeaders['Content-Type'] = contentType;

    // 공개 쓰기(POST 사전등록·현장등록 등)도 body를 upstream에 전달해야 한다 — 누락 시
    // 인증은 통과하지만 api가 필수 필드 누락(400)으로 거부한다.
    const hasBody = request.method !== 'GET' && request.method !== 'HEAD';
    let bodyBuffer: Buffer | undefined;
    if (hasBody) {
      try {
        bodyBuffer = Buffer.from(await request.arrayBuffer());
      } catch (err) {
        console.error(`[Proxy] 요청 본문 읽기 실패: ${request.method} ${targetPath}`, err);
        return NextResponse.json({ error: '요청 본문 읽기 실패' }, { status: 400 });
      }
    }

    let upstream: Response;
    try {
      upstream = await fetch(targetUrl, {
        method: request.method,
        headers: requestHeaders,
        cache: 'no-store',
        ...(bodyBuffer !== undefined ? { body: bodyBuffer as BodyInit } : {}),
      });
    } catch (err) {
      console.error(`[Proxy] 업스트림 요청 실패: ${request.method} ${targetPath}`, err);
      return NextResponse.json({ error: '업스트림 서버 연결 실패' }, { status: 502 });
    }

    const publicResponse = new NextResponse(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: buildResponseHeaders(upstream),
    });
    // PUBLIC 응답은 토큰·개인정보가 섞인 응답(허브 조회 등)일 수 있어 공유 캐시 누출을 막기 위해
    // no-store를 균일 강제한다(PRIVATE/HYBRID와 동일 위생 — 순수 정적 공개 GET도 예외 없음).
    publicResponse.headers.set('Cache-Control', 'no-store');
    return publicResponse;
  }

  // ─── PRIVATE / HYBRID: 토큰 처리 공통 경로 ─────────────────────────────────────
  const cookieStore = await cookies();
  let token = cookieStore.get(COOKIE_ACCESS_TOKEN)?.value;

  // PRIVATE 미인증 — 상류 호출 없이 즉시 401(Bearer 없는 요청을 api에 흘리지 않는다)
  if (mode === 'private' && !token) {
    return unauthorizedResponse('인증이 필요합니다.');
  }

  let proactiveRefreshDone = false;
  // proactive 회전 시 새 refresh_token도 함께 보관해뒀다가 응답 쿠키에 반영한다(회전 계약 — 아래 참고).
  let rotatedRefreshToken: string | undefined;
  if (token && isTokenExpired(token)) {
    const refreshTokenValue = cookieStore.get(COOKIE_REFRESH_TOKEN)?.value;
    if (!refreshTokenValue) {
      if (mode === 'hybrid') {
        token = undefined; // 익명 재시도로 graceful degradation
      } else {
        return unauthorizedResponse('인증이 만료되었습니다.');
      }
    } else {
      const tokenSet = await refreshTokens(refreshTokenValue);
      if (tokenSet) {
        token = tokenSet.accessToken;
        rotatedRefreshToken = tokenSet.refreshToken;
        proactiveRefreshDone = true;
      } else if (mode === 'hybrid') {
        token = undefined;
      } else {
        return unauthorizedResponse('인증이 만료되었습니다.');
      }
    }
  }

  const requestHeaders: Record<string, string> = {};
  const contentType = request.headers.get('content-type');
  if (contentType) requestHeaders['Content-Type'] = contentType;
  if (token) requestHeaders['Authorization'] = `Bearer ${token}`;

  // body 버퍼링 — 재시도(reactive refresh)에 재사용하기 위해 미리 읽어둔다. GET/HEAD는 body 없음.
  const hasBody = request.method !== 'GET' && request.method !== 'HEAD';
  let bodyBuffer: Buffer | undefined;
  if (hasBody) {
    try {
      bodyBuffer = Buffer.from(await request.arrayBuffer());
    } catch (err) {
      console.error(`[Proxy] 요청 본문 읽기 실패: ${request.method} ${targetPath}`, err);
      return NextResponse.json({ error: '요청 본문 읽기 실패' }, { status: 400 });
    }
  }

  let upstream: Response;
  try {
    upstream = await fetch(targetUrl, {
      method: request.method,
      headers: requestHeaders,
      cache: 'no-store',
      // Buffer는 런타임에서 BodyInit로 유효하나(Uint8Array 상위 타입), lib.dom.d.ts가 Node Buffer의
      // 제네릭 시그니처를 인식하지 못해 타입 단정이 필요하다.
      ...(bodyBuffer !== undefined ? { body: bodyBuffer as BodyInit } : {}),
    });
  } catch (err) {
    console.error(`[Proxy] 업스트림 요청 실패: ${request.method} ${targetPath}`, err);
    return NextResponse.json({ error: '업스트림 서버 연결 실패' }, { status: 502 });
  }

  // reactive: 선제 refresh를 뚫고 401 — 이번 요청에서 아직 refresh를 안 했을 때만 1회 시도
  if (upstream.status === 401 && token && !proactiveRefreshDone) {
    const refreshTokenValue = cookieStore.get(COOKIE_REFRESH_TOKEN)?.value;
    if (refreshTokenValue) {
      const tokenSet = await refreshTokens(refreshTokenValue);
      if (tokenSet) {
        const retryHeaders = { ...requestHeaders, Authorization: `Bearer ${tokenSet.accessToken}` };
        let retryUpstream: Response;
        try {
          retryUpstream = await fetch(targetUrl, {
            method: request.method,
            headers: retryHeaders,
            cache: 'no-store',
            ...(bodyBuffer !== undefined ? { body: bodyBuffer as BodyInit } : {}),
          });
        } catch (err) {
          console.error(`[Proxy] 업스트림 재시도 요청 실패: ${request.method} ${targetPath}`, err);
          return NextResponse.json({ error: '업스트림 서버 연결 실패' }, { status: 502 });
        }

        const retryResponse = new NextResponse(retryUpstream.body, {
          status: retryUpstream.status,
          statusText: retryUpstream.statusText,
          headers: buildResponseHeaders(retryUpstream),
        });
        retryResponse.headers.set('Cache-Control', 'no-store');
        // 회전 계약 — access·refresh 동시 갱신(하나만 갱신하면 다음 refresh가 소비된 토큰을 재제시)
        retryResponse.cookies.set(COOKIE_ACCESS_TOKEN, tokenSet.accessToken, SESSION_COOKIE_OPTIONS);
        retryResponse.cookies.set(COOKIE_REFRESH_TOKEN, tokenSet.refreshToken, SESSION_COOKIE_OPTIONS);
        return retryResponse;
      }
    }
    // refresh 실패 또는 refresh_token 없음
    if (mode === 'hybrid') {
      try {
        const anonHeaders: Record<string, string> = {};
        if (contentType) anonHeaders['Content-Type'] = contentType;
        const anonUpstream = await fetch(targetUrl, {
          method: request.method,
          headers: anonHeaders,
          cache: 'no-store',
        });
        const anonResponse = new NextResponse(anonUpstream.body, {
          status: anonUpstream.status,
          statusText: anonUpstream.statusText,
          headers: buildResponseHeaders(anonUpstream),
        });
        anonResponse.headers.set('Cache-Control', 'no-store');
        return anonResponse;
      } catch (err) {
        console.error(`[Proxy] HYBRID 익명 재시도 실패: ${request.method} ${targetPath}`, err);
        return NextResponse.json({ error: '업스트림 서버 연결 실패' }, { status: 502 });
      }
    }
    return unauthorizedResponse('인증이 만료되었습니다.');
  }

  const finalResponse = new NextResponse(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: buildResponseHeaders(upstream),
  });
  // 재발버그 #5 — PRIVATE/HYBRID 응답이 브라우저·shared 캐시에 남아 다른 사용자에게 누출되는 것을 차단
  finalResponse.headers.set('Cache-Control', 'no-store');
  if (proactiveRefreshDone && token && rotatedRefreshToken) {
    // 회전 계약 — access·refresh 동시 갱신(하나만 갱신하면 다음 refresh가 소비된 토큰을 재제시)
    finalResponse.cookies.set(COOKIE_ACCESS_TOKEN, token, SESSION_COOKIE_OPTIONS);
    finalResponse.cookies.set(COOKIE_REFRESH_TOKEN, rotatedRefreshToken, SESSION_COOKIE_OPTIONS);
  }
  return finalResponse;
}

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const PATCH = proxyRequest;
export const DELETE = proxyRequest;
