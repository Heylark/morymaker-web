import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "morymaker",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" data-theme="dark">
      <body className="bg-[var(--void)] font-[var(--kr)] text-[var(--ivory)]">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
