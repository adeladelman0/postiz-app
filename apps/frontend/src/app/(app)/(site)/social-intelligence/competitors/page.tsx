'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useSocialIntelligence } from '@gitroom/frontend/components/social-intelligence/use.social-intelligence';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';

const platforms = ['instagram','facebook','tiktok','youtube','linkedin','x','threads'];

export default function Page() {
  const { data, request, isLoading } = useSocialIntelligence();
  const fetcher = useFetch();
  const [outliers, setOutliers] = useState<any[]>([]);
  const [platform, setPlatform] = useState('instagram');
  const [profileUrl, setProfileUrl] = useState('');
  const [label, setLabel] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [gaps, setGaps] = useState<any[]>([]);
  const [gapWorking, setGapWorking] = useState(false);

  const competitors = data.targets.filter((target) => target.is_competitor);

  useEffect(() => {
    fetcher('/social-intelligence/competitors/outliers')
      .then((response) => response.json())
      .then((payload) => setOutliers(Array.isArray(payload) ? payload : []))
      .catch(() => setOutliers([]));
  }, [fetcher, data.audits.length]);

  const themes = useMemo(() => {
    const counts = new Map<string, number>();
    outliers.forEach((item) => {
      const topics = Array.isArray(item.topics) ? item.topics : [];
      topics.forEach((topic:any) => counts.set(String(topic), (counts.get(String(topic)) || 0) + 1));
    });
    return [...counts.entries()].sort((a,b)=>b[1]-a[1]).slice(0,12);
  }, [outliers]);

  async function syncPublicTarget(target:any) {
    setSaving(true); setError('');
    try {
      if (target.platform !== 'youtube') {
        setError('Automatic public sync is currently available for YouTube through the official API. Use Social Audit to import observed data for this platform.');
        return;
      }
      await request('/targets/' + target.id + '/public-sync', 'POST', { maxPosts: 25 });
      setError('');
    } catch (e:any) {
      setError(e.message || 'Could not sync public profile');
    } finally {
      setSaving(false);
    }
  }

  async function generateGaps() {
    const brand = data.brands[0];
    if (!brand) {
      setError('Add a brand from the Intelligence dashboard first.');
      return;
    }
    setGapWorking(true); setError('');
    try {
      const result = await request<any>('/generate/gaps','POST',{
        brandName: brand.name,
        brandContext: {
          industry: brand.industry,
          audience: brand.audience || {},
          voice: brand.voice || {},
        },
        competitorObservations: outliers.slice(0,30),
        count: 6,
      });
      setGaps(result?.data?.gaps || []);
    } catch (e:any) {
      setError(e.message || 'Could not generate content gaps');
    } finally {
      setGapWorking(false);
    }
  }

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

    <div className="mt-8 grid gap-4 lg:grid-cols-[2fr_1fr]">
      <div className="rounded-2xl border border-white/10 p-5">
        <div className="flex items-center justify-between gap-4">
          <b>Observed outliers</b>
          <span className="text-xs opacity-50">ranked only from observed metrics</span>
        </div>
        <div className="space-y-3 mt-4">
          {outliers.slice(0,10).map((item,index)=><div key={item.id} className="rounded-xl border border-white/10 p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="font-medium">#{index+1} · {item.label || item.handle || item.platform}</div>
              <div className="text-xs opacity-60">{Number(item.outlier_ratio || 0).toFixed(2)}× baseline · score {Number(item.observed_score || 0).toFixed(0)}</div>
            </div>
            {item.hook ? <div className="mt-2 text-sm">{item.hook}</div> : null}
            {item.body_text ? <div className="mt-2 text-sm opacity-65 line-clamp-3">{item.body_text}</div> : null}
            <div className="text-xs opacity-50 mt-2">{item.platform} · {item.format || 'other'}</div>
          </div>)}
          {!outliers.length ? <div className="text-sm opacity-55">Import competitor observations from Social Audit to rank outliers.</div> : null}
        </div>
      </div>
      <div className="rounded-2xl border border-white/10 p-5">
        <div className="flex justify-between gap-3 items-center"><b>Observed themes</b><button onClick={generateGaps} disabled={gapWorking || !outliers.length} className="rounded-lg border border-white/10 px-3 py-2 text-xs disabled:opacity-50">{gapWorking ? 'Generating…' : 'Find content gaps'}</button></div>
        <div className="flex flex-wrap gap-2 mt-4">
          {themes.map(([topic,count])=><span key={topic} className="rounded-full border border-white/10 px-3 py-2 text-sm">{topic} <span className="opacity-50">×{count}</span></span>)}
          {!themes.length ? <span className="text-sm opacity-55">No topic evidence yet.</span> : null}
        </div>
      </div>
    </div>

    {gaps.length ? <div className="mt-6 rounded-2xl border border-white/10 p-5">
      <b>Recommended content gaps / opportunities</b>
      <div className="grid gap-3 md:grid-cols-2 mt-4">
        {gaps.map((gap,index)=><div key={index} className="rounded-xl border border-white/10 p-4">
          <div className="font-medium">{gap.opportunity}</div>
          <div className="text-sm opacity-65 mt-2">{gap.why}</div>
          <div className="text-xs opacity-55 mt-3">{gap.experiment}</div>
        </div>)}
      </div>
    </div> : null}

    <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {competitors.map((target) => (
        <div key={target.id} className="rounded-2xl border border-white/10 p-5">
          <div className="flex items-center justify-between gap-3">
            <b>{target.label || target.handle || target.platform}</b>
            <span className="text-xs rounded-full border border-white/10 px-2 py-1 opacity-70">{target.platform}</span>
          </div>
          <div className="text-sm opacity-60 mt-3 break-all">{target.profile_url}</div>
          <div className="text-xs opacity-50 mt-4">Source: {target.source || 'public'}</div>
          <div className="flex gap-2 mt-4">
            {target.platform === 'youtube' ? (
              <button
                onClick={()=>syncPublicTarget(target)}
                disabled={saving}
                className="rounded-lg border border-white/10 px-3 py-2 text-xs disabled:opacity-50"
              >
                {saving ? 'Syncing…' : 'Sync public YouTube'}
              </button>
            ) : (
              <Link
                href="/social-intelligence/audit"
                className="rounded-lg border border-white/10 px-3 py-2 text-xs"
              >
                Import observed data
              </Link>
            )}
          </div>
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
