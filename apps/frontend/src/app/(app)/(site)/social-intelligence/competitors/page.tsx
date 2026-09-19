export const dynamic = 'force-dynamic';
import Link from 'next/link';

export default function Page() {
 return <div className="p-6 md:p-10 max-w-[1400px] mx-auto">
  <Link href="/social-intelligence" className="text-sm opacity-60">← Social Intelligence</Link>
  <h1 className="text-3xl font-semibold mt-4">Competitors</h1>
  <p className="opacity-65 mt-2 max-w-3xl">Track competitor accounts, content patterns, outliers and gaps.</p>
  <div className="mt-8"><div className="grid md:grid-cols-3 gap-4">{['Profiles','Outliers','Content gaps'].map(x=><div key={x} className="rounded-2xl border border-white/10 p-5 min-h-32"><b>{x}</b></div>)}</div></div>
 </div>;
}
