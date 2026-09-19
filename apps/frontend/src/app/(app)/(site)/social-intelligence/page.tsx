'use client';

import Link from 'next/link';

const modules = [
  ['Social Audit', 'Analyze connected/public profiles and surface observed performance signals.', '/social-intelligence/audit'],
  ['Competitors', 'Track competitor content, outliers, themes and content gaps.', '/social-intelligence/competitors'],
  ['Strategy', 'Turn evidence into pillars, experiments and platform recommendations.', '/social-intelligence/strategy'],
  ['Idea Bank', 'Store hooks, scripts, captions, CTAs and creative briefs.', '/social-intelligence/ideas'],
  ['30 / 60 / 90 Planner', 'Build an execution calendar and move content through approval.', '/social-intelligence/planner'],
  ['Learning Loop', 'Feed published performance back into future recommendations.', '/social-intelligence/performance'],
];

export default function SocialIntelligencePage() {
  return (
    <div className="p-6 md:p-10 max-w-[1400px] mx-auto">
      <div className="mb-8">
        <div className="text-sm opacity-60 mb-2">Postiz Intelligence</div>
        <h1 className="text-3xl md:text-4xl font-semibold">Social Intelligence</h1>
        <p className="mt-3 opacity-70 max-w-3xl">
          Audit brands, study competitors, create evidence-backed strategies and turn them into content plans that flow into publishing.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {modules.map(([title, description, href]) => (
          <Link key={title} href={href} className="rounded-2xl border border-white/10 p-5 hover:bg-white/5 transition-colors min-h-44">
            <div className="text-xl font-medium mb-3">{title}</div>
            <div className="opacity-65 leading-6">{description}</div>
            <div className="mt-6 text-sm font-medium">Open →</div>
          </Link>
        ))}
      </div>
      <div className="mt-8 rounded-2xl border border-white/10 p-5">
        <div className="font-medium">Data integrity</div>
        <p className="mt-2 text-sm opacity-65">
          Public audits only use metrics actually observed. Private reach, impressions, saves and audience data require an authorized platform connection.
        </p>
      </div>
    </div>
  );
}
