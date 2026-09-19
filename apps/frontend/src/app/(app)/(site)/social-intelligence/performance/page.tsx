'use client';

import Link from 'next/link';
import { FormEvent, useMemo, useState } from 'react';
import { useSocialIntelligence } from '@gitroom/frontend/components/social-intelligence/use.social-intelligence';

export default function Page() {
  const { data, request } = useSocialIntelligence();
  const [postId,setPostId]=useState('');
  const [planItemId,setPlanItemId]=useState('');
  const [platform,setPlatform]=useState('instagram');
  const [views,setViews]=useState('');
  const [likes,setLikes]=useState('');
  const [comments,setComments]=useState('');
  const [shares,setShares]=useState('');
  const [saves,setSaves]=useState('');
  const [brandId,setBrandId]=useState('');
  const [insight,setInsight]=useState('');
  const [working,setWorking]=useState(false);
  const [message,setMessage]=useState('');

  const brand=useMemo(()=>data.brands.find((x)=>x.id===brandId)||data.brands[0],[data.brands,brandId]);

  async function savePerformance(e:FormEvent){
    e.preventDefault(); setWorking(true); setMessage('');
    try {
      await request('/performance','POST',{
        planItemId: planItemId || undefined,
        postizPostId:postId, platform,
        metrics:{views:Number(views||0),likes:Number(likes||0),comments:Number(comments||0),shares:Number(shares||0),saves:Number(saves||0)},
        observedAt:new Date().toISOString(),
      });
      setMessage('Observed performance saved.');
      setPostId(''); setViews(''); setLikes(''); setComments(''); setShares(''); setSaves('');
    } catch(e:any){setMessage(e.message||'Could not save performance');}
    finally{setWorking(false);}
  }

  async function saveInsight(){
    if(!brand||!insight)return;
    setWorking(true); setMessage('');
    try{
      await request('/insights','POST',{
        brandProfileId:brand.id,
        insightType:'performance-learning',
        insight,
        evidence:data.performance.slice(0,20).map((x)=>x.id),
        confidence:0.6,
      });
      setInsight(''); setMessage('Learning insight saved.');
    }catch(e:any){setMessage(e.message||'Could not save insight');}
    finally{setWorking(false);}
  }

  async function syncAll(){
    const linked=data.planItems.filter((item)=>item.postiz_post_id);
    if(!linked.length)return;
    setWorking(true); setMessage('');
    try{
      for(const item of linked){
        await request('/performance/sync/'+item.id,'POST',{days:30});
      }
      if(brand){
        await request('/learning/'+brand.id+'/recompute','POST',{});
      }
      setMessage('All linked Postiz performance was synced and the learning loop was refreshed.');
    }catch(e:any){setMessage(e.message||'Could not sync all performance');}
    finally{setWorking(false);}
  }

  async function syncPostiz(planItemId:string){
    setWorking(true); setMessage('');
    try{
      const result=await request<any>('/performance/sync/'+planItemId,'POST',{days:30});
      if(result?.missing){ setMessage('The published platform post is not available for analytics.'); }
      else if(!result){ setMessage('No published Postiz post is linked to this planner item yet.'); }
      else { setMessage('Published analytics synced from Postiz.'); }
    }catch(e:any){setMessage(e.message||'Could not sync published analytics');}
    finally{setWorking(false);}
  }

  async function recompute(){
    if(!brand)return;
    setWorking(true); setMessage('');
    try{
      await request('/learning/'+brand.id+'/recompute','POST',{});
      setMessage('Learning insight recomputed from observed performance.');
    }catch(e:any){setMessage(e.message||'Could not recompute learning');}
    finally{setWorking(false);}
  }

  return <div className="p-6 md:p-10 max-w-[1500px] mx-auto w-full">
    <Link href="/social-intelligence" className="text-sm opacity-60">← Social Intelligence</Link>
    <h1 className="text-3xl font-semibold mt-4">Learning Loop</h1>
    <p className="opacity-65 mt-2 max-w-3xl">Observed post metrics become evidence for the next strategy, idea batch and plan.</p>

    <div className="mt-8 rounded-2xl border border-white/10 p-5">
      <div className="flex justify-between gap-4 items-center"><div><b>Published Postiz sync</b><div className="text-xs opacity-50 mt-1">official connected-account analytics</div></div><button onClick={syncAll} disabled={working || !data.planItems.some((item)=>item.postiz_post_id)} className="rounded-xl bg-white text-black px-4 py-2 text-sm disabled:opacity-50">Sync all + learn</button></div>
      <div className="flex flex-wrap gap-2 mt-4">
        {data.planItems.filter((item)=>item.postiz_post_id).map((item)=><button key={item.id} onClick={()=>syncPostiz(item.id)} disabled={working} className="rounded-xl border border-white/10 px-4 py-3 text-sm disabled:opacity-50">{item.platform} · {item.hook || String(item.id).slice(0,8)}</button>)}
        {!data.planItems.some((item)=>item.postiz_post_id) ? <div className="text-sm opacity-55">Create and link Postiz drafts from the Planner first.</div> : null}
      </div>
    </div>

    <form onSubmit={savePerformance} className="mt-8 rounded-2xl border border-white/10 p-5 grid gap-3 md:grid-cols-4">
      <select value={planItemId} onChange={(e)=>{
        setPlanItemId(e.target.value);
        const item=data.planItems.find((x)=>x.id===e.target.value);
        if(item?.postiz_post_id) setPostId(item.postiz_post_id);
        if(item?.platform) setPlatform(item.platform);
      }} className="rounded-xl border border-white/10 bg-transparent px-4 py-3 md:col-span-2">
        <option value="">Optional planner item</option>
        {data.planItems.map((item)=><option key={item.id} value={item.id}>{item.platform} · {item.hook || String(item.id).slice(0,8)}</option>)}
      </select>
      <input required value={postId} onChange={(e)=>setPostId(e.target.value)} placeholder="Postiz post ID" className="rounded-xl border border-white/10 bg-transparent px-4 py-3 md:col-span-2" />
      <select value={platform} onChange={(e)=>setPlatform(e.target.value)} className="rounded-xl border border-white/10 bg-transparent px-4 py-3"><option>instagram</option><option>facebook</option><option>tiktok</option><option>youtube</option><option>linkedin</option><option>x</option><option>threads</option></select>
      <button disabled={working} className="rounded-xl bg-white text-black px-5 py-3 font-medium disabled:opacity-50">Save observed metrics</button>
      {[['Views',views,setViews],['Likes',likes,setLikes],['Comments',comments,setComments],['Shares',shares,setShares],['Saves',saves,setSaves]].map(([label,value,setter]:any)=><input key={label} type="number" min="0" value={value} onChange={(e)=>setter(e.target.value)} placeholder={label} className="rounded-xl border border-white/10 bg-transparent px-4 py-3" />)}
    </form>

    <div className="mt-6 rounded-2xl border border-white/10 p-5 grid gap-3 md:grid-cols-[220px_1fr_auto]">
      <select value={brand?.id || ''} onChange={(e)=>setBrandId(e.target.value)} className="rounded-xl border border-white/10 bg-transparent px-4 py-3">{data.brands.map((item)=><option key={item.id} value={item.id}>{item.name}</option>)}</select>
      <input value={insight} onChange={(e)=>setInsight(e.target.value)} placeholder="Evidence-backed learning, e.g. tutorial videos drove more saves than product posts" className="rounded-xl border border-white/10 bg-transparent px-4 py-3" />
      <div className="flex gap-2">
        <button onClick={saveInsight} disabled={!brand||!insight||working} className="rounded-xl border border-white/10 px-4 py-3 disabled:opacity-50">Add insight</button>
        <button onClick={recompute} disabled={!brand||working} className="rounded-xl bg-white text-black px-4 py-3 disabled:opacity-50">Recompute</button>
      </div>
    </div>

    {message ? <div className="mt-4 text-sm opacity-65">{message}</div> : null}

    <div className="mt-8 grid gap-4 lg:grid-cols-2">
      <div className="rounded-2xl border border-white/10 p-5">
        <div className="flex justify-between"><b>Performance snapshots</b><span className="text-xs opacity-50">{data.performance.length}</span></div>
        <div className="space-y-3 mt-4 max-h-[520px] overflow-auto">
          {data.performance.map((item)=><div key={item.id} className="rounded-xl border border-white/10 p-3"><div className="text-sm font-medium">{item.platform} · {item.postiz_post_id}</div><pre className="text-xs opacity-60 mt-2 whitespace-pre-wrap">{JSON.stringify(item.metrics,null,2)}</pre></div>)}
        </div>
      </div>
      <div className="rounded-2xl border border-white/10 p-5">
        <div className="flex justify-between"><b>Learning insights</b><span className="text-xs opacity-50">{data.insights.length}</span></div>
        <div className="space-y-3 mt-4">
          {data.insights.map((item)=><div key={item.id} className="rounded-xl border border-white/10 p-3"><div className="text-xs opacity-50">{item.insight_type} · confidence {item.confidence ?? 'n/a'}</div><div className="text-sm mt-2">{item.insight}</div></div>)}
        </div>
      </div>
    </div>
  </div>;
}
