'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useSocialIntelligence } from '@gitroom/frontend/components/social-intelligence/use.social-intelligence';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';

const example = JSON.stringify({
  profileMetrics: [],
  content: [],
  notes: ['Import only metrics you actually observed or received from an authorized connection.']
}, null, 2);

export default function Page() {
  const { data, request } = useSocialIntelligence();
  const fetcher = useFetch();
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [targetId, setTargetId] = useState('');
  const [payload, setPayload] = useState(example);
  const [preview, setPreview] = useState<any>(null);
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetcher('/integrations/list')
      .then((response) => response.json())
      .then((payload) => setIntegrations((payload.integrations || []).filter((item:any)=>!item.disabled)))
      .catch(() => setIntegrations([]));
  }, [fetcher]);

  const target = useMemo(
    () => data.targets.find((item)=>item.id===targetId) || data.targets[0],
    [data.targets, targetId]
  );

  async function syncConnected(integrationId:string) {
    setWorking(true); setMessage('');
    try {
      await request('/connected/' + integrationId + '/audit', 'POST', { days: 30 });
      setMessage('Connected analytics synced into a new audit.');
    } catch (e:any) {
      setMessage(e.message || 'Could not sync connected analytics');
    } finally {
      setWorking(false);
    }
  }

  async function analyze() {
    if (!target) return;
    setWorking(true); setMessage('');
    try {
      const imported = JSON.parse(payload);
      const result = await request<any>('/audit/preview','POST',{
        target: {
          platform: target.platform,
          profileUrl: target.profile_url,
          handle: target.handle || undefined,
          source: target.source || 'imported',
        },
        capturedAt: new Date().toISOString(),
        profileMetrics: imported.profileMetrics || [],
        content: imported.content || [],
        notes: imported.notes || [],
      });
      setPreview(result);
    } catch (e:any) {
      setMessage(e.message || 'Audit input must be valid JSON.');
    } finally { setWorking(false); }
  }

  async function saveAudit() {
    if (!target || !preview) return;
    setWorking(true); setMessage('');
    try {
      await request('/audits','POST',{
        targetId: target.id,
        status: 'completed',
        summary: preview,
        notes: preview.notes || [],
      });
      setMessage('Audit saved.');
    } catch (e:any) { setMessage(e.message || 'Could not save audit'); }
    finally { setWorking(false); }
  }

  return <div className="p-6 md:p-10 max-w-[1400px] mx-auto w-full">
    <Link href="/social-intelligence" className="text-sm opacity-60">← Social Intelligence</Link>
    <h1 className="text-3xl font-semibold mt-4">Social Audit</h1>
    <p className="opacity-65 mt-2 max-w-3xl">
      Rank content from observed evidence. Public URL tracking never unlocks private reach, impressions, saves or audience data.
    </p>

    <div className="mt-8 rounded-2xl border border-white/10 p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <b>Authorized connected accounts</b>
          <p className="text-xs opacity-55 mt-1">Import real account analytics through the official connections already configured in Postiz.</p>
        </div>
        <Link href="/launches" className="text-sm underline opacity-70">Manage channels</Link>
      </div>
      <div className="flex flex-wrap gap-3 mt-4">
        {integrations.map((item:any)=><button key={item.id} onClick={()=>syncConnected(item.id)} disabled={working} className="rounded-xl border border-white/10 px-4 py-3 text-sm disabled:opacity-50">{item.name || item.profile || item.identifier} · sync 30d</button>)}
        {!integrations.length ? <div className="text-sm opacity-55">No connected social channels found.</div> : null}
      </div>
    </div>

    <div className="mt-6 grid gap-4 lg:grid-cols-[320px_1fr]">
      <div className="rounded-2xl border border-white/10 p-5">
        <b>Target</b>
        <select value={target?.id || ''} onChange={(e)=>setTargetId(e.target.value)} className="mt-3 w-full rounded-xl border border-white/10 bg-transparent px-4 py-3">
          {!data.targets.length ? <option value="">Add a target or competitor first</option> : null}
          {data.targets.map((item)=><option key={item.id} value={item.id}>{item.label || item.handle || item.profile_url}</option>)}
        </select>
        {target ? <div className="mt-4 text-sm opacity-60 break-all">{target.platform}<br />{target.profile_url}</div> : null}
        <Link href="/social-intelligence/competitors" className="inline-block mt-5 text-sm underline opacity-70">Manage tracked profiles</Link>
      </div>

      <div className="rounded-2xl border border-white/10 p-5">
        <b>Observed data import</b>
        <p className="text-xs opacity-55 mt-2">Paste normalized observations from an allowed public source or an authorized account export.</p>
        <textarea value={payload} onChange={(e)=>setPayload(e.target.value)} className="mt-4 min-h-80 w-full rounded-xl border border-white/10 bg-transparent p-4 font-mono text-xs" />
        <div className="flex gap-3 mt-4">
          <button onClick={analyze} disabled={!target || working} className="rounded-xl bg-white text-black px-5 py-3 font-medium disabled:opacity-50">{working ? 'Analyzing…' : 'Analyze'}</button>
          <button onClick={saveAudit} disabled={!preview || working} className="rounded-xl border border-white/10 px-5 py-3 disabled:opacity-50">Save audit</button>
        </div>
        {message ? <div className="text-sm opacity-70 mt-3">{message}</div> : null}
      </div>
    </div>

    {preview ? <div className="mt-6 rounded-2xl border border-white/10 p-6">
      <div className="grid gap-4 md:grid-cols-3">
        <div><div className="text-xs opacity-50">Content analyzed</div><div className="text-2xl font-semibold mt-1">{preview.contentCount}</div></div>
        <div><div className="text-xs opacity-50">Top items</div><div className="text-2xl font-semibold mt-1">{preview.topContent?.length || 0}</div></div>
        <div><div className="text-xs opacity-50">Evidence source</div><div className="text-lg font-medium mt-1">{preview.target?.source}</div></div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 mt-6">
        <div><b>Top content</b><pre className="mt-3 text-xs whitespace-pre-wrap opacity-65">{JSON.stringify(preview.topContent || [], null, 2)}</pre></div>
        <div><b>Lowest content</b><pre className="mt-3 text-xs whitespace-pre-wrap opacity-65">{JSON.stringify(preview.lowContent || [], null, 2)}</pre></div>
      </div>
    </div> : null}

    <div className="mt-8 grid gap-3">
      {data.audits.map((item)=><div key={item.id} className="rounded-2xl border border-white/10 p-4"><div className="flex justify-between gap-4"><b>Audit {String(item.id).slice(0,8)}</b><span className="text-xs opacity-50">{item.status}</span></div><div className="text-xs opacity-50 mt-2">{item.captured_at || item.created_at}</div></div>)}
    </div>
  </div>;
}
