'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useSocialIntelligence } from '@gitroom/frontend/components/social-intelligence/use.social-intelligence';

export default function Page() {
  const { data, request } = useSocialIntelligence();
  const [brandId, setBrandId] = useState('');
  const [goal, setGoal] = useState('');
  const [generated, setGenerated] = useState<any>(null);
  const [audience, setAudience] = useState('');
  const [voice, setVoice] = useState('');
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState('');

  const selectedBrand = useMemo(
    () => data.brands.find((brand) => brand.id === brandId) || data.brands[0],
    [data.brands, brandId]
  );

  useEffect(() => {
    setAudience(selectedBrand?.audience?.description || '');
    setVoice(selectedBrand?.voice?.description || '');
  }, [selectedBrand?.id]);

  async function saveBrandContext() {
    if (!selectedBrand) return;
    setWorking(true); setMessage('');
    try {
      await request('/brands/' + selectedBrand.id, 'PATCH', {
        audience: { description: audience },
        voice: { description: voice },
      });
      setMessage('Brand context saved.');
    } catch (e:any) {
      setMessage(e.message || 'Could not save brand context');
    } finally {
      setWorking(false);
    }
  }

  async function generate() {
    if (!selectedBrand) return;
    setWorking(true);
    setMessage('');
    try {
      const result = await request<any>('/generate/strategy', 'POST', {
        brandName: selectedBrand.name,
        goal,
        brandContext: {
          industry: selectedBrand.industry,
          audience: selectedBrand.audience || { description: audience },
          voice: selectedBrand.voice || { description: voice },
        },
        evidence: data.audits.slice(0, 20),
        competitors: data.targets.filter((target) => target.is_competitor).slice(0, 20),
      });
      setGenerated(result);
    } catch (e: any) {
      setMessage(e.message || 'Strategy generation failed');
    } finally {
      setWorking(false);
    }
  }

  async function save() {
    if (!selectedBrand || !generated?.data) return;
    setWorking(true);
    setMessage('');
    try {
      await request('/strategies', 'POST', {
        brandProfileId: selectedBrand.id,
        title: generated.data.title || selectedBrand.name + ' strategy',
        summary: generated.data.summary || '',
        pillars: generated.data.pillars || [],
        recommendations: generated.data.recommendations || [],
        evidence: generated.data.evidence || [],
      });
      setMessage('Strategy saved.');
    } catch (e: any) {
      setMessage(e.message || 'Could not save strategy');
    } finally {
      setWorking(false);
    }
  }

  return <div className="p-6 md:p-10 max-w-[1400px] mx-auto w-full">
    <Link href="/social-intelligence" className="text-sm opacity-60">← Social Intelligence</Link>
    <h1 className="text-3xl font-semibold mt-4">Strategy</h1>
    <p className="opacity-65 mt-2 max-w-3xl">Build evidence-backed positioning, pillars and experiments with Ollama-first AI and a no-fabrication fallback.</p>

    <div className="mt-8 rounded-2xl border border-white/10 p-5">
      <div className="font-medium">Brand context</div>
      <div className="grid gap-3 md:grid-cols-2 mt-3">
        <textarea value={audience} onChange={(e)=>setAudience(e.target.value)} placeholder="Audience: who they are, needs, objections, buying context" className="min-h-28 rounded-xl border border-white/10 bg-transparent px-4 py-3" />
        <textarea value={voice} onChange={(e)=>setVoice(e.target.value)} placeholder="Voice: tone, vocabulary, do / don't rules" className="min-h-28 rounded-xl border border-white/10 bg-transparent px-4 py-3" />
      </div>
      <button onClick={saveBrandContext} disabled={!selectedBrand||working} className="mt-3 rounded-xl border border-white/10 px-4 py-2 text-sm disabled:opacity-50">Save brand context</button>
    </div>

    <div className="mt-6 rounded-2xl border border-white/10 p-5 grid gap-3 md:grid-cols-[260px_1fr_auto]">
      <select value={selectedBrand?.id || ''} onChange={(e)=>setBrandId(e.target.value)} className="rounded-xl border border-white/10 bg-transparent px-4 py-3">
        {!data.brands.length ? <option value="">Create a brand from the dashboard first</option> : null}
        {data.brands.map((brand)=><option key={brand.id} value={brand.id}>{brand.name}</option>)}
      </select>
      <input value={goal} onChange={(e)=>setGoal(e.target.value)} placeholder="Goal, e.g. qualified leads" className="rounded-xl border border-white/10 bg-transparent px-4 py-3" />
      <button onClick={generate} disabled={!selectedBrand || working} className="rounded-xl bg-white text-black px-5 py-3 font-medium disabled:opacity-50">{working ? 'Working…' : 'Generate strategy'}</button>
    </div>

    {message ? <div className="mt-3 text-sm opacity-70">{message}</div> : null}

    {generated?.data ? <div className="mt-6 rounded-2xl border border-white/10 p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-xs opacity-50 uppercase">Provider: {generated.provider}{generated.model ? ' · ' + generated.model : ''}</div>
          <h2 className="text-xl font-semibold mt-1">{generated.data.title}</h2>
        </div>
        <button onClick={save} disabled={working} className="rounded-xl border border-white/10 px-4 py-2">Save strategy</button>
      </div>
      <p className="opacity-70 mt-4">{generated.data.summary}</p>
      <div className="grid gap-4 md:grid-cols-2 mt-6">
        <div><b>Pillars</b><ul className="mt-3 space-y-2 text-sm opacity-75">{(generated.data.pillars || []).map((x:string,i:number)=><li key={i}>• {x}</li>)}</ul></div>
        <div><b>Recommendations</b><ul className="mt-3 space-y-2 text-sm opacity-75">{(generated.data.recommendations || []).map((x:string,i:number)=><li key={i}>• {x}</li>)}</ul></div>
      </div>
    </div> : null}

    <div className="mt-8 grid gap-4">
      {data.strategies.map((item)=><div key={item.id} className="rounded-2xl border border-white/10 p-5"><b>{item.title}</b><p className="text-sm opacity-65 mt-2">{item.summary}</p></div>)}
    </div>
  </div>;
}
