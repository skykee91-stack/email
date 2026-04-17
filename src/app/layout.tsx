import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AppShell from "@/components/AppShell";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "셀포 메일러",
  description: "B2B 영업 이메일 자동화 시스템",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  const user = session?.user
    ? {
        email: session.user.email,
        name: session.user.name,
        role: (session.user as { role?: 'ADMIN' | 'CUSTOMER' }).role,
        tenantId: (session.user as { tenantId?: string | null }).tenantId,
      }
    : null;

  let tenant = null;
  if (user?.tenantId) {
    const t = await prisma.tenant.findUnique({
      where: { id: user.tenantId },
      select: { companyName: true, setupStatus: true, domain: true },
    });
    tenant = t;
  }

  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex bg-gray-950 text-gray-100">
        <AppShell user={user} tenant={tenant}>
          {children}
        </AppShell>
      </body>
    </html>
  );
}
