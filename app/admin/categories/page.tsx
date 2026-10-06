'use client';
import { useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { useQuery } from '@/lib/hooks';
import { deleteCategory, listCategories, saveCategory } from '@/lib/services/analytics';
import { useConfirm, useToast } from '@/components/Providers';
import { ErrorState, TableSkeleton } from '@/components/ui/States';

export default function AdminCategories() {
  const q = useQuery(listCategories); const confirm = useConfirm(); const toast = useToast();
  const [name, setName] = useState(''); const [editing, setEditing] = useState<string | null>(null);
  const submit = async (e: React.FormEvent) => { e.preventDefault(); if (!name.trim()) return; await saveCategory(name.trim(), editing ?? undefined); toast(editing ? 'Category updated.' : 'Category added.'); setName(''); setEditing(null); };
  const del = async (id: string, n: string) => { if (await confirm({ title: `Delete “${n}”?`, message: 'Only empty categories can be deleted.', confirmLabel: 'Delete', danger: true })) { try { await deleteCategory(id); toast('Category deleted.', 'info'); } catch (x) { toast((x as Error).message, 'error'); } } };
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="card overflow-hidden"><h2 className="border-b border-line p-4 text-base font-semibold">Categories</h2>
        {q.loading ? <TableSkeleton rows={5} /> : q.error ? <ErrorState message={q.error} retry={q.reload} /> : (
          <table className="w-full"><thead><tr><th className="th">Name</th><th className="th">Slug</th><th className="th text-right">Products</th><th className="th" /></tr></thead>
            <tbody className="divide-y divide-line">{q.data!.map((c) => <tr key={c.id}><td className="td font-medium">{c.name}</td><td className="td text-slate-500">{c.slug}</td><td className="td text-right">{c.product_count}</td><td className="td"><div className="flex justify-end gap-1"><button aria-label={`Edit ${c.name}`} className="btn btn-ghost btn-sm" onClick={() => { setEditing(c.id); setName(c.name); }}><Pencil size={14} /></button><button aria-label={`Delete ${c.name}`} className="btn btn-ghost btn-sm !text-crimson" onClick={() => del(c.id, c.name)}><Trash2 size={14} /></button></div></td></tr>)}</tbody></table>)}
      </div>
      <form onSubmit={submit} className="card h-fit space-y-3 p-5"><h2 className="text-base font-semibold">{editing ? 'Rename category' : 'Add category'}</h2><div><label className="label" htmlFor="cn">Category name</label><input id="cn" className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Sherwanis" /></div><div className="flex gap-2"><button className="btn btn-primary">{editing ? 'Save changes' : 'Add category'}</button>{editing && <button type="button" className="btn btn-ghost" onClick={() => { setEditing(null); setName(''); }}>Cancel</button>}</div></form>
    </div>
  );
}
