import "~/styles/globals.css";
import { type Metadata } from "next";
import { Geist } from "next/font/google";
import { TRPCReactProvider } from "~/trpc/react";

export const metadata: Metadata = {
  title: "EasySLR — Article Review Workspace",
  description: "The systematic literature review workspace built for researchers.",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={geist.variable}>
      <body className="min-h-screen bg-[var(--slr-bg)] text-[var(--slr-ink)] antialiased">
        <TRPCReactProvider>{children}</TRPCReactProvider>
      </body>
    </html>
  );
}
