export const dynamic = 'force-dynamic';
import Link from 'next/link';

export default function Page() {
 return <div className="p-6 md:p-10 max-w-[1400px] mx-auto">
  <Link href="/social-intelligence" className="text-sm opacity-60">← Social Intelligence</Link>
  <h1 className="text-3xl font-semibold mt-4">Idea Bank</h1>
  <p className="opacity-65 mt-2 max-w-3xl">Central library for hooks, scripts, captions, CTAs and creative briefs.</p>
  <div className="mt-8"><div className="grid md:grid-cols-4 gap-3">{['Idea','Production','Review','Approved'].map(x=><div key={x} className="rounded-2xl border border-white/10 p-4 min-h-40"><b>{x}</b></div>)}</div></div>
 </div>;
}
