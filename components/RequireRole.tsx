'use client';
import { useEffect, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from './Providers';
import type { Role } from '@/lib/types';
import { Skeleton } from './ui/States';

export default function RequireRole({ role, children }: { role: Role; children: ReactNode }) {
  const { user, ready } = useAuth();
  const router = useRouter();
  const path = usePathname();
  useEffect(() => {
    if (ready && (!user || user.role !== role)) router.replace(`/login?next=${encodeURIComponent(path)}&as=${role}`);
  }, [ready, user, role, router, path]);
  if (!ready || !user || user.role !== role) return <div className="p-8"><Skeleton className="h-8 w-48" /><Skeleton className="mt-6 h-64 w-full" /></div>;
  return <>{children}</>;
}
