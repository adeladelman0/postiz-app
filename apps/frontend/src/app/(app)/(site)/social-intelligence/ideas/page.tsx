'use client';

import Link from 'next/link';
import { FormEvent, useMemo, useState } from 'react';
import { useSocialIntelligence } from '@gitroom/frontend/components/social-intelligence/use.social-intelligence';

const statuses = ['idea','production','review','approved','scheduled','published'];

export default function Page() {
  const { data, request } = useSocialIntelligence();
  const [brandId, setBrandId] = useState('');
  const [title, setTitle] = useState('');
  const [platform, setPlatform] = useState('instagram');
  const [hook, setHook] = useState('');
  const [goal, setGoal] = useState('');
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState('');

  const selectedBrand = useMemo(
    () => data.brands.find((brand)=>brand.id===brandId) || data.brands[0],
    [data.brands, brandId]
  );

  async function create(event: FormEvent) {
    event.preventDefault();
    setWorking(true); setMessage('');
    try {
      await request('/ideas','POST',{
        brandProfileId: selectedBrand?.id,
        title, goal, platform, hook, format: 'other', evidence: [],
      });
      setTitle(''); setHook('');
    } catch (e:any) { setMessage(e.message || 'Could not save idea'); }
    finally { setWorking(false); }
  }

  async function generate() {
    if (!selectedBrand) return;
    setWorking(true); setMessage('');
    try {
      const strategy = data.strategies.find((item)=>item.brand_profile_id===selectedBrand.id);
      const generated = await request<any>('/generate/ideas','POST',{
        brandName: selectedBrand.name,
        goal,
        pillars: strategy?.pillars || [],
        evidence: data.audits.slice(0,20),
        count: 12,
      });
      const ideas = generated?.data?.ideas || [];
      for (const item of ideas) {
        await request('/ideas','POST',{
          brandProfileId: selectedBrand.id,
          title: item.title,
          goal: item.goal || goal || 'engagement',
          platform: item.platform || 'instagram',
          format: item.format || 'other',
          hook: item.hook || '',
          script: item.script || '',
          caption: item.caption || '',
          cta: item.cta || '',
          creativeBrief: item.creativeBrief || '',
          evidence: Array.isArray(item.evidence) ? item.evidence.map(String) : [],
        });
      }
      setMessage('Generated ideas added to the bank.');
    } catch (e:any) { setMessage(e.message || 'Idea generation failed'); }
    finally { setWorking(false); }
  }

  async function move(id:string, status:string) {
    setWorking(true); setMessage('');
    try { await request('/ideas/'+id+'/status','PATCH',{status}); }
    catch (e:any) { setMessage(e.message || 'Could not update status'); }
    finally { setWorking(false); }
  }

  return <div className="p-6 md:p-10 max-w-[1600px] mx-auto w-full">
    <Link href="/social-intelligence" className="text-sm opacity-60">← Social Intelligence</Link>
    <h1 className="text-3xl font-semibold mt-4">Idea Bank</h1>
    <p className="opacity-65 mt-2 max-w-3xl">Hooks, scripts, captions, CTAs and creative briefs move through one production workflow.</p>

    <div className="mt-8 grid gap-4 lg:grid-cols-2">
      <form onSubmit={create} className="rounded-2xl border border-white/10 p-5 grid gap-3">
        <b>Manual idea</b>
        <select value={selectedBrand?.id || ''} onChange={(e)=>setBrandId(e.target.value)} className="rounded-xl border border-white/10 bg-transparent px-4 py-3">
          {data.brands.map((brand)=><option key={brand.id} value={brand.id}>{brand.name}</option>)}
        </select>
        <div className="grid grid-cols-2 gap-3">
          <input required value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="Idea title" className="rounded-xl border border-white/10 bg-transparent px-4 py-3" />
          <select value={platform} onChange={(e)=>setPlatform(e.target.value)} className="rounded-xl border border-white/10 bg-transparent px-4 py-3"><option>instagram</option><option>facebook</option><option>tiktok</option><option>youtube</option><option>linkedin</option><option>x</option><option>threads</option></select>
        </div>
        <input value={hook} onChange={(e)=>setHook(e.target.value)} placeholder="Hook" className="rounded-xl border border-white/10 bg-transparent px-4 py-3" />
        <button disabled={working} className="rounded-xl bg-white text-black px-5 py-3 font-medium disabled:opacity-50">Save idea</button>
      </form>

      <div className="rounded-2xl border border-white/10 p-5 grid gap-3 content-start">
        <b>AI idea engine</b>
        <input value={goal} onChange={(e)=>setGoal(e.target.value)} placeholder="Goal for this batch" className="rounded-xl border border-white/10 bg-transparent px-4 py-3" />
        <button onClick={generate} disabled={!selectedBrand || working} className="rounded-xl border border-white/10 px-5 py-3 font-medium disabled:opacity-50">{working ? 'Working…' : 'Generate 12 ideas'}</button>
        <p className="text-xs opacity-55">Ollama is used when available. The fallback never invents analytics.</p>
      </div>
    </div>

    {message ? <div className="mt-4 text-sm opacity-70">{message}</div> : null}

    <div className="mt-8 grid gap-3 xl:grid-cols-6">
      {statuses.map((status)=>{
        const items=data.ideas.filter((idea)=>idea.status===status);
        return <div key={status} className="rounded-2xl border border-white/10 p-4 min-h-64">
          <div className="flex items-center justify-between"><b className="capitalize">{status}</b><span className="text-xs opacity-50">{items.length}</span></div>
          <div className="space-y-3 mt-4">
            {items.map((idea)=><div key={idea.id} className="rounded-xl border border-white/10 p-3 text-sm">
              <div className="font-medium">{idea.title}</div>
              <div className="opacity-55 mt-1">{idea.platform} · {idea.format}</div>
              {idea.hook ? <div className="opacity-70 mt-2">{idea.hook}</div> : null}
              <div className="flex gap-2 mt-3 flex-wrap">
                {statuses.filter((s)=>s!==status).slice(0,2).map((s)=><button key={s} disabled={working} onClick={()=>move(idea.id,s)} className="text-xs rounded-lg border border-white/10 px-2 py-1">→ {s}</button>)}
              </div>
            </div>)}
          </div>
        </div>;
      })}
    </div>
  </div>;
}
