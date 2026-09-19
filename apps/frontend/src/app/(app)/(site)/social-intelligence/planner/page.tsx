export const dynamic = 'force-dynamic';
import Link from 'next/link';

export default function Page() {
 return <div className="p-6 md:p-10 max-w-[1400px] mx-auto">
  <Link href="/social-intelligence" className="text-sm opacity-60">← Social Intelligence</Link>
  <h1 className="text-3xl font-semibold mt-4">30 / 60 / 90 Planner</h1>
  <p className="opacity-65 mt-2 max-w-3xl">Turn strategy and ideas into an execution calendar.</p>
  <div className="mt-8"><div className="flex gap-3 mb-5">{[30,60,90].map(x=><div key={x} className="rounded-xl border border-white/10 px-5 py-3">{x} days</div>)}</div><div className="rounded-2xl border border-white/10 p-6">Calendar items keep platform, format, hook, script, caption, CTA, creative brief, status and planned time.</div></div>
 </div>;
}
