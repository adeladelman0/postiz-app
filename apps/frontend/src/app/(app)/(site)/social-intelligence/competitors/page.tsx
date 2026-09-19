'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { useSocialIntelligence } from '@gitroom/frontend/components/social-intelligence/use.social-intelligence';

const platforms = ['instagram','facebook','tiktok','youtube','linkedin','x','threads'];

export default function Page() {
  const { data, request, isLoading } = useSocialIntelligence();
  const [platform, setPlatform] = useState('instagram');
  const [profileUrl, setProfileUrl] = useState('');
  const [label, setLabel] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const competitors = data.targets.filter((target) => target.is_competitor);

  async function addCompetitor(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await request('/targets', 'POST', {
        platform,
        profileUrl,
        label,
        source: 'public',
        isCompetitor: true,
      });
      setProfileUrl('');
      setLabel('');
    } catch (e: any) {
      setError(e.message || 'Could not add competitor');
    } finally {
      setSaving(false);
    }
  }

  return <div className="p-6 md:p-10 max-w-[1400px] mx-auto w-full">
    <Link href="/social-intelligence" className="text-sm opacity-60">← Social Intelligence</Link>
    <h1 className="text-3xl font-semibold mt-4">Competitors</h1>
    <p className="opacity-65 mt-2 max-w-3xl">
      Track public competitor profiles without pretending private metrics are available.
    </p>

    <form onSubmit={addCompetitor} className="mt-8 rounded-2xl border border-white/10 p-5 grid gap-3 md:grid-cols-[180px_1fr_220px_auto]">
      <select value={platform} onChange={(e)=>setPlatform(e.target.value)} className="rounded-xl border border-white/10 bg-transparent px-4 py-3">
        {platforms.map((item)=><option key={item} value={item}>{item}</option>)}
      </select>
      <input value={profileUrl} onChange={(e)=>setProfileUrl(e.target.value)} required type="url" placeholder="https://..." className="rounded-xl border border-white/10 bg-transparent px-4 py-3" />
      <input value={label} onChange={(e)=>setLabel(e.target.value)} placeholder="Competitor label" className="rounded-xl border border-white/10 bg-transparent px-4 py-3" />
      <button disabled={saving} className="rounded-xl bg-white text-black px-5 py-3 font-medium disabled:opacity-50">{saving ? 'Adding…' : 'Add competitor'}</button>
      {error ? <div className="md:col-span-4 text-sm text-red-400">{error}</div> : null}
    </form>

    <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {competitors.map((target) => (
        <div key={target.id} className="rounded-2xl border border-white/10 p-5">
          <div className="flex items-center justify-between gap-3">
            <b>{target.label || target.handle || target.platform}</b>
            <span className="text-xs rounded-full border border-white/10 px-2 py-1 opacity-70">{target.platform}</span>
          </div>
          <div className="text-sm opacity-60 mt-3 break-all">{target.profile_url}</div>
          <div className="text-xs opacity-50 mt-4">Source: {target.source || 'public'}</div>
        </div>
      ))}
      {!isLoading && !competitors.length ? (
        <div className="rounded-2xl border border-dashed border-white/10 p-6 opacity-60 md:col-span-2 xl:col-span-3">
          No competitor profiles yet. Add the first profile above.
        </div>
      ) : null}
    </div>

    <div className="mt-8 rounded-2xl border border-white/10 p-5 text-sm opacity-70">
      Public profile analysis is limited to evidence that can actually be observed or legally imported. Connect accounts in Postiz for authorized private analytics.
    </div>
  </div>;
}
