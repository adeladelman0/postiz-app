'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useSocialIntelligence } from '@gitroom/frontend/components/social-intelligence/use.social-intelligence';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';

export default function Page() {
  const { data, request } = useSocialIntelligence();
  const fetcher = useFetch();
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [brandId, setBrandId] = useState('');
  const [horizon, setHorizon] = useState(30);
  const [planId, setPlanId] = useState('');
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState('');

  const brand = useMemo(()=>data.brands.find((x)=>x.id===brandId)||data.brands[0],[data.brands,brandId]);
  const plan = useMemo(()=>data.plans.find((x)=>x.id===planId)||data.plans[0],[data.plans,planId]);
  const approvedIdeas = data.ideas.filter((idea)=>['approved','scheduled'].includes(idea.status));

  useEffect(() => {
    fetcher('/integrations/list')
      .then((response) => response.json())
      .then((payload) => setIntegrations(payload.integrations || []))
      .catch(() => setIntegrations([]));
  }, [fetcher]);

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

  async function createPostizDraft(item:any) {
    const integration = integrations.find((candidate) => {
      const identifier = String(candidate.identifier || candidate.providerIdentifier || '').toLowerCase();
      const normalized = identifier.split('-')[0];
      return normalized === String(item.platform || '').toLowerCase() && !candidate.disabled;
    });

    if (!integration) {
      setMessage('Connect a matching ' + item.platform + ' channel in Postiz first.');
      return;
    }

    setWorking(true); setMessage('');
    try {
      const content = [item.hook, item.script, item.caption, item.cta].filter(Boolean).join('\n\n');
      const group = 'si' + String(item.id).replace(/-/g, '').slice(0, 8);
      const response = await fetcher('/posts', {
        method: 'POST',
        body: JSON.stringify({
          type: 'draft',
          shortLink: false,
          date: new Date(item.planned_at).toISOString().slice(0, 19),
          posts: [{
            integration: { id: integration.id },
            group,
            settings: { __type: integration.identifier || integration.providerIdentifier },
            value: [{ content: content || 'Draft content', delay: 0, image: [] }],
          }],
        }),
      });
      const created = await response.json();
      if (!response.ok || !created?.[0]?.postId) {
        throw new Error(created?.message || 'Could not create Postiz draft');
      }
      await request('/plan-items/' + item.id + '/postiz', 'PATCH', {
        postizPostId: created[0].postId,
        status: 'approved',
      });
      setMessage('Postiz draft created. Open the calendar to add media/settings and schedule it.');
    } catch(e:any) {
      setMessage(e.message || 'Could not create Postiz draft');
    } finally {
      setWorking(false);
    }
  }

  async function decideApproval(id:string,status:'approved'|'changes_requested'|'rejected') {
    setWorking(true); setMessage('');
    try {
      await request('/approvals/'+id,'PATCH',{status});
      setMessage('Approval updated.');
    } catch(e:any) {
      setMessage(e.message || 'Could not update approval');
    } finally {
      setWorking(false);
    }
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

    <div className="mt-8 rounded-2xl border border-white/10 p-5">
      <div className="flex items-center justify-between gap-4">
        <b>Approval queue</b>
        <span className="text-xs opacity-50">{data.approvals.filter((item)=>item.status==='pending').length} pending</span>
      </div>
      <div className="grid gap-3 mt-4 md:grid-cols-2">
        {data.approvals.map((approval)=>(
          <div key={approval.id} className="rounded-xl border border-white/10 p-4">
            <div className="flex justify-between gap-4">
              <div className="font-medium">{String(approval.plan_item_id).slice(0,8)}</div>
              <span className="text-xs opacity-60">{approval.status}</span>
            </div>
            {approval.message ? <div className="text-sm opacity-65 mt-2">{approval.message}</div> : null}
            {approval.status==='pending' ? <div className="flex gap-2 mt-4 flex-wrap">
              <button onClick={()=>decideApproval(approval.id,'approved')} disabled={working} className="rounded-lg border border-white/10 px-3 py-2 text-xs">Approve</button>
              <button onClick={()=>decideApproval(approval.id,'changes_requested')} disabled={working} className="rounded-lg border border-white/10 px-3 py-2 text-xs">Request changes</button>
              <button onClick={()=>decideApproval(approval.id,'rejected')} disabled={working} className="rounded-lg border border-white/10 px-3 py-2 text-xs">Reject</button>
            </div> : null}
          </div>
        ))}
      </div>
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
          <div className="flex flex-col gap-2">
            <button onClick={()=>requestApproval(item.id)} disabled={working} className="rounded-xl border border-white/10 px-4 py-2 text-sm">Request approval</button>
            <button onClick={()=>createPostizDraft(item)} disabled={working || !!item.postiz_post_id} className="rounded-xl border border-white/10 px-4 py-2 text-sm disabled:opacity-50">{item.postiz_post_id ? 'Postiz draft linked' : 'Create Postiz draft'}</button>
            {item.postiz_post_id ? <Link href="/launches" className="text-xs text-center underline opacity-60">Open calendar</Link> : null}
          </div>
        </div>
      ))}
    </div>
  </div>;
}
