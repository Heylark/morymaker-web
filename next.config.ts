import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || "",
  output: "standalone",
  turbopack: {
    // 워크트리 밖(컨테이너 공유 docs·tasks 등)을 가리키는 심볼릭 링크를 콘텐츠 스캔이
    // 해석하려다 "leaves the filesystem root" panic으로 죽지 않도록, 프로젝트 루트를
    // 이 파일이 위치한 디렉토리로 고정한다. 특정 폴더명을 하드코딩하지 않아 워크트리
    // 밖을 가리키는 어떤 심볼릭 링크가 추가되어도 동일하게 방어된다.
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
