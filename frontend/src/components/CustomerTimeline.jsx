import React, { useState } from 'react';

const CHANNEL_META = {
  web:       { label:'Web Portal',       icon:'🌐', cls:'badge-web',    dot:'#38bdf8' },
  app:       { label:'Mobile App',       icon:'📱', cls:'badge-app',    dot:'#c084fc' },
  call_center:{ label:'Concierge Call',  icon:'📞', cls:'badge-call',   dot:'#fb7185' },
  in_person: { label:'In-Person Lounge', icon:'🏛️', cls:'badge-branch', dot:'#D4AF37' },
};

function formatTime(ts) {
  return new Date(ts * 1000).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
}
function formatDate(ts) {
  return new Date(ts * 1000).toLocaleDateString([], {month:'short', day:'numeric'});
}

function SentimentPill({ s }) {
  const map = {
    satisfied: {color:'#34d399', bg:'rgba(16,185,129,.12)', label:'Satisfied'},
    delighted:  {color:'#34d399', bg:'rgba(16,185,129,.12)', label:'Delighted'},
    neutral:    {color:'#94a3b8', bg:'rgba(148,163,184,.08)', label:'Neutral'},
    anxious:    {color:'#fbbf24', bg:'rgba(251,191,36,.12)', label:'Anxious'},
    frustrated: {color:'#fb7185', bg:'rgba(244,63,94,.12)', label:'Frustrated'},
    angry:      {color:'#ef4444', bg:'rgba(239,68,68,.15)', label:'Angry'},
  };
  const m = map[s] || map.neutral;
  return (
    <span style={{
      padding:'2px 9px', borderRadius:99, fontSize:10, fontWeight:700,
      fontFamily:'Inter,sans-serif', textTransform:'uppercase', letterSpacing:'.05em',
      color: m.color, background: m.bg
    }}>{m.label}</span>
  );
}

function FrictionBar({ score }) {
  const pct = Math.round(score * 100);
  const color = pct > 70 ? '#ef4444' : pct > 40 ? '#f59e0b' : '#34d399';
  return (
    <div style={{display:'flex', alignItems:'center', gap:8}}>
      <div className="progress-bar" style={{flex:1}}>
        <div className="progress-fill" style={{width:`${pct}%`, background:`linear-gradient(90deg,${color},${color}aa)`}} />
      </div>
      <span className="mono" style={{fontSize:10, color, minWidth:32}}>{pct}%</span>
    </div>
  );
}

