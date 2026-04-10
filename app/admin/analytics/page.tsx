'use client';
import { useState } from 'react';
import { LineChart,Line,BarChart,Bar,Cell,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,Legend,AreaChart,Area } from 'recharts';
import ChartCard from '@/components/admin/ChartCard';
import { revenueData, categoryData, topProducts } from '@/lib/admin/mockData';
import { TrendingUp, TrendingDown } from 'lucide-react';

const TS = {background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:12,fontSize:12,color:'var(--text-primary)'};
function fmt(n:number){return n>=100000?`₹${(n/100000).toFixed(1)}L`:n>=1000?`₹${(n/1000).toFixed(0)}K`:`₹${n}`;}

export default function AnalyticsPage() {
  const [tab,setTab]=useState<'revenue'|'products'>('revenue');

  return (
    <div className="p-4 sm:p-6 max-w-[1400px] mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{color:'var(--text-primary)',fontFamily:'var(--font-display)',letterSpacing:'-0.03em'}}>Analytics</h1>
        <p className="text-[13px] mt-0.5" style={{color:'var(--text-muted)'}}>Deep insights into your store performance</p>
      </div>

      {/* Revenue over time */}
      <ChartCard title="Revenue Over Time" sub="Monthly revenue, profit and orders — full year" className="mb-4">
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={revenueData} margin={{top:4,right:4,left:0,bottom:0}}>
            <defs>
              <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="var(--accent)" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="profGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--success)" stopOpacity={0.15}/>
                <stop offset="95%" stopColor="var(--success)" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false}/>
            <XAxis dataKey="month" tick={{fontSize:11,fill:'var(--text-muted)'}} axisLine={false} tickLine={false}/>
            <YAxis tickFormatter={v=>fmt(v)} tick={{fontSize:10,fill:'var(--text-muted)'}} axisLine={false} tickLine={false} width={55}/>
            <Tooltip contentStyle={TS} formatter={(v:any)=>fmt(v)}/>
            <Legend iconType="circle" iconSize={8} wrapperStyle={{fontSize:11}}/>
            <Area type="monotone" dataKey="revenue" stroke="var(--accent)" strokeWidth={2.5} fill="url(#revGrad)" name="Revenue"/>
            <Area type="monotone" dataKey="profit"  stroke="var(--success)" strokeWidth={2} fill="url(#profGrad)" name="Profit" strokeDasharray="5 3"/>
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4">
        {/* Category comparison */}
        <ChartCard title="Revenue by Category" sub="Top 4 categories this year">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={categoryData} layout="vertical" margin={{top:0,right:16,left:0,bottom:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false}/>
              <XAxis type="number" tickFormatter={v=>fmt(v)} tick={{fontSize:10,fill:'var(--text-muted)'}} axisLine={false} tickLine={false}/>
              <YAxis type="category" dataKey="name" tick={{fontSize:11,fill:'var(--text-secondary)'}} axisLine={false} tickLine={false} width={80}/>
              <Tooltip contentStyle={TS} formatter={(v:any)=>fmt(v)}/>
              <Bar dataKey="revenue" radius={[0,6,6,0]} name="Revenue">
                {categoryData.map((e,i)=><Cell key={i} fill={e.color}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Product performance mini table */}
        <ChartCard title="Product Performance" sub="Views, add-to-cart, conversions">
          <div className="space-y-3">
            {topProducts.slice(0,5).map(p=>(
              <div key={p.name}>
                <div className="flex justify-between mb-1">
                  <span className="text-[12px] font-semibold truncate" style={{color:'var(--text-primary)',maxWidth:'60%'}}>{p.name}</span>
                  <div className="flex gap-3 text-[11px]" style={{color:'var(--text-muted)'}}>
                    <span style={{color:'var(--cold-blue)',fontWeight:600}}>{p.cart}% cart</span>
                    <span style={{color:p.conv>7?'var(--success)':'var(--warning)',fontWeight:600}}>{p.conv}% conv</span>
                  </div>
                </div>
                <div className="h-1.5 rounded-full" style={{background:'var(--bg-secondary)'}}>
                  <div className="h-full rounded-full" style={{width:`${Math.min(p.conv*8,100)}%`,background:p.conv>7?'var(--success)':'var(--warning)',transition:'width 1s ease'}}/>
                </div>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      {/* Refunds / returns mock */}
      <ChartCard title="Refunds & Returns" sub="Monthly refund count and value">
        <div className="grid grid-cols-3 gap-4">
          {[{label:'Refund Rate',value:'2.3%',sub:'Industry avg 3.1%',good:true},{label:'Returned Orders',value:'28',sub:'This month',good:true},{label:'Refund Value',value:'₹41,200',sub:'Nov 2024',good:false}].map(c=>(
            <div key={c.label} className="p-4 rounded-xl text-center" style={{background:'var(--bg-secondary)'}}>
              <div className="text-[22px] font-bold" style={{color:c.good?'var(--success)':'var(--accent)',fontFamily:'var(--font-display)'}}>{c.value}</div>
              <div className="text-[11px] font-bold mt-1" style={{color:'var(--text-primary)'}}>{c.label}</div>
              <div className="text-[10px] mt-0.5" style={{color:'var(--text-muted)'}}>{c.sub}</div>
            </div>
          ))}
        </div>
      </ChartCard>
    </div>
  );
}

// Need Cell import