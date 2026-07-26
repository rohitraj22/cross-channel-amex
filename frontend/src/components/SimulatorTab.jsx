import React, { useState } from 'react';

const CHANNELS = [
  { id: 'web',          label: 'Website' },
  { id: 'app',          label: 'Mobile App' },
  { id: 'call_center',  label: 'Phone Call' },
  { id: 'in_person',    label: 'Airport Lounge' },
];

const EVENT_TYPES = [
  { id: 'payment_failed',    label: 'Payment Failed' },
  { id: 'biometric_failure', label: 'Biometric Login Error' },
  { id: 'dispute_filed',     label: 'Dispute Status Check' },
  { id: 'card_declined',     label: 'Card Declined at Lounge' },
  { id: 'support_hold',      label: 'Long Support Hold' },
  { id: 'limit_increase',    label: 'Credit Limit Inquiry' },
];

const MOODS = [
  { id: 'frustrated', label: 'Frustrated' },
  { id: 'anxious',    label: 'Anxious' },
  { id: 'neutral',    label: 'Neutral' },
  { id: 'happy',      label: 'Delighted' },
];

export default function SimulatorTab({ apiBase }) {
  const [channel, setChannel]     = useState('web');
  const [eventType, setEventType] = useState('payment_failed');
  const [custId, setCustId]       = useState('CUST_PREMIUM_001001');
  const [email, setEmail]         = useState('isla.sato0@bluepeak.co');
  const [sentiment, setSentiment] = useState('frustrated');
  const [friction, setFriction]   = useState(0.8);
  const [sending, setSending]     = useState(false);
  const [log, setLog]             = useState([]);

  const handleSend = async () => {
    setSending(true);
    const event = {
      cust_id: custId,
      channel,
      event_type: eventType,
      sentiment,
      friction_score: parseFloat(friction),
      identifiers: { cust_id: custId, email },
      timestamp: Date.now() / 1000,
    };

    try {
      const r = await fetch(`${apiBase}/api/events/kafka-publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
      });
      const data = await r.json();

      const logEntry = {
        id: Date.now(),
        time: new Date().toLocaleTimeString(),
        payload: event,
        status: data.status || 'Processed',
      };
      setLog(prev => [logEntry, ...prev]);
    } catch {
      const logEntry = {
        id: Date.now(),
        time: new Date().toLocaleTimeString(),
        payload: event,
        status: 'Sent (Local Sim)',
      };
      setLog(prev => [logEntry, ...prev]);
    }
    setSending(false);
  };

  return (
    <div>
      {/* KPIs — Simple business status metrics */}
      <div className="kpi-grid-4">
        <div className="kpi-box">
          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 6 }}>Channel Status</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#16a34a', lineHeight: 1.3 }}>
            Active / Online
          </div>
        </div>
        <div className="kpi-box">
          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 6 }}>Processing Mode</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#2563eb', lineHeight: 1.3 }}>
            Real-Time Live
          </div>
        </div>
        <div className="kpi-box">
          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 6 }}>Event Stream</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#7c3aed', lineHeight: 1.3 }}>
            Connected
          </div>
        </div>
        <div className="kpi-box">
          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 6 }}>Events Sent</div>
          <div style={{ fontSize: 26, fontWeight: 700, color: '#16a34a', lineHeight: 1.2 }}>
            {log.length}
          </div>
        </div>
      </div>

      <div className="two-col" style={{ gap: 20 }}>

        {/* Left Form */}
        <div className="card card-p">
          <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 4 }}>
            Send a Test Event
          </div>
          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 20 }}>
            Simulate a customer action across any channel to see real-time processing.
          </div>

          {/* Channel selector */}
          <div className="form-group">
            <label className="form-label">Channel</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {CHANNELS.map(c => (
                <button
                  key={c.id}
                  onClick={() => setChannel(c.id)}
                  style={{
                    padding: '9px 12px', borderRadius: 8, fontSize: 12, fontWeight: 500,
                    cursor: 'pointer', border: '1px solid', textAlign: 'left',
                    background: channel === c.id ? '#eff6ff' : '#ffffff',
                    borderColor: channel === c.id ? '#2563eb' : '#cbd5e1',
                    color: channel === c.id ? '#2563eb' : '#475569',
                    transition: 'all .15s ease',
                  }}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Event type */}
          <div className="form-group">
            <label className="form-label">Event Type</label>
            <select
              className="form-select"
              value={eventType}
              onChange={e => setEventType(e.target.value)}
            >
              {EVENT_TYPES.map(e => (
                <option key={e.id} value={e.id}>{e.label}</option>
              ))}
            </select>
          </div>

          {/* Customer info */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Customer ID</label>
              <input
                type="text" className="form-input"
                value={custId} onChange={e => setCustId(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="text" className="form-input"
                value={email} onChange={e => setEmail(e.target.value)}
              />
            </div>
          </div>

          {/* Mood */}
          <div className="form-group">
            <label className="form-label">Customer Mood</label>
            <select
              className="form-select"
              value={sentiment}
              onChange={e => setSentiment(e.target.value)}
            >
              {MOODS.map(m => (
                <option key={m.id} value={m.id}>{m.label}</option>
              ))}
            </select>
          </div>

          {/* Difficulty slider */}
          <div className="form-group">
            <label className="form-label">
              Difficulty Level — {Math.round(friction * 100)}%
            </label>
            <input
              type="range" min="0" max="1" step="0.05"
              value={friction}
              onChange={e => setFriction(e.target.value)}
              style={{ width: '100%', accentColor: '#2563eb' }}
            />
          </div>

          <button
            className="btn btn-primary w-full"
            onClick={handleSend}
            disabled={sending}
            style={{ justifyContent: 'center', padding: 11, marginTop: 4, fontSize: 13 }}
          >
            {sending ? 'Sending…' : '⚡ Send Test Event'}
          </button>
        </div>

        {/* Right Log */}
        <div className="card card-p" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 16 }}>
            Sent Events History
            {log.length > 0 && (
              <span style={{ marginLeft: 8, fontSize: 11, color: '#64748b', fontWeight: 400 }}>
                ({log.length} event{log.length > 1 ? 's' : ''})
              </span>
            )}
          </div>

          {log.length === 0 ? (
            <div className="empty" style={{ flex: 1 }}>
              <div style={{ fontSize: 32 }}>📤</div>
              <div style={{ fontSize: 13, color: '#64748b' }}>
                Events you send will appear here in real time.
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto', maxHeight: 440 }}>
              {log.map(entry => (
                <div key={entry.id} className="fade-up" style={{
                  background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 9, padding: '12px 14px',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 11, color: '#16a34a', fontWeight: 600 }}>✓ {entry.status}</span>
                    <span style={{ fontSize: 11, color: '#64748b' }}>{entry.time}</span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {[
                      ['Channel', entry.payload.channel],
                      ['Event', entry.payload.event_type],
                      ['Customer', entry.payload.cust_id],
                      ['Mood', entry.payload.sentiment],
                    ].map(([k, v]) => (
                      <div key={k} style={{
                        padding: '3px 8px', background: '#ffffff', borderRadius: 6,
                        fontSize: 11, border: '1px solid #e2e8f0',
                      }}>
                        <span style={{ color: '#64748b' }}>{k}: </span>
                        <span style={{ color: '#0f172a', fontWeight: 500 }}>{v}</span>
                      </div>
                    ))}
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
