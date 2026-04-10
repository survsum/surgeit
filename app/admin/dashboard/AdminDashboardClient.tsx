'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  IndianRupee, ShoppingCart, Users, TrendingUp, Package,
  ArrowUpRight, Percent, Activity,
} from 'lucide-react';
import StatCard from '@/components/admin/StatCard';
import ChartCard from '@/components/admin/ChartCard';
import { revenueData, weeklyRevenue, categoryData, orderStatusData, topProducts } from '@/lib/admin/mockData';
import { formatPrice } from '@/lib/utils';

const RANGES = ['7D','30D','3M','12M'] as const;
type Range = typeof RANGES[number];

const rangeData: Record<Range, typeof revenueData> = {
  '7D':  weeklyRevenue.map(d=>({month:d.day,revenue:d.revenue,orders:d.orders,profit:Math.round(d.revenue*0.38)})),
  '30D': revenueData.slice(9,12),
  '3M':  revenueData.slice(9,12),
  '12M': revenueData,
};

function fmt(n:number){ return n>=100000?`₹${(n/100000).toFixed(1)}L`:n>=1000?`₹${(n/1000).toFixed(0)}K`:`₹${n}`; }

const TOOLTIP_STYLE = {
  background:'var(--bg-card)',border:'1px solid var(--border)',
  borderRadius:12,fontSize:12,color:'var(--text-primary)',
};

