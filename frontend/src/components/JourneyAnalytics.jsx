import React, { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
} from 'recharts';

const MOCK_OLAP = {
  avg_friction_by_channel: { web: 0.49, app: 0.95, call_center: 0.83, in_person: 0.0 },
  channel_counts: { web: 2, app: 1, call_center: 1, in_person: 1 },
  query_time_ms: 1.42,
  total_rows_scanned: 12540
};

const FLOWS = [
  { from:'Web Portal', to:'Concierge Call', count:42, friction:'HIGH',   color:'#fb7185', reason:'Payment Timeout Escalation' },
  { from:'Mobile App', to:'Web FAQ',        count:28, friction:'MODERATE',color:'#fbbf24', reason:'App Crash Self-Service' },
  { from:'Call Center', to:'In-Person',     count:19, friction:'LOW',    color:'#34d399', reason:'Lounge Reservation Resolution' },
  { from:'Web Portal', to:'Mobile App',     count:14, friction:'LOW',    color:'#34d399', reason:'Digital Channel Transition' },
];

const CHURN_DRIVERS = [
  { driver:'App Crash During Transfer', correlation:0.91, color:'#ef4444' },
  { driver:'Web Payment Timeout',       correlation:0.85, color:'#f59e0b' },
  { driver:'IVR Hold >6 min',           correlation:0.72, color:'#f59e0b' },
  { driver:'Lounge Concierge Resolution', correlation:-0.60, color:'#34d399' },
  { driver:'FaceID Auth Success',       correlation:-0.35, color:'#34d399' },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background:'rgba(10,14,24,.97)', border:'1px solid rgba(212,175,55,.25)',
      borderRadius:10, padding:'10px 14px', fontFamily:'JetBrains Mono,monospace', fontSize:11
    }}>
      <div style={{color:'#D4AF37', fontWeight:700, marginBottom:4}}>{label}</div>
      {payload.map((p,i) => (
        <div key={i} style={{color:'#94a3b8'}}>
          {p.name}: <strong style={{color:'#f0f4fc'}}>{typeof p.value === 'number' ? p.value.toFixed(1) : p.value}</strong>
        </div>
      ))}
    </div>
  );
};

