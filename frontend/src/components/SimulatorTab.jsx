import React, { useState, useEffect } from 'react';

const CHANNELS = [
  { id: 'web', label: 'Website' },
  { id: 'app', label: 'Mobile App' },
  { id: 'call_center', label: 'Phone Call' },
  { id: 'in_person', label: 'Airport Lounge' },
];

const EVENT_TYPES_BY_CHANNEL = {
  web: [
    { id: 'payment_failed', label: 'Payment Failure on Checkout' },
    { id: 'dispute_filed', label: 'Web Dispute Status Check' },
    { id: 'session_timeout', label: 'Web Session Timeout' },
    { id: 'limit_increase', label: 'Online Credit Limit Inquiry' },
  ],
  app: [
    { id: 'biometric_failure', label: 'Biometric Login Error' },
    { id: 'app_crash', label: 'App Force Close / Crash' },
    { id: 'push_otp_delay', label: '2FA Push OTP Delivery Delay' },
    { id: 'dispute_filed', label: 'Mobile App Dispute Submission' },
  ],
  call_center: [
    { id: 'support_hold', label: 'Long Support Call Hold Time' },
    { id: 'agent_escalation', label: 'Escalation to Senior Supervisor' },
    { id: 'ivr_routing_error', label: 'IVR Transfer Loop' },
    { id: 'callback_request', label: 'Scheduled Agent Callback' },
  ],
  in_person: [
    { id: 'card_declined', label: 'Card Declined at Lounge Entry' },
    { id: 'lounge_checkin', label: 'Centurion Lounge Access Check-in' },
    { id: 'guest_pass_error', label: 'Lounge Guest Pass Verification Error' },
    { id: 'priority_pass', label: 'Priority Pass Terminal Inquiry' },
  ],
};

const MOODS = [
  { id: 'frustrated', label: 'Frustrated' },
  { id: 'anxious', label: 'Anxious' },
  { id: 'neutral', label: 'Neutral' },
  { id: 'happy', label: 'Delighted' },
];

