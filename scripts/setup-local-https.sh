#!/usr/bin/env bash
# 로컬 HTTPS 인증서 발급 — mkcert 신뢰 CA로 localhost + 개발머신 LAN IP를 SAN에 담은
# 인증서를 certs/ 아래 생성한다. getUserMedia(카메라)는 secure context 필수라
# 데스크톱은 localhost 예외로 충분하지만, 모바일 실기기는 LAN IP 접근이라 신뢰 인증서가 없으면
# 브라우저가 카메라 권한 자체를 막는다.
#
# 사용법: scripts/setup-local-https.sh
# 재실행해도 안전(mkcert -install은 이미 설치된 CA를 건드리지 않고, 인증서는 매번 최신 LAN IP로 재생성).
set -euo pipefail

if ! command -v mkcert >/dev/null 2>&1; then
  echo "mkcert가 설치되어 있지 않습니다. macOS: brew install mkcert" >&2
  exit 1
fi

CERT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/certs"
mkdir -p "$CERT_DIR"

# 로컬 신뢰 CA 등록 — 이미 등록돼 있으면 즉시 반환(멱등).
# macOS 시스템 키체인 등록은 sudo 대화형 암호를 요구해 비대화형 세션(CI·에이전트)에서는 실패할 수 있다 —
# 그 경우도 CA 자체는 생성되어 아래 인증서 발급은 계속 진행하고, 트러스트 등록만 사용자가 터미널에서
# `mkcert -install`을 직접 재실행해 완료해야 한다(브라우저가 신뢰하지 않으면 방문 시 경고가 뜬다).
if ! mkcert -install 2>&1; then
  echo "⚠️  mkcert -install 이 시스템 키체인 등록에 실패했습니다(대화형 sudo 암호 필요) — 인증서 발급은 계속 진행합니다."
  echo "   브라우저 신뢰 경고가 보이면 터미널에서 'mkcert -install'을 직접 실행해 완료하세요."
fi

# 개발머신 LAN IP 자동 감지(macOS en0 우선, 실패 시 무시하고 localhost/127.0.0.1만 발급)
LAN_IP="$(ipconfig getifaddr en0 2>/dev/null || true)"

SAN_LIST=(localhost 127.0.0.1 ::1)
if [ -n "$LAN_IP" ]; then
  SAN_LIST+=("$LAN_IP")
fi

mkcert -cert-file "$CERT_DIR/dev-cert.pem" -key-file "$CERT_DIR/dev-key.pem" "${SAN_LIST[@]}"

echo ""
echo "인증서 생성 완료: $CERT_DIR/dev-cert.pem, $CERT_DIR/dev-key.pem"
echo "SAN: ${SAN_LIST[*]}"
echo ""
echo "실행: pnpm dev:https  (기본 포트 3000, https://localhost:3000)"
if [ -n "$LAN_IP" ]; then
  echo ""
  echo "실기기(태블릿·폰) 접근 절차:"
  echo "  1. 테스트 기기가 개발머신과 같은 Wi-Fi(LAN)에 연결돼 있어야 한다."
  echo "  2. 테스트 기기에 mkcert 루트 CA를 1회 설치한다 — 아래 경로 파일을 기기로 전송(AirDrop 등) 후 설치:"
  echo "       $(mkcert -CAROOT)/rootCA.pem"
  echo "     iOS: 파일 열기 → 프로필 설치 → 설정 > 일반 > 정보 > 인증서 신뢰 설정에서 완전 신뢰로 전환까지 필요."
  echo "     Android: 설정 > 보안 > 인증서 설치 > CA 인증서로 설치."
  echo "  3. 기기 브라우저에서 https://$LAN_IP:3000 접속."
  echo ""
  echo "  대안(신속한 스모크 테스트 — 루트 CA 설치 생략): cloudflared 또는 ngrok으로 공인 HTTPS 터널을 열어"
  echo "  그 URL로 접속한다(신뢰 인증서를 즉시 발급받으므로 기기측 CA 설치 불요, 단 매 실행마다 URL이 바뀔 수 있다)."
else
  echo ""
  echo "LAN IP를 자동 감지하지 못했습니다(en0 비활성?) — 실기기 테스트 시 수동으로 IP를 확인해 이 스크립트를 다시 실행하세요."
fi
