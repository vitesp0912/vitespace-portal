import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import { PortalProvider } from "@/lib/portal-store";
import { portalFont } from "@/lib/fonts";
import "./globals.css";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Vitespace Portal",
  description:
    "Everything your agency is doing for you, in one place. Progress, communication, approvals, and billing.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${portalFont.variable} ${geistMono.variable} h-full`}
    >
      <body className="min-h-full">
        <PortalProvider>{children}</PortalProvider>
      </body>
    </html>
  );
}
