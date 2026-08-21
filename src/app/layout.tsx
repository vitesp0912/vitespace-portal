import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import { PortalProvider } from "@/lib/portal-store";
import { ClientAuthProvider } from "@/lib/client-auth";
import { AuthSessionSync } from "@/components/portal/portal-auth-guard";
import { MessagesRealtime } from "@/components/messages/messages-realtime";
import { NotificationsRealtime } from "@/components/notifications/notifications-realtime";
import { DocumentsRealtime } from "@/components/documents/documents-realtime";
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
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: "/favicon.ico",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${portalFont.variable} ${geistMono.variable} h-full`}
    >
      <body className="min-h-full">
        <PortalProvider>
          <ClientAuthProvider>
            <AuthSessionSync />
            <MessagesRealtime />
            <NotificationsRealtime />
            <DocumentsRealtime />
            {children}
          </ClientAuthProvider>
        </PortalProvider>
      </body>
    </html>
  );
}
