export const dynamic = 'force-dynamic';
import Link from 'next/link';

export default function Page() {
 return <div className="p-6 md:p-10 max-w-[1400px] mx-auto">
  <Link href="/social-intelligence" className="text-sm opacity-60">← Social Intelligence</Link>
  <h1 className="text-3xl font-semibold mt-4">Social Audit</h1>
  <p className="opacity-65 mt-2 max-w-3xl">Analyze a brand profile using observed public or connected-account signals.</p>
  <div className="mt-8"><div className="rounded-2xl border border-white/10 p-6"><h2 className="text-xl font-medium">New audit</h2><p className="opacity-60 mt-2">Add the brand profile as a Social Target, then run an audit. Private metrics are only available for authorized connections.</p></div></div>
 </div>;
}
