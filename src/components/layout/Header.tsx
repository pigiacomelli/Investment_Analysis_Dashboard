'use client';

import { usePathname } from 'next/navigation';
import { Database } from 'lucide-react';
import Link from 'next/link';

export default function Header() {
  const pathname = usePathname();
  
  const getPageTitle = () => {
    if (pathname === '/') return 'Dashboard';
    if (pathname === '/investments') return 'Projects';
    if (pathname?.startsWith('/investments/new')) return 'New Project';
    if (pathname?.startsWith('/investments/')) return 'Project';
    if (pathname?.startsWith('/analytics')) return 'Analytics';
    if (pathname?.startsWith('/settings')) return 'Settings';
    return 'CapitalScope';
  };

  return (
    <header className="min-h-16 bg-card border-b border-border flex flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-6">
      <div className="flex flex-wrap items-center gap-4">
        <h2 className="text-lg font-semibold">{getPageTitle()}</h2>
        <nav aria-label="Mobile navigation" className="flex flex-wrap items-center gap-3 text-xs font-medium lg:hidden">
          <Link href="/investments" className="text-muted-foreground hover:text-primary">Projects</Link>
          <Link href="/analytics" className="text-muted-foreground hover:text-primary">Analytics</Link>
          <Link href="/investments/new" className="text-primary">+ New</Link>
        </nav>
      </div>
      <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-md border border-border">
        <Database className="w-4 h-4 text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground">Local SQLite</span>
      </div>
    </header>
  );
}