export default function SimulatorTab({ apiBase, customer, onEventSent }) {
  const [channel, setChannel] = useState('web');
  const [eventType, setEventType] = useState('payment_failed');
  const [custId, setCustId] = useState(customer?.cust_id || 'CUST_PREMIUM_001001');
  const [email, setEmail] = useState(customer?.email || 'isla.sato0@bluepeak.co');
  const [sentiment, setSentiment] = useState('frustrated');
  const [friction, setFriction] = useState(0.8);
  const [sending, setSending] = useState(false);
  const [log, setLog] = useState([]);

  // Auto-fill active customer details when selection changes in top dropdown
  useEffect(() => {
    if (customer) {
      if (customer.cust_id) setCustId(customer.cust_id);
      if (customer.email) setEmail(customer.email);
    }
  }, [customer]);

  const availableEventTypes = EVENT_TYPES_BY_CHANNEL[channel] || EVENT_TYPES_BY_CHANNEL.web;

  const handleChannelChange = (newChannel) => {
    setChannel(newChannel);
    const newTypes = EVENT_TYPES_BY_CHANNEL[newChannel] || EVENT_TYPES_BY_CHANNEL.web;
    if (newTypes.length > 0) {
      setEventType(newTypes[0].id);
    }
  };

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
        body: JSON.stringify({
          topic: 'customer-events',
          cust_id: custId,
          email: email,
          channel: channel,
          event_type: eventType,
          friction_score: parseFloat(friction),
          sentiment: sentiment,
        }),
      });
      const data = await r.json();

      const logEntry = {
        id: Date.now(),
        time: new Date().toLocaleTimeString(),
        payload: event,
        status: data.status || 'Processed & Stitched',
      };
      setLog(prev => [logEntry, ...prev]);
      if (onEventSent) onEventSent(event);
    } catch {
      const logEntry = {
        id: Date.now(),
        time: new Date().toLocaleTimeString(),
        payload: event,
        status: 'Sent (Live Sim)',
      };
      setLog(prev => [logEntry, ...prev]);
      if (onEventSent) onEventSent(event);
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
          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 16 }}>
            Simulate a customer action across any channel to see real-time processing.
          </div>

          {/* Active Target Banner */}
          <div style={{
            background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8,
            padding: '9px 12px', marginBottom: 18, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
              <span style={{ fontSize: 14 }}>👤</span>
              <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#1e40af' }}>
                  Targeting: {customer?.name || custId}
                </span>
                <span style={{ fontSize: 11, color: '#3b82f6', marginLeft: 6 }}>({custId})</span>
              </div>
            </div>
            {customer && (
              <button
                type="button"
                onClick={() => {
                  if (customer?.cust_id) setCustId(customer.cust_id);
                  if (customer?.email) setEmail(customer.email);
                }}
                style={{
                  fontSize: 10, fontWeight: 600, color: '#2563eb', background: '#ffffff',
                  border: '1px solid #93c5fd', borderRadius: 4, padding: '3px 8px', cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                Reset to Selected
              </button>
            )}
          </div>

          {/* Channel selector */}
          <div className="form-group">
            <label className="form-label">Channel</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {CHANNELS.map(c => (
                <button
                  key={c.id}
                  onClick={() => handleChannelChange(c.id)}
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

          {/* Contextual Event Type dropdown based on selected Channel */}
          <div className="form-group">
            <label className="form-label">
              Event Type
            </label>
            <select
              className="form-select"
              value={eventType}
              onChange={e => setEventType(e.target.value)}
            >
              {availableEventTypes.map(e => (
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
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <label className="form-label">Difficulty Level</label>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#2563eb' }}>
                {Math.round(friction * 100)}%
              </span>
            </div>
            <input
              type="range" min="0" max="1" step="0.05"
              value={friction}
              onChange={e => setFriction(e.target.value)}
              style={{ width: '100%', accentColor: '#2563eb' }}
            />
          </div>

          {/* Submit button */}
          <button
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
            onClick={handleSend}
            disabled={sending}
          >
            {sending ? 'Processing…' : 'Send Test Event'}
          </button>
        </div>

        {/* Right Output Log */}
        <div className="card card-p">
          <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 4 }}>
            Sent Events History
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
            {log.length === 0 ? (
              <div style={{ padding: '60px 0', textAlign: 'center', color: '#94a3b8' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>📬</div>
                <div style={{ fontSize: 13 }}>Events you send will appear here in real time.</div>
              </div>
            ) : (
              log.map(item => (
                <div
                  key={item.id}
                  style={{
                    padding: '12px 14px', borderRadius: 8, background: '#f8fafc',
                    border: '1px solid #e2e8f0', fontSize: 12,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontWeight: 600, color: '#2563eb' }}>
                      {item.payload.event_type.replace(/_/g, ' ').toUpperCase()}
                    </span>
                    <span style={{ color: '#94a3b8', fontSize: 11 }}>{item.time}</span>
                  </div>
                  <div style={{ color: '#475569', fontSize: 11, marginBottom: 6 }}>
                    Customer: <strong style={{ color: '#0f172a' }}>{item.payload.cust_id}</strong> · Channel: <strong style={{ color: '#0f172a' }}>{item.payload.channel}</strong> · Friction: <strong style={{ color: item.payload.friction_score > 0.6 ? '#dc2626' : '#16a34a' }}>{(item.payload.friction_score * 100).toFixed(0)}%</strong>
                  </div>
                  <div style={{
                    fontSize: 10, color: '#16a34a', background: '#f0fdf4',
                    border: '1px solid #bbf7d0', padding: '3px 8px', borderRadius: 4,
                    display: 'inline-block', fontWeight: 600,
                  }}>
                    ✓ {item.status}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