export default function JourneyAnalytics() {
  const [olap] = useState(MOCK_OLAP);

  const frictionData = [
    { channel: 'Web Portal', friction: Math.round((olap.avg_friction_by_channel.web || 0.49) * 100) },
    { channel: 'Mobile App', friction: Math.round((olap.avg_friction_by_channel.app || 0.95) * 100) },
    { channel: 'Call Center', friction: Math.round((olap.avg_friction_by_channel.call_center || 0.83) * 100) },
    { channel: 'In-Person', friction: Math.round((olap.avg_friction_by_channel.in_person || 0.0) * 100) },
  ];

  const radarData = [
    { subject: 'Web', A: 49 }, { subject: 'App', A: 95 }, { subject: 'Call', A: 83 },
    { subject: 'Lounge', A: 0 }, { subject: 'IVR', A: 72 },
  ];

  return (
    <div style={{display:'flex', flexDirection:'column', gap:20}}>

      {/* Header */}
      <div className="card card-gold" style={{padding:'22px 28px'}}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3" style={{marginBottom:6}}>
              <span style={{fontSize:22}}>⚡</span>
              <h2 className="serif" style={{fontSize:18, fontWeight:700, color:'#f8fafc'}}>
                ClickHouse Sub-Second Journey Analytics
              </h2>
            </div>
            <div style={{fontSize:12, color:'#64748b'}}>
              Real-time SIMD vectorized columnar aggregations — friction hotspots, drop-offs, and churn correlation.
            </div>
          </div>
          <div className="flex gap-4">
            <div className="stat-box" style={{textAlign:'center', minWidth:110}}>
              <div style={{fontSize:10, color:'#64748b', marginBottom:4}}>Query Response</div>
              <div className="mono" style={{fontSize:28, fontWeight:700, color:'#34d399'}}>
                {olap.query_time_ms}ms
              </div>
            </div>
            <div className="stat-box" style={{textAlign:'center', minWidth:110}}>
              <div style={{fontSize:10, color:'#64748b', marginBottom:4}}>Rows Scanned</div>
              <div className="mono" style={{fontSize:28, fontWeight:700, color:'#fbbf24'}}>
                {(olap.total_rows_scanned/1000).toFixed(1)}k
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 1: Charts */}
      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:20}}>

        {/* Friction Bar Chart */}
        <div className="card" style={{padding:'24px 24px 16px'}}>
          <div style={{fontSize:13, fontWeight:700, color:'#e2e8f0', marginBottom:4}}>
            📊 Channel Friction Index (%)
          </div>
          <div style={{fontSize:11, color:'#475569', marginBottom:20}}>Average friction score per touchpoint</div>
          <div style={{height:240}}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={frictionData} margin={{top:5,right:10,left:-20,bottom:0}}>
                <XAxis dataKey="channel" stroke="#334155" tick={{fontSize:10, fontFamily:'Inter,sans-serif', fill:'#64748b'}} />
                <YAxis stroke="#334155" tick={{fontSize:10, fontFamily:'JetBrains Mono,monospace', fill:'#64748b'}} domain={[0,100]} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="friction" radius={[6,6,0,0]} name="Friction %">
                  {frictionData.map((e,i) => (
                    <Cell key={i} fill={e.friction>70?'#ef4444':e.friction>40?'#f59e0b':'#34d399'}
                      fillOpacity={.85} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Radar Chart */}
        <div className="card" style={{padding:'24px 24px 16px'}}>
          <div style={{fontSize:13, fontWeight:700, color:'#e2e8f0', marginBottom:4}}>
            🎯 Multi-Dimensional Friction Radar
          </div>
          <div style={{fontSize:11, color:'#475569', marginBottom:20}}>Friction signal across all touchpoints</div>
          <div style={{height:240}}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(226,232,240,.08)" />
                <PolarAngleAxis dataKey="subject" tick={{fontSize:10, fill:'#64748b', fontFamily:'Inter,sans-serif'}} />
                <PolarRadiusAxis tick={false} axisLine={false} domain={[0,100]} />
                <Radar name="Friction" dataKey="A" stroke="#D4AF37" fill="#D4AF37" fillOpacity={.15} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 2: Sankey Flow + Churn Matrix */}
      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:20}}>

        {/* Channel Flow */}
        <div className="card" style={{padding:'24px'}}>
          <div style={{fontSize:13, fontWeight:700, color:'#e2e8f0', marginBottom:4}}>
            🔀 Cross-Channel Escalation Flows
          </div>
          <div style={{fontSize:11, color:'#475569', marginBottom:20}}>Journey transitions driving call center escalations</div>
          <div style={{display:'flex', flexDirection:'column', gap:12}}>
            {FLOWS.map((f, i) => (
              <div key={i} style={{
                background:'rgba(5,8,15,.6)', border:'1px solid rgba(226,232,240,.07)',
                borderRadius:12, padding:'14px 18px',
                borderLeft:`3px solid ${f.color}`,
              }}>
                <div className="flex items-center justify-between" style={{marginBottom:8}}>
                  <div className="mono" style={{fontSize:11, color:'#94a3b8'}}>
                    <strong style={{color: f.color}}>{f.from}</strong>
                    <span style={{color:'#334155'}}> ──▶ </span>
                    <strong style={{color: f.color}}>{f.to}</strong>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="mono" style={{fontSize:14, fontWeight:700, color:'#f0f4fc'}}>{f.count}</span>
                    <span style={{fontSize:10, color:'#475569'}}>journeys</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span style={{fontSize:10, color:'#64748b'}}>{f.reason}</span>
                  <span style={{
                    padding:'2px 8px', borderRadius:99, fontSize:9, fontWeight:700,
                    fontFamily:'Inter,sans-serif', textTransform:'uppercase',
                    color: f.color, background:`${f.color}18`, border:`1px solid ${f.color}40`
                  }}>{f.friction}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Churn Correlation */}
        <div className="card" style={{padding:'24px'}}>
          <div style={{fontSize:13, fontWeight:700, color:'#e2e8f0', marginBottom:4}}>
            📉 Explainable Churn Driver Correlation
          </div>
          <div style={{fontSize:11, color:'#475569', marginBottom:20}}>Spearman correlation with 90-day churn events</div>
          <div style={{display:'flex', flexDirection:'column', gap:12}}>
            {CHURN_DRIVERS.map((d, i) => {
              const pct = Math.abs(d.correlation) * 100;
              return (
                <div key={i} style={{background:'rgba(5,8,15,.5)', border:'1px solid rgba(226,232,240,.06)', borderRadius:10, padding:14}}>
                  <div className="flex items-center justify-between" style={{marginBottom:8}}>
                    <span style={{fontSize:11, color:'#e2e8f0', fontWeight:600}}>{d.driver}</span>
                    <span className="mono" style={{fontSize:12, fontWeight:700, color: d.color}}>
                      {d.correlation > 0 ? '+' : ''}{d.correlation.toFixed(2)}
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{
                      width:`${pct}%`,
                      background: d.correlation > 0
                        ? `linear-gradient(90deg,${d.color},${d.color}88)`
                        : `linear-gradient(90deg,${d.color},${d.color}88)`
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
