'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useSocialIntelligence } from '@gitroom/frontend/components/social-intelligence/use.social-intelligence';

export default function Page() {
  const { data, request } = useSocialIntelligence();
  const [brandId, setBrandId] = useState('');
  const [horizon, setHorizon] = useState(30);
  const [planId, setPlanId] = useState('');
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState('');

  const brand = useMemo(()=>data.brands.find((x)=>x.id===brandId)||data.brands[0],[data.brands,brandId]);
  const plan = useMemo(()=>data.plans.find((x)=>x.id===planId)||data.plans[0],[data.plans,planId]);
  const approvedIdeas = data.ideas.filter((idea)=>['approved','scheduled'].includes(idea.status));

  async function createPlan() {
    if (!brand) return;
    setWorking(true); setMessage('');
    try {
      const created=await request<any>('/plans','POST',{
        brandProfileId: brand.id,
        horizonDays: horizon,
        strategySummary: data.strategies.find((x)=>x.brand_profile_id===brand.id)?.summary || '',
        startsAt: new Date().toISOString(),
      });
      setPlanId(created.id);
      setMessage('Plan created.');
    } catch(e:any){setMessage(e.message||'Could not create plan');}
    finally{setWorking(false);}
  }

  async function generateSchedule() {
    if (!brand || !plan) return;
    setWorking(true); setMessage('');
    try {
      const result=await request<any>('/generate/plan','POST',{
        brandName: brand.name,
        horizonDays: Number(plan.horizon_days) || horizon,
        ideas: approvedIdeas.length ? approvedIdeas : data.ideas.slice(0,12),
        evidence: data.performance.slice(0,30),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
      });
      const base=new Date(plan.starts_at || Date.now());
      for (const item of result?.data?.items || []) {
        const date=new Date(base);
        date.setDate(date.getDate()+Number(item.plannedDayOffset || 0));
        const [hours,minutes]=String(item.recommendedLocalTime||'12:00').split(':').map(Number);
        date.setHours(hours||0,minutes||0,0,0);
        await request('/plan-items','POST',{
          planId: plan.id,
          ideaId: item.id || undefined,
          plannedAt: date.toISOString(),
          timezone: result.data.timezone || 'UTC',
          platform: item.platform || 'instagram',
          format: item.format || 'other',
          hook: item.hook || '',
          script: item.script || '',
          caption: item.caption || '',
          cta: item.cta || '',
          creativeBrief: item.creative_brief || item.creativeBrief || '',
          status: item.status || 'idea',
        });
      }
      setMessage('Schedule generated and saved.');
    } catch(e:any){setMessage(e.message||'Could not generate schedule');}
    finally{setWorking(false);}
  }

  async function requestApproval(itemId:string) {
    setWorking(true); setMessage('');
    try { await request('/approvals','POST',{planItemId:itemId,message:'Please review this content item.'}); setMessage('Approval requested.'); }
    catch(e:any){setMessage(e.message||'Could not request approval');}
    finally{setWorking(false);}
  }

  return <div className="p-6 md:p-10 max-w-[1500px] mx-auto w-full">
    <Link href="/social-intelligence" className="text-sm opacity-60">← Social Intelligence</Link>
    <h1 className="text-3xl font-semibold mt-4">30 / 60 / 90 Planner</h1>
    <p className="opacity-65 mt-2 max-w-3xl">Turn approved ideas into an execution calendar with recommended timing and approval flow.</p>

    <div className="mt-8 rounded-2xl border border-white/10 p-5 grid gap-3 md:grid-cols-[240px_1fr_auto_auto]">
      <select value={brand?.id || ''} onChange={(e)=>setBrandId(e.target.value)} className="rounded-xl border border-white/10 bg-transparent px-4 py-3">
        {data.brands.map((item)=><option key={item.id} value={item.id}>{item.name}</option>)}
      </select>
      <div className="flex gap-2">
        {[30,60,90].map((days)=><button type="button" key={days} onClick={()=>setHorizon(days)} className={"rounded-xl border px-4 py-3 "+(horizon===days?'border-white/40':'border-white/10')}>{days} days</button>)}
      </div>
      <button onClick={createPlan} disabled={!brand||working} className="rounded-xl border border-white/10 px-5 py-3 disabled:opacity-50">Create plan</button>
      <button onClick={generateSchedule} disabled={!plan||working} className="rounded-xl bg-white text-black px-5 py-3 font-medium disabled:opacity-50">{working?'Working…':'Generate schedule'}</button>
    </div>

    <div className="mt-4">
      <select value={plan?.id || ''} onChange={(e)=>setPlanId(e.target.value)} className="rounded-xl border border-white/10 bg-transparent px-4 py-3 min-w-80">
        {data.plans.map((item)=><option key={item.id} value={item.id}>{item.horizon_days} days · {String(item.starts_at || '').slice(0,10)}</option>)}
      </select>
      {message ? <span className="ml-4 text-sm opacity-65">{message}</span> : null}
    </div>

    <div className="mt-8 grid gap-4">
      {data.planItems.filter((item)=>!plan || item.plan_id===plan.id).map((item)=>(
        <div key={item.id} className="rounded-2xl border border-white/10 p-5 grid gap-4 md:grid-cols-[180px_1fr_auto] items-start">
          <div>
            <div className="text-xs opacity-50">{item.platform} · {item.format}</div>
            <div className="font-medium mt-1">{new Date(item.planned_at).toLocaleString()}</div>
            <div className="text-xs opacity-50 mt-1">{item.timezone}</div>
          </div>
          <div>
            <div className="font-medium">{item.hook || 'Untitled content item'}</div>
            {item.caption ? <div className="text-sm opacity-65 mt-2">{item.caption}</div> : null}
            <div className="text-xs opacity-50 mt-2">Status: {item.status}</div>
          </div>
          <button onClick={()=>requestApproval(item.id)} disabled={working} className="rounded-xl border border-white/10 px-4 py-2 text-sm">Request approval</button>
        </div>
      ))}
    </div>
  </div>;
}
