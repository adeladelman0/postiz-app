'use client';

import Link from 'next/link';
import { useSocialIntelligence } from '@gitroom/frontend/components/social-intelligence/use.social-intelligence';

const modules = [
  ['Social Audit', 'Analyze connected/public profiles and surface observed performance signals.', '/social-intelligence/audit', 'audits'],
  ['Competitors', 'Track competitor content, outliers, themes and content gaps.', '/social-intelligence/competitors', 'targets'],
  ['Strategy', 'Turn evidence into pillars, experiments and platform recommendations.', '/social-intelligence/strategy', 'strategies'],
  ['Idea Bank', 'Store hooks, scripts, captions, CTAs and creative briefs.', '/social-intelligence/ideas', 'ideas'],
  ['30 / 60 / 90 Planner', 'Build an execution calendar and move content through approval.', '/social-intelligence/planner', 'plans'],
  ['Learning Loop', 'Feed published performance back into future recommendations.', '/social-intelligence/performance', 'performance'],
] as const;

export default function SocialIntelligencePage() {
  const { data, isLoading, error } = useSocialIntelligence();

  return (
    <div className="p-6 md:p-10 max-w-[1400px] mx-auto w-full">
      <div className="mb-8">
        <div className="text-sm opacity-60 mb-2">Postiz Intelligence</div>
        <h1 className="text-3xl md:text-4xl font-semibold">Social Intelligence</h1>
        <p className="mt-3 opacity-70 max-w-3xl">
          Audit brands, study competitors, create evidence-backed strategies and turn them into content plans that flow into publishing.
        </p>
      </div>

      {error ? (
        <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/5 p-4 text-sm">
          Social Intelligence data could not be loaded.
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {modules.map(([title, description, href, key]) => (
          <Link
            key={title}
            href={href}
            className="rounded-2xl border border-white/10 p-5 hover:bg-white/5 transition-colors min-h-44"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="text-xl font-medium">{title}</div>
              <div className="rounded-full border border-white/10 px-3 py-1 text-sm opacity-75">
                {isLoading ? '…' : data[key].length}
              </div>
            </div>
            <div className="opacity-65 leading-6 mt-3">{description}</div>
            <div className="mt-6 text-sm font-medium">Open →</div>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-4 mt-8">
        <div className="rounded-2xl border border-white/10 p-4">
          <div className="text-sm opacity-60">Brands</div>
          <div className="text-2xl font-semibold mt-1">{data.brands.length}</div>
        </div>
        <div className="rounded-2xl border border-white/10 p-4">
          <div className="text-sm opacity-60">Tracked profiles</div>
          <div className="text-2xl font-semibold mt-1">{data.targets.length}</div>
        </div>
        <div className="rounded-2xl border border-white/10 p-4">
          <div className="text-sm opacity-60">Planned posts</div>
          <div className="text-2xl font-semibold mt-1">{data.planItems.length}</div>
        </div>
        <div className="rounded-2xl border border-white/10 p-4">
          <div className="text-sm opacity-60">Learning insights</div>
          <div className="text-2xl font-semibold mt-1">{data.insights.length}</div>
        </div>
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
