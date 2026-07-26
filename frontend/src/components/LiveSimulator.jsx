import React, { useState } from 'react';

const CHANNELS = [
  { id:'web',        label:'Web Portal',        icon:'🌐', topic:'amex.web.events' },
  { id:'app',        label:'Mobile App',        icon:'📱', topic:'amex.app.events' },
  { id:'call_center',label:'Concierge Call',    icon:'📞', topic:'amex.call.events' },
  { id:'in_person',  label:'In-Person Lounge',  icon:'🏛️', topic:'amex.branch.events' },
];
const EVENT_TYPES = [
  'payment_error','page_view','app_crash','inbound_call','lounge_checkin',
  'card_declined','wire_transfer','search_faq','biometric_auth','loyalty_redeem'
];

export default function LiveSimulator() {
  const [channel, setChannel] = useState(CHANNELS[0]);
  const [eventType, setEventType] = useState(EVENT_TYPES[0]);
  const [custId, setCustId] = useState('CUST_CENTURION_101');
  const [email, setEmail] = useState('v.vance@centurion.com');
  const [phone, setPhone] = useState('+1 (212) 555-0199');
  const [friction, setFriction] = useState(0.85);
  const [sentiment, setSentiment] = useState('frustrated');
  const [publishing, setPublishing] = useState(false);
  const [logs, setLogs] = useState([]);
  const [counter, setCounter] = useState(0);

  const publish = async () => {
    setPublishing(true);
    const payload = {
      topic: channel.topic, channel: channel.id,
      event_type: eventType, cust_id: custId || null,
      email: email || null, phone: phone || null,
      friction_score: parseFloat(friction), sentiment,
      payload_json: { simulation_ref: `SIM-${Date.now()}` }
    };
    try {
      const r = await fetch('/api/events/kafka-publish', {
        method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload)
      });
      const data = r.ok ? await r.json() : null;
      const logEntry = data || {
        status: 'SIMULATED_KAFKA_PUBLISHED',
        record: { offset: counter + 1, topic: channel.topic, payload },
        flink_buffers: { buffered_event_count: 3 + counter }
      };
      setLogs(prev => [logEntry, ...prev].slice(0, 12));
      setCounter(c => c + 1);
    } catch {
      setLogs(prev => [{
        status: 'SIMULATED_KAFKA_PUBLISHED',
        record: { offset: counter + 1, topic: channel.topic, payload },
        flink_buffers: { buffered_event_count: 3 + counter }
      }, ...prev].slice(0, 12));
      setCounter(c => c + 1);
    }
    setPublishing(false);
  };

  return (
    <div style={{display:'flex', flexDirection:'column', gap:20}}>

      {/* Header */}
      <div className="card card-gold" style={{padding:'22px 28px'}}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3" style={{marginBottom:6}}>
              <span style={{fontSize:22}} className="pulse">📡</span>
              <h2 className="serif" style={{fontSize:18, fontWeight:700, color:'#f8fafc'}}>
                Apache Kafka & Flink Stateful Stream Simulator
              </h2>
            </div>
            <div style={{fontSize:12, color:'#64748b'}}>
              Publish events into Kafka topics and observe Flink 10-min sliding window stitching in real time.
            </div>
          </div>
          <div className="flex items-center gap-3" style={{
            background:'rgba(16,185,129,.06)', border:'1px solid rgba(16,185,129,.2)',
            borderRadius:10, padding:'10px 16px', fontSize:11, fontFamily:'JetBrains Mono,monospace'
          }}>
            <span style={{width:8,height:8,borderRadius:'50%',background:'#34d399',display:'inline-block'}} className="pulse" />
            <span style={{color:'#34d399', fontWeight:700}}>BROKER ONLINE</span>
            <span style={{color:'#475569'}}>· 0ms latency</span>
          </div>
        </div>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:20}}>

        {/* Event Publisher */}
        <div className="card" style={{padding:'24px'}}>
          <h3 className="serif" style={{fontSize:14, color:'#e2e8f0', fontWeight:600, marginBottom:20, paddingBottom:14, borderBottom:'1px solid rgba(226,232,240,.07)'}}>
            Fire Live Event
          </h3>

          {/* Channel Selector */}
          <div style={{marginBottom:20}}>
            <label className="form-label">Kafka Topic · Channel Touchpoint</label>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8}}>
              {CHANNELS.map(ch => (
                <button key={ch.id} onClick={() => setChannel(ch)}
                  style={{
                    padding:'12px 14px', borderRadius:10, cursor:'pointer', textAlign:'left',
                    fontFamily:'Inter,sans-serif', fontSize:11, fontWeight:600, border:'1px solid', transition:'all .2s ease',
                    background: channel.id===ch.id ? 'rgba(212,175,55,.12)' : 'rgba(5,8,15,.6)',
                    borderColor: channel.id===ch.id ? 'rgba(212,175,55,.4)' : 'rgba(226,232,240,.07)',
                    color: channel.id===ch.id ? '#D4AF37' : '#64748b',
                  }}>
                  <span style={{fontSize:18, display:'block', marginBottom:4}}>{ch.icon}</span>
                  {ch.label}
                  <div className="mono" style={{fontSize:9, color:'#475569', marginTop:2}}>{ch.topic}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Event Type */}
          <div style={{marginBottom:16}}>
            <label className="form-label">Event Type</label>
            <select className="form-select" value={eventType} onChange={e=>setEventType(e.target.value)}>
              {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {/* Customer ID + Email */}
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16}}>
            <div>
              <label className="form-label">Customer ID</label>
              <input className="form-input" value={custId} onChange={e=>setCustId(e.target.value)} placeholder="CUST_CENTURION_101" />
            </div>
            <div>
              <label className="form-label">Email Identifier</label>
              <input className="form-input" value={email} onChange={e=>setEmail(e.target.value)} placeholder="email@centurion.com" />
            </div>
          </div>

          {/* Friction + Sentiment */}
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:24}}>
            <div>
              <label className="form-label">Friction Score (0.0 – 1.0)</label>
              <input className="form-input" type="number" step="0.05" min="0" max="1" value={friction} onChange={e=>setFriction(e.target.value)} />
            </div>
            <div>
              <label className="form-label">Sentiment State</label>
              <select className="form-select" value={sentiment} onChange={e=>setSentiment(e.target.value)}>
                {['delighted','satisfied','neutral','anxious','frustrated','angry'].map(s => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>

          <button className="btn btn-gold" onClick={publish} disabled={publishing}
            style={{width:'100%', justifyContent:'center', padding:'14px', fontSize:13, borderRadius:12}}>
            {publishing ? '⏳ Publishing to Kafka Bus…' : `🚀 Publish to ${channel.topic}`}
          </button>
        </div>

        {/* Flink Windowing Log */}
        <div className="card" style={{padding:'24px', display:'flex', flexDirection:'column', gap:16}}>
          <div className="flex items-center justify-between" style={{paddingBottom:14, borderBottom:'1px solid rgba(226,232,240,.07)'}}>
            <h3 className="serif" style={{fontSize:14, color:'#e2e8f0', fontWeight:600}}>
              Flink Stateful Window Log
            </h3>
            <span className="mono" style={{fontSize:9, color:'#34d399'}}>10-MIN SLIDING WINDOW</span>
          </div>

          {logs.length === 0 ? (
            <div className="empty-state" style={{flex:1, padding:'48px 24px'}}>
              <div style={{fontSize:36, marginBottom:12}}>📡</div>
              <div style={{fontSize:12, color:'#475569', lineHeight:1.7}}>
                No events published yet. Use the form to fire an event and observe Flink stateful window stitching.
              </div>
            </div>
          ) : (
            <div style={{overflowY:'auto', flex:1, display:'flex', flexDirection:'column', gap:10, maxHeight:480}}>
              {logs.map((log, i) => (
                <div key={i} className="animate-in" style={{
                  background:'rgba(5,8,15,.7)', border:'1px solid rgba(226,232,240,.07)',
                  borderRadius:12, padding:'14px 16px',
                  borderLeft: `3px solid ${log.status?.includes('SIMULATED') ? '#fbbf24' : '#34d399'}`
                }}>
                  <div className="flex items-center justify-between" style={{marginBottom:8}}>
                    <span style={{
                      fontSize:10, fontWeight:700, fontFamily:'Inter,sans-serif', textTransform:'uppercase', letterSpacing:'.06em',
                      color: log.status?.includes('SIMULATED') ? '#fbbf24' : '#34d399'
                    }}>
                      {log.status || 'PUBLISHED'}
                    </span>
                    <span className="mono" style={{fontSize:10, color:'#475569'}}>offset #{log.record?.offset}</span>
                  </div>
                  <pre style={{margin:0, fontSize:10, maxHeight:100, overflowY:'auto', padding:'10px 12px', borderRadius:8}}>
                    {JSON.stringify(log.record?.payload || {}, null, 2)}
                  </pre>
                  <div className="flex items-center justify-between" style={{marginTop:10, paddingTop:10, borderTop:'1px solid rgba(226,232,240,.05)'}}>
                    <span className="mono" style={{fontSize:10, color:'#475569'}}>
                      Buffered sessions: <strong style={{color:'#94a3b8'}}>{log.flink_buffers?.buffered_event_count || 0}</strong>
                    </span>
                    <span style={{fontSize:10, color:'#34d399', fontWeight:700}}>✓ Timeline Updated</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