export default function AdminDashboardClient({stats,recentOrders}:{stats:any,recentOrders:any[]}) {
  const [range, setRange] = useState<Range>('12M');
  const data = rangeData[range];
  const totalRev = data.reduce((s,d)=>s+d.revenue,0);
  const totalOrd = data.reduce((s,d)=>s+d.orders,0);
  const totalProfit = data.reduce((s,d)=>s+d.profit,0);

  const STATUS_COLOR:Record<string,string> = {
    pending:'var(--text-muted)', paid:'var(--warning)',
    shipped:'var(--cold-blue)', delivered:'var(--success)',
  };

  return (
    <div className="p-4 sm:p-6 max-w-[1400px] mx-auto">
      {/* Page header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{color:'var(--text-primary)',fontFamily:'var(--font-display)',letterSpacing:'-0.03em'}}>
              Overview
            </h1>
            <p className="text-[13px] mt-0.5" style={{color:'var(--text-muted)'}}>
              Cold Dog Admin · {new Date().toLocaleDateString('en-IN',{weekday:'long',month:'long',day:'numeric'})}
            </p>
          </div>
          {/* Range selector */}
          <div className="flex gap-1 p-1 rounded-xl" style={{background:'var(--bg-secondary)',border:'1px solid var(--border)'}}>
            {RANGES.map(r=>(
              <button key={r} onClick={()=>setRange(r)}
                className="px-3 py-1.5 rounded-lg text-[12px] font-bold transition-all"
                style={{
                  background:range===r?'var(--bg-card)':'transparent',
                  color:range===r?'var(--accent)':'var(--text-muted)',
                  border:range===r?'1px solid var(--border)':'1px solid transparent',
                }}>
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <StatCard label="Total Revenue" value={fmt(totalRev)} sub="Selected period" trend={18} icon={IndianRupee} iconColor="var(--accent)" delay={0} />
        <StatCard label="Total Orders" value={totalOrd} sub={`${(totalRev/totalOrd/1000).toFixed(1)}K AOV`} trend={12} icon={ShoppingCart} iconColor="var(--cold-blue)" delay={0.06} />
        <StatCard label="Net Profit" value={fmt(totalProfit)} sub={`${((totalProfit/totalRev)*100).toFixed(0)}% margin`} trend={9} icon={TrendingUp} iconColor="var(--success)" delay={0.12} />
        <StatCard label="Conversion Rate" value="3.8%" sub="vs 3.2% last period" trend={4} icon={Percent} iconColor="var(--warning)" delay={0.18} />
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <StatCard label="Customers" value={stats.customers??248} trend={22} icon={Users} iconColor="#7c3aed" delay={0.24} />
        <StatCard label="Products" value={stats.products} icon={Package} iconColor="var(--cold-blue)" delay={0.30} />
        <StatCard label="Avg. Order Value" value={fmt(Math.round(totalRev/totalOrd))} icon={Activity} iconColor="var(--warning)" delay={0.36} />
        <StatCard label="Repeat Rate" value="34%" sub="Returning customers" trend={7} icon={ArrowUpRight} iconColor="var(--success)" delay={0.42} />
      </div>

      {/* Revenue + category charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 mb-3 sm:mb-4">
        <ChartCard title="Revenue & Profit" sub="Over selected period" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data} margin={{top:4,right:4,left:0,bottom:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="month" tick={{fontSize:11,fill:'var(--text-muted)'}} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={v=>fmt(v)} tick={{fontSize:10,fill:'var(--text-muted)'}} axisLine={false} tickLine={false} width={52} />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v:any)=>fmt(v)} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{fontSize:11}} />
              <Line type="monotone" dataKey="revenue" stroke="var(--accent)" strokeWidth={2.5} dot={false} name="Revenue" />
              <Line type="monotone" dataKey="profit" stroke="var(--success)" strokeWidth={2} dot={false} strokeDasharray="4 3" name="Profit" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Sales by Category" sub="Revenue distribution">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={categoryData} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                dataKey="value" paddingAngle={3}>
                {categoryData.map((entry,i)=><Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v:any)=>`${v}%`} />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-1.5 mt-1">
            {categoryData.map(c=>(
              <div key={c.name} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{background:c.color}} />
                <span className="text-[11px]" style={{color:'var(--text-muted)'}}>{c.name} <span style={{color:'var(--text-primary)',fontWeight:600}}>{c.value}%</span></span>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      {/* Orders by status + weekly bar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 mb-3 sm:mb-4">
        <ChartCard title="Weekly Orders" sub="Orders per day this week">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={weeklyRevenue} margin={{top:4,right:4,left:-20,bottom:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="day" tick={{fontSize:11,fill:'var(--text-muted)'}} axisLine={false} tickLine={false} />
              <YAxis tick={{fontSize:10,fill:'var(--text-muted)'}} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Bar dataKey="orders" fill="var(--cold-blue)" radius={[6,6,0,0]} name="Orders" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Order Status" sub="Current breakdown" className="lg:col-span-2">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            {orderStatusData.map(s=>(
              <div key={s.status} className="p-3 rounded-xl text-center" style={{background:'var(--bg-secondary)'}}>
                <div className="text-[20px] font-bold" style={{color:s.color,fontFamily:'var(--font-display)'}}>{s.count}</div>
                <div className="text-[10px] font-semibold tracking-wide mt-0.5" style={{color:'var(--text-muted)'}}>{s.status}</div>
                <div className="mt-1.5 h-1 rounded-full" style={{background:'var(--bg-hover)'}}>
                  <div className="h-full rounded-full transition-all duration-700" style={{width:`${s.pct}%`,background:s.color}} />
                </div>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      {/* Top products table */}
      <ChartCard title="Top Products" sub="By revenue this period">
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr style={{borderBottom:'1px solid var(--border)'}}>
                {['Product','Sales','Revenue','Views','Cart Rate','Conv %','Stock'].map(h=>(
                  <th key={h} className="py-2 px-2 text-left font-bold uppercase tracking-wider" style={{color:'var(--text-muted)',fontSize:10}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {topProducts.map((p,i)=>(
                <tr key={p.name} className="transition-colors"
                  style={{borderBottom:'1px solid var(--border)'}}
                  onMouseEnter={e=>(e.currentTarget.style.background='var(--bg-secondary)')}
                  onMouseLeave={e=>(e.currentTarget.style.background='transparent')}>
                  <td className="py-2.5 px-2 font-semibold" style={{color:'var(--text-primary)'}}>{p.name}</td>
                  <td className="py-2.5 px-2" style={{color:'var(--text-secondary)'}}>{p.sales}</td>
                  <td className="py-2.5 px-2 font-semibold" style={{color:'var(--cold-blue)'}}>{fmt(p.revenue)}</td>
                  <td className="py-2.5 px-2" style={{color:'var(--text-secondary)'}}>{p.views.toLocaleString()}</td>
                  <td className="py-2.5 px-2" style={{color:'var(--text-secondary)'}}>{p.cart}%</td>
                  <td className="py-2.5 px-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                      style={{background:p.conv>7?'var(--success-light)':'var(--warning-light)',color:p.conv>7?'var(--success)':'var(--warning)'}}>
                      {p.conv}%
                    </span>
                  </td>
                  <td className="py-2.5 px-2">
                    <span style={{color:p.stock<15?'var(--accent)':'var(--success)',fontWeight:600}}>{p.stock}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartCard>

      {/* Recent orders */}
      {recentOrders.length>0&&(
        <ChartCard title="Recent Orders" sub="Latest transactions" className="mt-4">
          <div className="space-y-2">
            {recentOrders.slice(0,5).map(o=>(
              <div key={o.id} className="flex items-center justify-between py-2 px-3 rounded-xl transition-colors"
                style={{background:'var(--bg-secondary)'}}
                onMouseEnter={e=>(e.currentTarget.style.background='var(--bg-hover)')}
                onMouseLeave={e=>(e.currentTarget.style.background='var(--bg-secondary)')}>
                <div>
                  <p className="text-[13px] font-semibold" style={{color:'var(--text-primary)'}}>{o.customerName}</p>
                  <p className="text-[11px]" style={{color:'var(--text-muted)'}}>{o.email} · #{o.id.slice(-8).toUpperCase()}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[12px] px-2 py-0.5 rounded-full font-bold capitalize"
                    style={{color:STATUS_COLOR[o.status]||'var(--text-muted)',background:'var(--bg-card)'}}>
                    {o.status}
                  </span>
                  <span className="text-[14px] font-bold" style={{color:'var(--text-primary)'}}>{formatPrice(o.total)}</span>
                </div>
              </div>
            ))}
          </div>
        </ChartCard>
      )}
    </div>
  );
}
