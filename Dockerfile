# web/Dockerfile — Next.js standalone(BFF Route Handler 다수라 정적 export 불가) 3-stage 이미지.
# deps(의존성 fresh install) → builder(basePath 빌드타임 인라인) → runner(non-root 실행)
# ────────────────────────────────────────────────────────────────────
# stage 1: deps
# host node_modules(darwin-arm64 네이티브 바이너리)를 그대로 COPY하면 linux 빌더를 clobber해
# 빌드는 통과하고 런타임에만 invalid ELF header로 조용히 크래시한다 — 이 스테이지의 fresh
# install이 유일한 방어선이다. package.json·pnpm-lock.yaml만 먼저 COPY해 소스 변경 시에도
# 이 레이어는 캐시로 남는다.
# ────────────────────────────────────────────────────────────────────
FROM node:24.18.0-alpine3.24 AS deps

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.30.3 --activate

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# ────────────────────────────────────────────────────────────────────
# stage 2: builder
# basePath(NEXT_PUBLIC_BASE_PATH)는 Next.js DefinePlugin이 클라 번들에 굽는 빌드타임 상수라
# 런타임 env로 바꿀 수 없다 — 이 스테이지에서 값을 확정하지 못하면 배포 아티팩트가 영구히
# basePath='' 로 굳는다. ARG는 의도적으로 기본값을 두지 않는다: 기본값을 주면 --build-arg를
# 빠뜨려도 조용히 성공해버려 "누락 시 명시 실패"라는 방어 목적 자체가 무력화된다.
# ────────────────────────────────────────────────────────────────────
FROM node:24.18.0-alpine3.24 AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.30.3 --activate

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 기본값 없음 — 누락(빈 문자열)·오타(선행 슬래시 없음)·bare "/"(무의미 basePath) 세 실패
# 모드를 하나의 case로 봉인한다. 시크릿(AUTH_*·API_*)은 이 스테이지에 ARG/ENV로 절대 넣지
# 않는다 — 이미지 레이어에 영구 박제되는 leak이라 런타임 env로만 주입한다.
ARG NEXT_PUBLIC_BASE_PATH
RUN case "${NEXT_PUBLIC_BASE_PATH}" in \
      /?*) : ;; \
      *) echo "FATAL: NEXT_PUBLIC_BASE_PATH must be passed as --build-arg and start with '/' (got: '${NEXT_PUBLIC_BASE_PATH}'). e.g. --build-arg NEXT_PUBLIC_BASE_PATH=/app" >&2; exit 1 ;; \
    esac
ENV NEXT_PUBLIC_BASE_PATH=${NEXT_PUBLIC_BASE_PATH}
ENV NEXT_TELEMETRY_DISABLED=1

RUN pnpm build

# ────────────────────────────────────────────────────────────────────
# stage 3: runner
# .next/standalone(런타임에 필요한 의존성만 trace된 self-contained 산출물) + .next/static만
# 옮긴다 — 빌드 도구(pnpm·devDependencies·소스)는 여기 넘어가지 않는다.
# public/ 미존재(실측 — 정적 자산 0건) → COPY 라인 없음. 자산 도입 시 COPY 라인 추가할 것.
# ────────────────────────────────────────────────────────────────────
FROM node:24.18.0-alpine3.24 AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
# 0.0.0.0 필수 — standalone 기본 바인드(127.0.0.1)로 두면 컨테이너 내부 loopback
# HEALTHCHECK는 통과하는데 httpd ProxyPass 등 외부 접근만 조용히 refused된다.
ENV HOSTNAME=0.0.0.0

COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static

USER node

EXPOSE 3000

# basePath=/app이라 GET / 는 404 — 앱 루트는 /app 하위에서 서빙된다(playwright webServer
# 레디니스 폴링과 동일 좌표계). 판정은 docker inspect health status로만 단언할 것(호스트
# curl 갈음 금지 — busybox wget 변종별 --spider 거동 차이를 흡수한다).
HEALTHCHECK --start-period=10s --interval=30s --timeout=3s --retries=3 \
  CMD wget -q --spider http://localhost:3000/app || exit 1

ENTRYPOINT ["node", "server.js"]
