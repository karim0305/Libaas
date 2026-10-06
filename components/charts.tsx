'use client';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { rs } from '@/lib/format';

const C = { indigo: '#1E2A5A', crimson: '#A3162F', gold: '#F0A202' };
const axis = { fontSize: 11, fill: '#64748b' };
const compact = (v: number) => (v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : v >= 1e3 ? `${Math.round(v / 1e3)}k` : `${v}`);

export function ChartCard({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return <section className="card p-4 sm:p-5"><h3 className="text-base font-semibold">{title}</h3>{sub && <p className="text-xs text-slate-500">{sub}</p>}<div className="mt-4 h-64">{children}</div></section>;
}

type Pt = Record<string, string | number>;
export function AreaSeries({ data, keys }: { data: Pt[]; keys: { key: string; name: string; color?: string }[] }) {
  return (
    <ResponsiveContainer><AreaChart data={data} margin={{ left: -10, right: 8, top: 4 }}>
      <CartesianGrid stroke="#eceef4" vertical={false} /><XAxis dataKey="label" tick={axis} interval={4} tickLine={false} /><YAxis tick={axis} tickFormatter={compact} tickLine={false} axisLine={false} />
      <Tooltip formatter={(v: number) => rs(v)} />
      {keys.map((k, i) => <Area key={k.key} type="monotone" dataKey={k.key} name={k.name} stroke={k.color ?? [C.indigo, C.crimson][i]} fill={k.color ?? [C.indigo, C.crimson][i]} fillOpacity={0.14} strokeWidth={2} />)}
    </AreaChart></ResponsiveContainer>
  );
}
export function CountBars({ data }: { data: Pt[] }) {
  return <ResponsiveContainer><BarChart data={data} margin={{ left: -20, right: 8, top: 4 }}><CartesianGrid stroke="#eceef4" vertical={false} /><XAxis dataKey="label" tick={axis} interval={4} tickLine={false} /><YAxis tick={axis} allowDecimals={false} tickLine={false} axisLine={false} /><Tooltip /><Bar dataKey="orders" name="Orders" fill={C.indigo} radius={[3, 3, 0, 0]} /></BarChart></ResponsiveContainer>;
}
export function RankBars({ data, color = C.indigo, money = true }: { data: { name: string; value: number }[]; color?: string; money?: boolean }) {
  return <ResponsiveContainer><BarChart data={data} layout="vertical" margin={{ left: 10, right: 16 }}><CartesianGrid stroke="#eceef4" horizontal={false} /><XAxis type="number" tick={axis} tickFormatter={compact} tickLine={false} /><YAxis type="category" dataKey="name" width={120} tick={axis} tickLine={false} axisLine={false} tickFormatter={(s: string) => (s.length > 18 ? `${s.slice(0, 17)}…` : s)} /><Tooltip formatter={(v: number) => (money ? rs(v) : v)} /><Bar dataKey="value" name={money ? 'Sales' : 'Count'} fill={color} radius={[0, 4, 4, 0]} /></BarChart></ResponsiveContainer>;
}
export function LineSeries({ data, dataKey, name }: { data: Pt[]; dataKey: string; name: string }) {
  return <ResponsiveContainer><LineChart data={data} margin={{ left: -10, right: 8, top: 4 }}><CartesianGrid stroke="#eceef4" vertical={false} /><XAxis dataKey="label" tick={axis} interval={4} tickLine={false} /><YAxis tick={axis} tickFormatter={compact} tickLine={false} axisLine={false} /><Tooltip formatter={(v: number) => rs(v)} /><Line type="monotone" dataKey={dataKey} name={name} stroke={C.crimson} strokeWidth={2.5} dot={false} /></LineChart></ResponsiveContainer>;
}
