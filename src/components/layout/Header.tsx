'use client';

import { usePathname } from 'next/navigation';
import { Database } from 'lucide-react';

export default function Header() {
  const pathname = usePathname();
  
  const getPageTitle = () => {
    if (pathname === '/') return 'Dashboard';
    if (pathname?.startsWith('/investments')) return 'Investments';
    if (pathname?.startsWith('/analytics')) return 'Analytics';
    if (pathname?.startsWith('/settings')) return 'Settings';
    return 'CapitalScope';
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6">
      <h2 className="text-xl font-semibold text-slate-800">{getPageTitle()}</h2>
      
      <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-md border border-slate-200">
        <Database className="w-4 h-4 text-slate-500" />
        <span className="text-xs font-medium text-slate-600">Local SQLite</span>
      </div>
    </header>
  );
}
