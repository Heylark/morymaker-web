'use client';

import { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { parseCheckinToken } from '@/lib/qr-url';

// BarcodeDetector는 아직 표준 lib.dom.d.ts에 포함되지 않아 최소 타입을 직접 선언한다
// (일부 브라우저만 네이티브 지원 — 미지원 브라우저는 아래 jsQR 폴백 경로를 탄다).
interface BarcodeDetectorLike {
  detect(source: CanvasImageSource): Promise<Array<{ rawValue: string }>>;
}
interface BarcodeDetectorConstructorLike {
  new (options: { formats: string[] }): BarcodeDetectorLike;
}

interface QrScannerProps {
  /** 'user'(전면·셀카, 체크인 데스크 기본값) | 'environment'(후면, 향후 자리 QR 스캔 재사용) */
  facingMode?: 'user' | 'environment';
  /** validate 통과 결과(예: 체크인 토큰)를 전달한다 — 디코딩 원문이 아니라 파싱된 값이다. */
  onDecode: (value: string) => void;
  /** 디코딩 원문(URL 문자열)을 검증·파싱한다. 기본값은 체크인 QR(`/u/{token}`) 전용 검증기. */
  validate?: (rawText: string) => string | null;
  /** 카메라 권한 거부 시 — 호출부가 이름검색 등 수동 폴백 UI로 전환한다. */
  onPermissionDenied?: () => void;
  onError?: (e: Error) => void;
  /** true면 인식을 일시정지한다(결과 화면 표시 중 재인식 방지) — 스트림은 유지, 디코딩만 멈춘다. */
  paused?: boolean;
}

/**
 * 브라우저 카메라 QR 스캐너 — 코드베이스 최초 구현(0→1). BarcodeDetector 네이티브 우선,
 * 미지원(Safari·Firefox)은 <video>→<canvas>→getImageData→jsQR 폴백으로 동일 기능을 제공한다.
 *
 * 생명주기: 마운트 시 getUserMedia로 스트림을 확보하고, 언마운트(라우트 이탈) 시 반드시
 * track.stop()으로 카메라 LED를 끄고 전력을 아낀다 — 데스크 상시 운영 예외는 1차 미채택
 * (단순함 우선, 필요해지면 이 컴포넌트 밖에서 파생 결정).
 */
export function QrScanner({
  facingMode = 'user',
  onDecode,
  validate,
  onPermissionDenied,
  onError,
  paused = false,
}: QrScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [permissionState, setPermissionState] = useState<'requesting' | 'granted' | 'denied'>('requesting');
  const lastDecodedRef = useRef<string | null>(null);
  const pausedRef = useRef(paused);
  const detectingRef = useRef(false);

  useEffect(() => {
    pausedRef.current = paused;
    // 일시정지가 풀리면 직전 인식값 기억을 지운다 — 다음 손님이 같은 값을 다시 스캔해도 인식되게.
    if (!paused) lastDecodedRef.current = null;
  }, [paused]);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let rafId: number | null = null;
    let cancelled = false;

    const resolve = validate ?? parseCheckinToken;

    async function start() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode } });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        setPermissionState('granted');

        const videoEl = videoRef.current;
        if (!videoEl) return;
        // 재대입 가능한 let이 아니라 새 바인딩으로 좁혀 아래 중첩 함수(tick)에서도
        // non-null로 취급되게 한다 — nested function 안에서는 TS가 outer const의
        // null 체크 결과를 그대로 신뢰하지 않는다.
        const video: HTMLVideoElement = videoEl;
        video.srcObject = stream;
        await video.play();

        const DetectorCtor = (window as unknown as { BarcodeDetector?: BarcodeDetectorConstructorLike })
          .BarcodeDetector;
        const nativeDetector = DetectorCtor ? new DetectorCtor({ formats: ['qr_code'] }) : null;

        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d', { willReadFrequently: true }) ?? null;

        const handleRaw = (raw: string | null) => {
          detectingRef.current = false;
          if (raw && raw !== lastDecodedRef.current) {
            const resolved = resolve(raw);
            if (resolved) {
              // 디바운스: 동일 QR 연속 인식은 최초 1회만 처리한다.
              lastDecodedRef.current = raw;
              onDecode(resolved);
            }
            // 무효·타 도메인·타 패턴 URL은 무시하고 계속 스캔한다(오인식 방지).
          }
          if (!cancelled) rafId = requestAnimationFrame(tick);
        };

        function tick() {
          if (cancelled) return;
          if (pausedRef.current || detectingRef.current || video.readyState < video.HAVE_CURRENT_DATA) {
            rafId = requestAnimationFrame(tick);
            return;
          }
          detectingRef.current = true;

          if (nativeDetector) {
            nativeDetector
              .detect(video)
              .then((results) => handleRaw(results[0]?.rawValue ?? null))
              .catch(() => handleRaw(null));
            return;
          }

          if (canvas && ctx) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const result = jsQR(imageData.data, imageData.width, imageData.height);
            handleRaw(result?.data ?? null);
            return;
          }

          handleRaw(null);
        }

        rafId = requestAnimationFrame(tick);
      } catch (err) {
        if (cancelled) return;
        setPermissionState('denied');
        if (err instanceof Error && err.name !== 'NotAllowedError') {
          onError?.(err);
        }
        onPermissionDenied?.();
      }
    }

    start();

    return () => {
      cancelled = true;
      if (rafId !== null) cancelAnimationFrame(rafId);
      stream?.getTracks().forEach((t) => t.stop());
    };
    // onDecode/onError/onPermissionDenied/validate는 호출부가 매 렌더 새로 만드는 인라인 콜백일 수
    // 있다 — deps에 넣으면 렌더마다 스트림을 재획득하게 되어 의도적으로 제외한다(facingMode 변경
    // 시에만 재획득).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facingMode]);

  return (
    <div className="relative overflow-hidden rounded-card bg-ink">
      <video ref={videoRef} muted playsInline className="aspect-video w-full object-cover" />
      <canvas ref={canvasRef} hidden />
      {permissionState === 'denied' && (
        <p className="absolute inset-0 flex items-center justify-center bg-surface p-4 text-center text-desk text-ink">
          카메라 접근이 거부되었습니다. 브라우저 설정에서 허용 후 새로고침하거나 아래 검색으로
          진행하세요.
        </p>
      )}
    </div>
  );
}
