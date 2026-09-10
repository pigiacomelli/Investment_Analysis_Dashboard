import type { Metadata } from 'next';
import { SidebarClient } from '@/components/layout/SidebarClient';
import Header from '@/components/layout/Header';
import '@/app/globals.css';
import { prisma } from '@/lib/db';

export const metadata: Metadata = {
  title: 'CapitalScope',
  description: 'Local-first investment analytics dashboard',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const investments = await prisma.investment.findMany({
    select: { id: true, name: true, category: true },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <html lang="en" className="dark">
      <body className="antialiased font-sans text-foreground bg-background flex h-screen overflow-hidden">
        <SidebarClient investments={investments} />
        <div className="flex flex-col flex-1 overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto p-6">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
