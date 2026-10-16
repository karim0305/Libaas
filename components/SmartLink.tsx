import Link from 'next/link';
import type { ReactNode } from 'react';

/** On-site paths use Next's Link; full addresses open in a new tab. Anything else is not rendered as a link. */
export default function SmartLink({ href, className, children }: { href: string; className?: string; children: ReactNode }) {
  if (/^\/($|[^/])/.test(href)) return <Link href={href} className={className}>{children}</Link>;
  if (/^https?:\/\//.test(href)) return <a href={href} className={className} target="_blank" rel="noopener noreferrer">{children}</a>;
  return <span className={className}>{children}</span>;
}