export default function CustomerTimeline({ customer }) {
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState('ALL');

  if (!customer) return <div className="empty-state">Select a customer to view timeline.</div>;

  const { profile, timeline = [], analytics } = customer;
  const prof = profile || customer;
  const an = analytics || customer;

  const channels = ['ALL', ...new Set((timeline||[]).map(e=>e.channel))];
  const filtered = filter === 'ALL' ? timeline : timeline.filter(e => e.channel === filter);

  const riskColor = an.risk_level === 'CRITICAL' ? '#ef4444' : an.risk_level === 'HIGH' ? '#f59e0b' : '#34d399';

  return (
    <div style={{display:'flex', flexDirection:'column', gap:20}}>

      {/* ── PROFILE HERO CARD ── */}
      <div className="card card-gold" style={{padding:'28px 32px'}}>
        <div className="flex items-center justify-between flex-wrap gap-6">
          {/* Left: Avatar & Info */}
          <div className="flex items-center gap-5">
            <div style={{
              width:64, height:64, borderRadius:'50%', flexShrink:0,
              background:'linear-gradient(135deg,rgba(212,175,55,.25),rgba(212,175,55,.05))',
              border:'2px solid rgba(212,175,55,.4)',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:22, fontWeight:700, color:'#D4AF37', fontFamily:'Cinzel,serif',
              boxShadow:'0 0 24px rgba(212,175,55,.15)'
            }}>
              {(prof.name||'?').split(' ').map(n=>n[0]).join('')}
            </div>
            <div>
              <div className="flex items-center gap-3" style={{marginBottom:6}}>
                <h2 className="serif" style={{fontSize:22, fontWeight:700, color:'#f8fafc'}}>
                  {prof.name || customer.name}
                </h2>
                <span className="badge badge-gold">{prof.tier || customer.tier}</span>
              </div>
              <div className="flex flex-wrap gap-4 mono" style={{fontSize:11, color:'#64748b'}}>
                <span>🪪 <strong style={{color:'#94a3b8'}}>{prof.cust_id || customer.cust_id}</strong></span>
                <span>✉️ <strong style={{color:'#94a3b8'}}>{prof.email || customer.email}</strong></span>
                <span>📞 <strong style={{color:'#94a3b8'}}>{prof.phone || customer.phone}</strong></span>
                <span>📍 <strong style={{color:'#94a3b8'}}>{prof.location || customer.location}</strong></span>
              </div>
            </div>
          </div>

          {/* Right: Risk Metrics */}
          <div className="flex gap-4">
            <div className="stat-box" style={{textAlign:'center', minWidth:110}}>
              <div style={{fontSize:10, color:'#64748b', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:6, fontFamily:'Inter,sans-serif'}}>Friction Index</div>
              <div className="metric-number" style={{color:'#fbbf24', fontSize:32}}>
                {an.friction_index || 0}
              </div>
              <div style={{fontSize:10, color:'#475569', marginTop:2}}>/100</div>
            </div>
            <div className="stat-box" style={{textAlign:'center', minWidth:110}}>
              <div style={{fontSize:10, color:'#64748b', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:6, fontFamily:'Inter,sans-serif'}}>Churn Risk</div>
              <div className="metric-number" style={{color: riskColor, fontSize:32}}>
                {an.churn_risk_pct || 0}%
              </div>
              <div style={{marginTop:4}}>
                <span className={`badge badge-${(an.risk_level||'low').toLowerCase()}`}>
                  {an.risk_level}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── NBA BANNER ── */}
      {an.next_best_action && (
        <div className="nba-banner">
          <div className="flex items-center gap-3">
            <span style={{fontSize:22}}>⚡</span>
            <div>
              <div style={{fontSize:10, color:'#D4AF37', textTransform:'uppercase', letterSpacing:'.1em', fontWeight:700, marginBottom:3}}>
                Proactive Next Best Action (NBA)
              </div>
              <div style={{fontSize:13, color:'#e2e8f0', fontWeight:500}}>{an.next_best_action}</div>
            </div>
          </div>
          <button className="btn btn-gold" style={{flexShrink:0, fontSize:11}}>Execute →</button>
        </div>
      )}

      {/* ── MAIN ASYMMETRIC LAYOUT ── */}
      <div style={{display:'grid', gridTemplateColumns:'2fr 1fr', gap:20}}>

        {/* LEFT: Timeline */}
        <div className="card" style={{padding:'24px 28px'}}>
          {/* Header + Filter */}
          <div className="flex items-center justify-between" style={{marginBottom:24, paddingBottom:16, borderBottom:'1px solid rgba(226,232,240,.07)'}}>
            <h3 className="serif" style={{fontSize:15, color:'#e2e8f0', fontWeight:600}}>
              ⏱ Unified Journey Timeline
              <span className="mono" style={{fontSize:11, color:'#475569', marginLeft:10, fontFamily:'Inter,sans-serif', fontWeight:400}}>
                {filtered.length} events
              </span>
            </h3>
            <div className="flex gap-1" style={{background:'rgba(5,8,15,.6)', border:'1px solid rgba(226,232,240,.07)', borderRadius:10, padding:4}}>
              {channels.map(ch => (
                <button key={ch} onClick={() => setFilter(ch)}
                  style={{
                    padding:'4px 12px', borderRadius:7, fontSize:10, fontWeight:700,
                    textTransform:'uppercase', letterSpacing:'.04em', cursor:'pointer', border:'none',
                    fontFamily:'Inter,sans-serif', transition:'all .2s ease',
                    background: filter===ch ? 'rgba(212,175,55,.2)' : 'transparent',
                    color: filter===ch ? '#D4AF37' : '#64748b',
                    border: filter===ch ? '1px solid rgba(212,175,55,.35)' : '1px solid transparent',
                  }}>
                  {ch === 'call_center' ? 'CALL' : ch === 'in_person' ? 'LOUNGE' : ch}
                </button>
              ))}
            </div>
          </div>

          {/* Timeline Items */}
          <div className="timeline-wrapper">
            {filtered.map((evt, i) => {
              const meta = CHANNEL_META[evt.channel] || CHANNEL_META.web;
              const isHigh = evt.friction_score >= 0.7;
              const isSel = selected?.event_id === evt.event_id;
              return (
                <div key={evt.event_id} style={{position:'relative', marginBottom:14}} onClick={() => setSelected(isSel ? null : evt)}>
                  {/* Dot */}
                  <div className={`timeline-dot ${isHigh ? 'timeline-dot-rose' : 'timeline-dot-gold'}`}
                    style={{top:18}} />
                  {/* Card */}
                  <div className={`event-card ${isSel?'selected':''} ${isHigh?'friction':''}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div style={{flex:1, minWidth:0}}>
                        <div className="flex items-center flex-wrap gap-2" style={{marginBottom:8}}>
                          <span className={`badge ${meta.cls}`}>{meta.icon} {meta.label}</span>
                          <span className="mono" style={{fontSize:10, color:'#475569'}}>
                            {formatDate(evt.timestamp)} · {formatTime(evt.timestamp)}
                          </span>
                          <SentimentPill s={evt.sentiment} />
                          {isHigh && (
                            <span style={{
                              display:'inline-flex', alignItems:'center', gap:4,
                              fontSize:10, color:'#fb7185', background:'rgba(244,63,94,.1)',
                              padding:'2px 8px', borderRadius:99, fontWeight:700, border:'1px solid rgba(244,63,94,.25)'
                            }}>⚠ Friction Alert</span>
                          )}
                        </div>
                        <div style={{fontSize:14, fontWeight:600, color:'#f0f4fc', marginBottom:4, textTransform:'capitalize'}}>
                          {evt.event_type.replace(/_/g,' ')}
                        </div>
                        <div className="mono" style={{fontSize:11, color:'#64748b', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>
                          {evt.payload?.call_reason || evt.payload?.action || evt.payload?.url || evt.payload?.venue || evt.location}
                        </div>
                        {/* Friction mini-bar */}
                        <div style={{marginTop:10}}>
                          <FrictionBar score={evt.friction_score} />
                        </div>
                      </div>
                      <span style={{color:'#334155', fontSize:16, transition:'transform .2s ease', transform: isSel?'rotate(90deg)':'none'}}>›</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT: Event Detail Panel */}
        <div className="flex-col" style={{display:'flex', flexDirection:'column', gap:16}}>
          <h3 className="serif" style={{fontSize:14, color:'#e2e8f0', fontWeight:600}}>
            Event Inspection
          </h3>

          {selected ? (
            <div className="detail-panel">
              {/* Header */}
              <div className="card" style={{padding:'20px 22px'}}>
                <div className="flex items-center justify-between" style={{marginBottom:14}}>
                  <span className={`badge ${CHANNEL_META[selected.channel]?.cls}`}>
                    {CHANNEL_META[selected.channel]?.icon} {CHANNEL_META[selected.channel]?.label}
                  </span>
                  <SentimentPill s={selected.sentiment} />
                </div>
                <div style={{fontSize:15, fontWeight:700, color:'#f0f4fc', textTransform:'capitalize', marginBottom:10}}>
                  {selected.event_type.replace(/_/g,' ')}
                </div>
                <div className="grid-2" style={{gap:10}}>
                  <div className="stat-box">
                    <div style={{fontSize:10, color:'#64748b', marginBottom:4}}>Friction Score</div>
                    <div className="mono" style={{fontSize:22, fontWeight:700, color: selected.friction_score > .6 ? '#fb7185' : '#34d399'}}>
                      {Math.round(selected.friction_score * 100)}%
                    </div>
                  </div>
                  <div className="stat-box">
                    <div style={{fontSize:10, color:'#64748b', marginBottom:4}}>Location</div>
                    <div style={{fontSize:11, color:'#94a3b8', fontWeight:500, lineHeight:1.4}}>{selected.location || 'Digital'}</div>
                  </div>
                </div>
              </div>

              {/* Call Transcript */}
              {selected.channel === 'call_center' && selected.payload?.transcript && (
                <div className="card" style={{padding:'18px 20px', borderColor:'rgba(251,113,133,.2)'}}>
                  <div className="flex items-center justify-between" style={{marginBottom:12}}>
                    <span style={{fontSize:11, fontWeight:700, color:'#fb7185', textTransform:'uppercase', letterSpacing:'.07em'}}>
                      📞 Audio Transcript
                    </span>
                    {selected.payload?.ivr_duration_sec && (
                      <span className="mono" style={{fontSize:10, color:'#475569'}}>
                        IVR: {selected.payload.ivr_duration_sec}s
                      </span>
                    )}
                  </div>
                  <div style={{
                    background:'rgba(5,8,15,.8)', border:'1px solid rgba(226,232,240,.06)',
                    borderRadius:10, padding:14, fontFamily:'JetBrains Mono,monospace',
                    fontSize:11, color:'#94a3b8', lineHeight:1.8, whiteSpace:'pre-wrap',
                    maxHeight:220, overflowY:'auto'
                  }}>
                    {selected.payload.transcript}
                  </div>
                </div>
              )}

              {/* Payload Inspector */}
              <div className="card" style={{padding:'18px 20px'}}>
                <div style={{fontSize:10, fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:12}}>
                  Raw Event Payload
                </div>
                <pre style={{maxHeight:180, overflowY:'auto', fontSize:10}}>
                  {JSON.stringify(selected.payload, null, 2)}
                </pre>
              </div>

              {/* Identifiers */}
              <div className="card" style={{padding:'18px 20px'}}>
                <div style={{fontSize:10, fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:12}}>
                  Stitched Identifiers
                </div>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(selected.identifiers || {}).filter(([,v])=>v).map(([k,v]) => (
                    <div key={k} style={{
                      padding:'5px 12px', borderRadius:8, background:'rgba(5,8,15,.7)',
                      border:'1px solid rgba(226,232,240,.07)', fontSize:10, fontFamily:'JetBrains Mono,monospace'
                    }}>
                      <span style={{color:'#475569'}}>{k}: </span>
                      <strong style={{color:'#D4AF37'}}>{String(v)}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="card" style={{padding:40, textAlign:'center', color:'#334155'}}>
              <div style={{fontSize:36, marginBottom:12}}>↖</div>
              <div style={{fontSize:12, lineHeight:1.7, color:'#475569'}}>
                Click any event in the timeline to inspect call transcripts, raw payloads, and identity headers.
              </div>
            </div>
          )}

          {/* Explainability Card */}
          {an.explainability?.feature_contributions && (
            <div className="card" style={{padding:'20px 22px'}}>
              <div style={{fontSize:11, fontWeight:700, color:'#D4AF37', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:16}}>
                🧠 SHAP Explainability Breakdown
              </div>
              <div style={{display:'flex', flexDirection:'column', gap:10}}>
                {an.explainability.feature_contributions.map((feat, i) => (
                  <div key={i} style={{
                    background:'rgba(5,8,15,.5)', border:'1px solid rgba(226,232,240,.06)',
                    borderRadius:10, padding:12
                  }}>
                    <div className="flex items-center justify-between" style={{marginBottom:6}}>
                      <span style={{fontSize:11, color:'#e2e8f0', fontWeight:600}}>{feat.feature}</span>
                      <span className="mono" style={{
                        fontSize:11, fontWeight:700,
                        color: feat.direction==='INCREASES_RISK' ? '#fb7185' : '#34d399'
                      }}>
                        {feat.direction==='INCREASES_RISK' ? '+' : ''}{feat.impact_points}
                      </span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{
                        width:`${Math.min(Math.abs(feat.impact_points)/50*100,100)}%`,
                        background: feat.direction==='INCREASES_RISK'
                          ? 'linear-gradient(90deg,#ef4444,#f59e0b)'
                          : 'linear-gradient(90deg,#34d399,#06b6d4)'
                      }} />
                    </div>
                    <div style={{fontSize:10, color:'#475569', marginTop:6}}>{feat.description}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
