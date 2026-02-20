import { Providers } from "./providers";
import "./globals.css";

export const metadata = {
  title: "Hệ thống soạn thảo tự động",
  description: "Giải pháp quản lý và soạn thảo hồ sơ chuyên nghiệp",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning className="min-h-screen bg-background antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}