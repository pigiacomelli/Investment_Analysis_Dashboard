'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Database, Plus, Briefcase, LayoutDashboard } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarClientProps {
  investments: { id: string; name: string; category: string }[];
}

export function SidebarClient({ investments }: SidebarClientProps) {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-card text-card-foreground flex flex-col h-full border-r border-border shadow-sm">
      <div className="p-6">
        <Link href="/" className="text-xl font-bold flex items-center gap-2 hover:text-primary transition-colors">
          <Database className="w-6 h-6 text-primary" />
          CapitalScope
        </Link>
      </div>

      <div className="px-4 py-2 flex items-center justify-between group">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Projects</h2>
        <Link 
          href="/investments/new" 
          className="text-muted-foreground hover:text-primary hover:bg-muted p-1 rounded transition-colors"
          title="New Project"
        >
          <Plus className="w-4 h-4" />
        </Link>
      </div>

      <nav className="flex-1 px-2 py-2 space-y-1 overflow-y-auto">
        {investments.length === 0 ? (
          <div className="px-2 py-8 flex flex-col items-center text-center text-sm text-muted-foreground">
            <LayoutDashboard className="w-8 h-8 mb-2 opacity-20" />
            <p>No projects yet.</p>
            <Link href="/investments/new" className="text-primary hover:underline mt-2">
              Create your first
            </Link>
          </div>
        ) : (
          investments.map((inv) => {
            const href = `/investments/${inv.id}`;
            const isActive = pathname === href || pathname.startsWith(`${href}/`);
            
            return (
              <Link
                key={inv.id}
                href={href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-sm font-medium group',
                  isActive 
                    ? 'bg-primary/10 text-primary' 
                    : 'hover:bg-muted hover:text-foreground'
                )}
              >
                <Briefcase className={cn('w-4 h-4 transition-colors', isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground')} />
                <span className="truncate">{inv.name}</span>
              </Link>
            );
          })
        )}
      </nav>

      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-bold text-muted-foreground">
            CS
          </div>
          <div>
            <p className="text-sm font-medium">Local Workspace</p>
            <p className="text-xs text-muted-foreground">SQLite Storage</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
