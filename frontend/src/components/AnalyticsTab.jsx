import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend,
} from 'recharts';

const CHANNEL_LABELS = {
  web: 'Website', app: 'Mobile App',
  call_center: 'Support Call', in_person: 'In-Person',
};
const CHANNEL_COLORS_MAP = {
  web: '#2563eb', app: '#7c3aed', call_center: '#dc2626', in_person: '#16a34a',
};

function toLabel(str) {
  if (!str) return '';
  return str.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div style={{
      background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: 8,
      padding: '8px 12px', fontSize: 12, boxShadow: '0 4px 12px rgba(15,23,42,0.08)',
    }}>
      <div style={{ fontWeight: 600, color: '#0f172a', marginBottom: 2 }}>{label}</div>
      <div style={{ color: payload[0].color || '#2563eb' }}>
        {payload[0].name}: <strong>{payload[0].value}</strong>
      </div>
    </div>
  );
};

export default function AnalyticsTab({ apiBase }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pageSize, setPageSize] = useState(12);
  const [maxCols, setMaxCols] = useState(4);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageInput, setPageInput] = useState(1);

  useEffect(() => {
    fetch(`${apiBase}/api/analytics/summary`)
      .then(r => r.json())
      .then(data => { setSummary(data); setLoading(false); })
      .catch(e => { console.error('Analytics load error:', e); setLoading(false); });
  }, [apiBase]);

  // Keep pageInput synced with currentPage state
  useEffect(() => {
    setPageInput(currentPage);
  }, [currentPage]);

  if (loading) {
    return (
      <div style={{ padding: '48px 0', textAlign: 'center', color: '#64748b', fontSize: 13 }}>
        Loading insights data…
      </div>
    );
  }

  if (!summary) return null;

  /* Data conversions for Recharts */
  const frictionSrc = summary.avg_friction_by_channel || summary.channel_friction || {};
  const channelData = Object.entries(frictionSrc).map(([ch, f]) => ({
    name: CHANNEL_LABELS[ch] || toLabel(ch),
    friction: Math.round((typeof f === 'number' ? f : 0) * 100),
    color: CHANNEL_COLORS_MAP[ch] || '#2563eb',
  }));

  const statusSrc = summary.terminal_status_distribution || summary.terminal_status || {};
  const statusData = Object.entries(statusSrc).map(([st, cnt]) => ({
    name: toLabel(st),
    count: cnt,
    color: st === 'resolved' ? '#16a34a' : st === 'pending' ? '#d97706' : '#dc2626',
  }));

  const issuesSrc = summary.issue_type_distribution || summary.top_issues || {};
  const rawIssues = Array.isArray(issuesSrc)
    ? issuesSrc
    : Object.entries(issuesSrc).map(([k, v]) => ({ issue_type: k, count: v }));
  const issueData = rawIssues.slice(0, 5).map(i => ({
    name: toLabel(i.issue_type || i.name),
    value: i.count || i.value || 0,
  }));

  const channelDistSrc = summary.channel_distribution || summary.channel_events || {};
  const channelDistData = Object.entries(channelDistSrc).map(([ch, cnt]) => ({
    name: CHANNEL_LABELS[ch] || toLabel(ch),
    value: cnt,
    color: CHANNEL_COLORS_MAP[ch] || '#2563eb',
  }));

  const severityData = Object.entries(summary.severity_distribution || {}).map(([sev, cnt]) => {
    const num = parseFloat(sev);
    let color = '#16a34a';
    if (!isNaN(num)) {
      color = num >= 0.6 ? '#dc2626' : num >= 0.3 ? '#d97706' : '#16a34a';
    } else if (sev === 'high' || sev === 'critical') {
      color = '#dc2626';
    } else if (sev === 'medium' || sev === 'moderate') {
      color = '#d97706';
    }
    return {
      name: isNaN(num) ? toLabel(sev) + ' Risk' : `${(num * 100).toFixed(0)}% Severity Risk`,
      value: cnt,
      color,
    };
  });

  const totalPages = Math.ceil(severityData.length / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedSeverityData = severityData.slice(startIndex, startIndex + pageSize);

  const handlePageInputChange = (e) => {
    const rawVal = e.target.value;
    setPageInput(rawVal);
    const val = parseInt(rawVal, 10);
    if (!isNaN(val) && val >= 1 && val <= totalPages) {
      setCurrentPage(val);
    }
  };

  const handlePageInputBlur = () => {
    const val = parseInt(pageInput, 10);
    if (isNaN(val) || val < 1) {
      setCurrentPage(1);
      setPageInput(1);
    } else if (val > totalPages) {
      setCurrentPage(totalPages);
      setPageInput(totalPages);
    } else {
      setCurrentPage(val);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* KPIs from real data */}
      <div className="kpi-grid-4">
        {[
          { label: 'Total Journeys', value: (summary.total_journeys || 0).toLocaleString(), color: '#0f172a' },
          { label: 'Total Events', value: (summary.total_events || 0).toLocaleString(), color: '#2563eb' },
          { label: 'Unresolved Journeys', value: (summary.unresolved_journeys || 0).toLocaleString(), color: '#dc2626' },
          { label: 'Escalated', value: (summary.escalated_journeys || 0).toLocaleString(), color: '#d97706' },
        ].map((k, i) => (
          <div key={i} className="kpi-box">
            <div style={{ fontSize: 11, color: '#64748b', marginBottom: 6 }}>{k.label}</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: k.color }}>
              {k.value}
            </div>
          </div>
        ))}
      </div>

      {/* Row 1 — Bar Charts */}
      <div className="two-col" style={{ gap: 20 }}>

        {/* Where customers struggle most */}
        <div className="card card-p">
          <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 4 }}>
            Where customers struggle most
          </div>
          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 20 }}>
            Average friction score per channel (0–100)
          </div>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={channelData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} domain={[0, 100]} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="friction" radius={[6, 6, 0, 0]}>
                  {channelData.map((d, i) => (
                    <Cell key={i} fill={d.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* How journeys end */}
        <div className="card card-p">
          <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 4 }}>
            How journeys end
          </div>
          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 20 }}>
            Breakdown of final resolution status
          </div>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData} layout="vertical" margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                <XAxis type="number" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={11} tickLine={false} width={80} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                  {statusData.map((d, i) => (
                    <Cell key={i} fill={d.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 2 — Pie Chart & Common Issues */}
      <div className="two-col" style={{ gap: 20 }}>

        {/* Channel distribution */}
        <div className="card card-p">
          <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 4 }}>
            Where issues start
          </div>
          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 16 }}>
            Share of events by channel
          </div>
          <div style={{ height: 220, display: 'flex', alignItems: 'center' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={channelDistData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={75}
                  innerRadius={45}
                  paddingAngle={3}
                >
                  {channelDistData.map((d, i) => (
                    <Cell key={i} fill={d.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="bottom" height={36} iconSize={10} wrapperStyle={{ fontSize: 11, color: '#64748b' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Most common issues list */}
        <div className="card card-p">
          <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 4 }}>
            Most common issues
          </div>
          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 16 }}>
            Top issue types across all journeys
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {issueData.map((d, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 14px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{
                    width: 20, height: 20, borderRadius: '50%', background: '#eff6ff', color: '#2563eb',
                    fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {i + 1}
                  </span>
                  <span style={{ fontSize: 13, color: '#0f172a', fontWeight: 500 }}>
                    {d.name}
                  </span>
                </div>
                <span style={{ fontSize: 12, color: '#64748b', fontFamily: 'monospace', fontWeight: 600 }}>
                  {d.value.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Severity distribution with Pagination & Interactive Direct Jump Controls */}
      {severityData.length > 0 && (
        <div className="card card-p">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>
                Issue severity breakdown
              </div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                Severity of all tracked customer journeys ({severityData.length} total entries)
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
              {/* Max Columns Dropdown */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <label style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>
                  Columns:
                </label>
                <select
                  className="form-select"
                  value={maxCols}
                  onChange={e => setMaxCols(Number(e.target.value))}
                  style={{ fontSize: 11, padding: '4px 8px', width: 'auto' }}
                >
                  <option value={2}>2 Columns</option>
                  <option value={4}>4 Columns</option>
                  <option value={6}>6 Columns</option>
                  <option value={8}>8 Columns</option>
                </select>
              </div>

              {/* Items Per Page Dropdown */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <label style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>
                  Items per page:
                </label>
                <select
                  className="form-select"
                  value={pageSize}
                  onChange={e => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  style={{ fontSize: 11, padding: '4px 8px', width: 'auto' }}
                >
                  <option value={8}>8 per page</option>
                  <option value={12}>12 per page</option>
                  <option value={16}>16 per page</option>
                  <option value={24}>24 per page</option>
                  <option value={32}>32 per page</option>
                </select>
              </div>

              {/* Advanced Pagination Controls: First, Prev, Direct Page Input, Next, Last */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                {/* First Page Button */}
                <button
                  className="btn btn-outline"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(1)}
                  title="First Page"
                  style={{ padding: '3px 7px', fontSize: 11, opacity: currentPage === 1 ? 0.4 : 1, cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
                >
                  |← First
                </button>

                {/* Prev Button */}
                <button
                  className="btn btn-outline"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  style={{ padding: '3px 7px', fontSize: 11, opacity: currentPage === 1 ? 0.4 : 1, cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
                >
                  ← Prev
                </button>

                {/* Direct Page Input & Total Pages */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, margin: '0 2px' }}>
                  <input
                    type="number"
                    min={1}
                    max={totalPages}
                    value={pageInput}
                    onChange={handlePageInputChange}
                    onBlur={handlePageInputBlur}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        handlePageInputBlur();
                        e.target.blur();
                      }
                    }}
                    title="Type a page number and press Enter"
                    style={{
                      width: 46,
                      padding: '3px 4px',
                      fontSize: 11,
                      fontWeight: 600,
                      textAlign: 'center',
                      borderRadius: 6,
                      border: '1px solid #cbd5e1',
                      background: '#ffffff',
                      color: '#0f172a',
                      outline: 'none',
                    }}
                  />
                  <span style={{ fontSize: 11, color: '#475569', fontWeight: 600 }}>
                    / {totalPages}
                  </span>
                </div>

                {/* Next Button */}
                <button
                  className="btn btn-outline"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  style={{ padding: '3px 7px', fontSize: 11, opacity: currentPage >= totalPages ? 0.4 : 1, cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer' }}
                >
                  Next →
                </button>

                {/* Last Page Button */}
                <button
                  className="btn btn-outline"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage(totalPages)}
                  title="Last Page"
                  style={{ padding: '3px 7px', fontSize: 11, opacity: currentPage >= totalPages ? 0.4 : 1, cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer' }}
                >
                  Last →|
                </button>
              </div>
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${maxCols}, minmax(0, 1fr))`,
            gap: 12,
          }}>
            {paginatedSeverityData.map((d, i) => (
              <div key={i} className="kpi-box" style={{ padding: '12px 14px', minHeight: 74 }}>
                <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {d.name}
                </div>
                <div style={{ fontSize: 20, fontWeight: 700, color: d.color }}>
                  {d.value.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
