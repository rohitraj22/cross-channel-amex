import React, { useState } from 'react';

const CHANNEL_COLORS = {
  'web':       { label: 'Website',        dot: '#2563eb', badge: 'badge-blue'   },
  'app':       { label: 'Mobile App',     dot: '#7c3aed', badge: 'badge-purple' },
  'call_center':{ label: 'Support Call',  dot: '#dc2626', badge: 'badge-red'    },
  'in_person': { label: 'In-Person',      dot: '#16a34a', badge: 'badge-green'  },
};

const SENTIMENT_COLOR = {
  happy:      '#16a34a', delighted: '#16a34a', satisfied: '#16a34a',
  neutral:    '#64748b',
  anxious:    '#d97706', frustrated: '#ea580c', angry: '#dc2626',
};

function toLabel(str) {
  if (!str) return '';
  return str.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function timeAgo(ts) {
  if (!ts) return '';
  const now = Date.now() / 1000;
  const diff = Math.max(0, now - ts);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function FrictionBar({ score }) {
  const pct = Math.min(100, Math.round((score || 0) * 100));
  const color = pct > 70 ? '#dc2626' : pct > 40 ? '#d97706' : '#16a34a';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
      <div className="risk-bar" style={{ flex: 1 }}>
        <div className="risk-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 600, color, fontFamily: 'monospace' }}>
        {pct}%
      </span>
    </div>
  );
}

export default function JourneyTab({ customer, apiBase }) {
  const [expandedId, setExpandedId] = useState(null);

  if (!customer) {
    return (
      <div className="empty">
        <div style={{ fontSize: 28 }}>👈</div>
        <div style={{ fontSize: 13, color: '#64748b' }}>Select a customer from the dropdown to view their journey.</div>
      </div>
    );
  }

  const profile   = customer.profile   || customer;
  const analytics = customer.analytics || {};
  const rawTimeline = customer.timeline  || [];
  const journeys  = customer.journeys  || [];
  const identityGraph = customer.identity_graph || { nodes: customer.nodes || [], edges: customer.edges || [] };

  // Sort activity timeline so the latest event appears first
  const timeline = [...rawTimeline].sort((a, b) => {
    const getTs = e => {
      if (typeof e.timestamp === 'number' && e.timestamp > 0) return e.timestamp;
      if (e.timestamp_iso) {
        const parsed = new Date(e.timestamp_iso).getTime() / 1000;
        if (!isNaN(parsed)) return parsed;
      }
      return 0;
    };
    return getTs(b) - getTs(a);
  });

  const churnPct  = analytics.churn_risk_pct ?? customer.churn_risk_pct ?? 0;
  const frictionIdx = analytics.friction_index ?? customer.friction_index ?? 0;
  const riskLevel = analytics.risk_level ?? customer.risk_level ?? 'LOW';
  const nba       = analytics.next_best_action ?? customer.next_best_action ?? '';
  const flagged   = timeline.filter(e => (e.friction_score || 0) > 0.6 || e.is_breakpoint);

  const riskColor = riskLevel === 'CRITICAL' || riskLevel === 'Critical' ? '#dc2626'
    : riskLevel === 'HIGH' || riskLevel === 'High' ? '#d97706' : '#16a34a';

  const isNoAction = !nba || nba.toLowerCase().includes('no immediate action required') || nba.toLowerCase().includes('continue standard engagement');
  const requiresAction = !isNoAction;

  return (
    <div>
      {/* NBA Banner */}
      {nba && (
        <div
          className={`alert-banner ${requiresAction ? ((riskLevel === 'CRITICAL' || riskLevel === 'Critical') ? '' : 'alert-banner-orange') : ''}`}
          style={{
            marginBottom: 20,
            background: requiresAction ? undefined : '#f0fdf4',
            borderColor: requiresAction ? undefined : '#bbf7d0',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <span style={{ fontSize: 20, flexShrink: 0 }}>
              {requiresAction ? ((riskLevel === 'CRITICAL' || riskLevel === 'Critical') ? '🚨' : '⚠️') : '✅'}
            </span>
            <div>
              <div style={{ fontWeight: 600, color: requiresAction ? riskColor : '#16a34a', marginBottom: 3 }}>
                {requiresAction ? 'Recommended Action' : 'Customer Status'}
              </div>
              <div style={{ fontSize: 13, color: requiresAction ? '#475569' : '#15803d', lineHeight: 1.6 }}>{nba}</div>
            </div>
          </div>
          {requiresAction && (
            <button
              className="btn btn-primary"
              onClick={() => alert(`Action Triggered for ${profile.name || profile.cust_id}:\n\n"${nba}"`)}
              style={{ flexShrink: 0, fontSize: 12 }}
            >
              Act Now
            </button>
          )}
        </div>
      )}

      {/* KPIs — Clean Light Mode */}
      <div className="kpi-grid-4">
        <div className="kpi-box">
          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 6 }}>Churn Risk</div>
          <div style={{ fontSize: 26, fontWeight: 700, color: riskColor }}>
            {churnPct.toFixed(0)}%
          </div>
        </div>
        <div className="kpi-box">
          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 6 }}>Friction Index</div>
          <div style={{ fontSize: 26, fontWeight: 700, color: '#d97706' }}>
            {frictionIdx.toFixed(0)}<span style={{ fontSize: 13, color: '#64748b' }}>/100</span>
          </div>
        </div>
        <div className="kpi-box">
          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 6 }}>Total Touchpoints</div>
          <div style={{ fontSize: 26, fontWeight: 700, color: '#2563eb' }}>
            {timeline.length}
          </div>
        </div>
        <div className="kpi-box">
          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 6 }}>Problem Touchpoints</div>
          <div style={{ fontSize: 26, fontWeight: 700, color: '#dc2626' }}>
            {flagged.length}
          </div>
        </div>
      </div>

      <div className="two-col" style={{ gap: 20 }}>

        {/* Timeline */}
        <div>
          <div style={{ marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>
              Activity Timeline · {profile.name || profile.cust_id}
            </div>
            <div style={{ fontSize: 11, color: '#64748b' }}>
              {timeline.length} events across {new Set(timeline.map(e => e.channel)).size} channels
            </div>
          </div>

          {timeline.length === 0 ? (
            <div className="card card-p" style={{ textAlign: 'center', color: '#64748b', fontSize: 13 }}>
              No timeline events found for this customer.
            </div>
          ) : (
            <div className="timeline">
              {timeline.map((evt, idx) => {
                const ch = CHANNEL_COLORS[evt.channel] || { label: toLabel(evt.channel), dot: '#64748b', badge: 'badge-gray' };
                const isFlagged = (evt.friction_score || 0) > 0.6 || evt.is_breakpoint;
                const isOpen = expandedId === evt.event_id;
                const sentColor = SENTIMENT_COLOR[(evt.sentiment || '').toLowerCase()] || '#64748b';

                return (
                  <div key={(evt.event_id || 'evt') + '_' + idx} className="timeline-item">
                    <div className="timeline-dot" style={{ borderColor: isFlagged ? '#dc2626' : ch.dot, background: isFlagged ? '#dc2626' : ch.dot }} />
                    <div
                      className="card card-p"
                      onClick={() => setExpandedId(isOpen ? null : evt.event_id)}
                      style={{ cursor: 'pointer', userSelect: 'none' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
                          <span className={`badge ${ch.badge}`}>{ch.label}</span>
                          {isFlagged && <span className="badge badge-red">⚠ Issue</span>}
                          {evt.resolution_status && evt.resolution_status !== 'resolved' && (
                            <span className="badge badge-orange">
                              {toLabel(evt.resolution_status)}
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: 11, color: '#64748b', flexShrink: 0 }}>
                          {evt.timestamp_iso ? evt.timestamp_iso.slice(0, 16).replace('T', ' ') : timeAgo(evt.timestamp)}
                        </span>
                      </div>

                      <div style={{ marginTop: 10 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', marginBottom: 4 }}>
                          {toLabel(evt.event_type)}
                        </div>
                        <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.6 }}>
                          {evt.issue_type ? toLabel(evt.issue_type) : (evt.location || ch.label)}
                          {evt.amount_usd > 0 && (
                            <span style={{ marginLeft: 8, color: '#2563eb', fontWeight: 600 }}>
                              · ${evt.amount_usd.toLocaleString()}
                            </span>
                          )}
                          {evt.agent_id && (
                            <span style={{ marginLeft: 8, color: '#64748b' }}>· Agent: {evt.agent_id}</span>
                          )}
                        </div>
                      </div>

                      <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{
                          width: 6, height: 6, borderRadius: '50%',
                          background: sentColor, display: 'inline-block', flexShrink: 0,
                        }} />
                        <span style={{ fontSize: 11, color: sentColor, fontWeight: 500 }}>
                          {toLabel(evt.sentiment) || 'Unknown'}
                        </span>
                      </div>

                      {(evt.friction_score || 0) > 0 && (
                        <div>
                          <div style={{ fontSize: 10, color: '#64748b', marginTop: 8 }}>Difficulty at this step</div>
                          <FrictionBar score={evt.friction_score} />
                        </div>
                      )}

                      {/* Expanded payload */}
                      {isOpen && evt.payload && Object.keys(evt.payload).length > 0 && (
                        <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #e2e8f0' }}>
                          <div style={{ fontSize: 11, fontWeight: 600, color: '#475569', marginBottom: 8 }}>Event Details</div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {Object.entries(evt.payload).map(([k, v]) => (
                              <div key={k} style={{
                                padding: '3px 8px', background: '#f8fafc', borderRadius: 6,
                                fontSize: 11, border: '1px solid #e2e8f0',
                              }}>
                                <span style={{ color: '#64748b' }}>{toLabel(k)}: </span>
                                <span style={{ color: '#0f172a', fontWeight: 500 }}>{String(v)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {(evt.payload && Object.keys(evt.payload).length > 0) && (
                        <div style={{ marginTop: 8, fontSize: 11, color: '#2563eb', fontWeight: 500 }}>
                          {isOpen ? '▲ Hide details' : '▼ View details'}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Journey summary */}
          {journeys.length > 0 && (
            <div className="card card-p">
              <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 14 }}>
                Issue History
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {journeys.slice(0, 5).map((j, i) => (
                  <div key={i} style={{
                    padding: '10px 12px', borderRadius: 8,
                    background: !j.resolved ? '#fef2f2' : '#f8fafc',
                    border: `1px solid ${!j.resolved ? '#fecaca' : '#e2e8f0'}`,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 12, color: '#0f172a', fontWeight: 500 }}>
                        {toLabel(j.issue_type)}
                      </span>
                      <span className={`badge ${j.resolved ? 'badge-green' : 'badge-red'}`} style={{ fontSize: 9 }}>
                        {j.resolved ? 'Resolved' : 'Open'}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>
                      {j.event_count} events · {j.channel_count} channel{j.channel_count !== 1 ? 's' : ''}
                      {j.escalated && <span style={{ color: '#d97706', marginLeft: 6 }}>· Escalated</span>}
                    </div>
                  </div>
                ))}
                {journeys.length > 5 && (
                  <div style={{ fontSize: 11, color: '#64748b', textAlign: 'center' }}>
                    +{journeys.length - 5} more journeys
                  </div>
                )}
              </div>
            </div>
          )}

          {/* How we recognised this customer */}
          {identityGraph.nodes.length > 0 && (
            <div className="card card-p">
              <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 6 }}>
                How we recognised this customer
              </div>
              <div style={{ fontSize: 12, color: '#64748b', marginBottom: 12, lineHeight: 1.6 }}>
                We matched their activity across channels using these identifiers.
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {identityGraph.nodes.slice(0, 8).map((n, i) => (
                  <div key={i} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '7px 10px', background: '#f8fafc', borderRadius: 8,
                    border: '1px solid #e2e8f0',
                  }}>
                    <span style={{ fontSize: 11, color: '#64748b', textTransform: 'capitalize' }}>
                      {toLabel(n.type)}
                    </span>
                    <span style={{ fontSize: 11, color: '#0f172a', fontFamily: 'monospace', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {n.val}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Profile */}
          <div className="card card-p">
            <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 12 }}>
              Profile
            </div>
            {[
              ['ID',        profile.cust_id],
              ['Email',     profile.email],
              ['Phone',     profile.phone],
              ['Card',      profile.card_last4 ? `**** ${profile.card_last4}` : null],
              ['Location',  profile.location],
              ['Tenure',    profile.tenure_months ? `${profile.tenure_months} months` : null],
              ['Spend/yr',  profile.annual_spend_usd ? `$${(profile.annual_spend_usd || 0).toLocaleString()}` : null],
            ].filter(([, v]) => v).map(([k, v]) => (
              <div key={k} style={{
                display: 'flex', justifyContent: 'space-between',
                padding: '7px 0', borderBottom: '1px solid #f1f5f9', fontSize: 12,
              }}>
                <span style={{ color: '#64748b' }}>{k}</span>
                <span style={{ color: '#0f172a', fontFamily: 'monospace', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'right' }}>
                  {v}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
