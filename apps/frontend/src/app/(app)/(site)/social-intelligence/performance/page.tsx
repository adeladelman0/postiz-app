export const dynamic = 'force-dynamic';
import Link from 'next/link';

export default function Page() {
 return <div className="p-6 md:p-10 max-w-[1400px] mx-auto">
  <Link href="/social-intelligence" className="text-sm opacity-60">← Social Intelligence</Link>
  <h1 className="text-3xl font-semibold mt-4">Learning Loop</h1>
  <p className="opacity-65 mt-2 max-w-3xl">Use published performance to improve future recommendations.</p>
  <div className="mt-8"><div className="rounded-2xl border border-white/10 p-6">Observed post metrics → performance snapshots → learning insights → next strategy and plan.</div></div>
 </div>;
}
