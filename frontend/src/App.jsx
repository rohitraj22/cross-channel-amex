import React, { useState, useEffect, useCallback, useRef } from 'react';
import './index.css';
import JourneyTab from './components/JourneyTab';
import AnalyticsTab from './components/AnalyticsTab';
import SimulatorTab from './components/SimulatorTab';

const API = 'http://localhost:8000';

/* ── Risk helpers ── */
function riskLevel(pct) {
  if (pct >= 40) return 'Critical';
  if (pct >= 25) return 'High';
  if (pct >= 12) return 'Moderate';
  return 'Low';
}

function getChurnRisk(c) {
  if (!c) return 0;
  if (typeof c.churn_risk_pct === 'number' && c.churn_risk_pct > 0) return c.churn_risk_pct;
  if (typeof c.analytics?.churn_risk_pct === 'number') return c.analytics.churn_risk_pct;
  if (typeof c.churn_probability === 'number') return c.churn_probability * 100;
  return 0;
}

function getFrictionIndex(c) {
  if (!c) return 0;
  if (typeof c.friction_index === 'number' && c.friction_index > 0) return c.friction_index;
  if (typeof c.analytics?.friction_index === 'number') return c.analytics.friction_index;
  return 0;
}

function getRiskLevelLabel(c) {
  if (!c) return 'Low';
  const riskStr = (c.risk_level || c.analytics?.risk_level || '').toUpperCase();
  if (riskStr === 'CRITICAL' || riskStr === 'HIGH' || riskStr === 'MODERATE' || riskStr === 'LOW') {
    return riskStr.charAt(0) + riskStr.slice(1).toLowerCase();
  }
  const pct = getChurnRisk(c);
  return riskLevel(pct);
}

function RiskBadge({ level }) {
  const cls = level === 'Critical' ? 'badge-red'
    : level === 'High' ? 'badge-orange'
      : level === 'Moderate' ? 'badge-purple'
        : 'badge-green';
  return <span className={`badge ${cls}`}>{level} Risk</span>;
}

function SearchableCustomerDropdown({ customers, selected, onSelect }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [tierFilter, setTierFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('churn_risk_desc');
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = customers.filter(c => {
    const q = search.toLowerCase().trim();
    const matchSearch = !q ||
      (c.name && c.name.toLowerCase().includes(q)) ||
      (c.cust_id && c.cust_id.toLowerCase().includes(q)) ||
      (c.email && c.email.toLowerCase().includes(q)) ||
      (c.location && c.location.toLowerCase().includes(q)) ||
      (c.tier && c.tier.toLowerCase().includes(q));

    const lvl = getRiskLevelLabel(c).toUpperCase();
    const matchRisk = riskFilter === 'ALL' || lvl === riskFilter;

    const tier = (c.tier || '').toUpperCase();
    const matchTier = tierFilter === 'ALL' || tier.includes(tierFilter);

    return matchSearch && matchRisk && matchTier;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'churn_risk_desc') return getChurnRisk(b) - getChurnRisk(a);
    if (sortBy === 'friction_desc') return getFrictionIndex(b) - getFrictionIndex(a);
    if (sortBy === 'name_asc') return (a.name || a.cust_id).localeCompare(b.name || b.cust_id);
    if (sortBy === 'id_asc') return (a.cust_id || '').localeCompare(b.cust_id || '');
    if (sortBy === 'spend_desc') return (b.annual_spend_usd || 0) - (a.annual_spend_usd || 0);
    if (sortBy === 'tenure_desc') return (b.tenure_months || 0) - (a.tenure_months || 0);
    return 0;
  });

  return (
    <div ref={dropdownRef} style={{ position: 'relative', minWidth: 360 }}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '9px 14px', background: '#ffffff', border: '1px solid #2563eb',
          borderRadius: 8, color: '#0f172a', fontSize: 13, cursor: 'pointer',
          textAlign: 'left', transition: 'all .2s', boxShadow: '0 2px 8px rgba(37,99,235,.12)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
          <span style={{ fontSize: 14 }}>👤</span>
          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            <span style={{ fontWeight: 600, color: '#0f172a' }}>
              {selected?.name || selected?.cust_id || 'Select Customer'}
            </span>
            {selected?.cust_id && (
              <span style={{ fontSize: 11, color: '#64748b', marginLeft: 6 }}>({selected.cust_id})</span>
            )}
          </div>
        </div>
        <span style={{ fontSize: 10, color: '#2563eb', marginLeft: 8 }}>{isOpen ? '▲' : '▼'}</span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div style={{
          position: 'absolute', top: '100%', right: 0, marginTop: 6,
          background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: 12,
          boxShadow: '0 12px 36px rgba(15,23,42,0.12)', zIndex: 100, padding: 14,
          display: 'flex', flexDirection: 'column', gap: 10, width: 420, maxHeight: 480,
        }}>
          {/* Search Input */}
          <input
            type="text"
            className="form-input"
            placeholder="🔍 Search name, ID (e.g. 001001), email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            autoFocus
            style={{ fontSize: 12, padding: '8px 12px' }}
          />

          {/* Filter & Sort Controls Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div>
              <label style={{ fontSize: 10, color: '#475569', fontWeight: 600, display: 'block', marginBottom: 3 }}>
                SORT BY
              </label>
              <select
                className="form-select"
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                style={{ fontSize: 11, padding: '5px 8px' }}
              >
                <option value="churn_risk_desc">Highest Risk First</option>
                <option value="friction_desc">Highest Friction First</option>
                <option value="name_asc">Name (A–Z)</option>
                <option value="id_asc">Customer ID</option>
                <option value="spend_desc">Annual Spend (High → Low)</option>
                <option value="tenure_desc">Tenure (Longest First)</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 10, color: '#475569', fontWeight: 600, display: 'block', marginBottom: 3 }}>
                TIER FILTER
              </label>
              <select
                className="form-select"
                value={tierFilter}
                onChange={e => setTierFilter(e.target.value)}
                style={{ fontSize: 11, padding: '5px 8px' }}
              >
                <option value="ALL">All Tiers</option>
                <option value="GREEN">Green</option>
                <option value="GOLD">Gold</option>
                <option value="PLATINUM">Platinum</option>
                <option value="CENTURION">Centurion</option>
              </select>
            </div>
          </div>

          {/* Risk Level Filter Pills */}
          <div>
            <label style={{ fontSize: 10, color: '#475569', fontWeight: 600, display: 'block', marginBottom: 4 }}>
              RISK LEVEL
            </label>
            <div style={{ display: 'flex', gap: 4, overflowX: 'auto' }}>
              {['ALL', 'CRITICAL', 'HIGH', 'MODERATE', 'LOW'].map(f => (
                <button
                  key={f}
                  onClick={() => setRiskFilter(f)}
                  style={{
                    padding: '3px 9px', borderRadius: 6, fontSize: 10, fontWeight: 600,
                    border: '1px solid', cursor: 'pointer', fontFamily: 'inherit',
                    background: riskFilter === f ? '#eff6ff' : '#f8fafc',
                    borderColor: riskFilter === f ? '#2563eb' : '#e2e8f0',
                    color: riskFilter === f ? '#2563eb' : '#64748b',
                  }}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div style={{ fontSize: 10, color: '#64748b', padding: '0 2px' }}>
            Showing {sorted.length} of {customers.length} customers
          </div>

          {/* Customer Items List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, overflowY: 'auto', maxHeight: 260, paddingRight: 2 }}>
            {sorted.length === 0 ? (
              <div style={{ padding: 16, textAlign: 'center', color: '#64748b', fontSize: 12 }}>
                No matching customers found.
              </div>
            ) : (
              sorted.map(c => {
                const isSel = selected?.cust_id === c.cust_id;
                const riskLabel = getRiskLevelLabel(c);
                const churnRisk = getChurnRisk(c);
                return (
                  <div
                    key={c.cust_id}
                    onClick={() => {
                      onSelect(c);
                      setIsOpen(false);
                    }}
                    style={{
                      padding: '9px 12px', borderRadius: 8, cursor: 'pointer',
                      background: isSel ? '#eff6ff' : '#ffffff',
                      border: `1px solid ${isSel ? '#bfdbfe' : '#f1f5f9'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      transition: 'all .15s ease',
                    }}
                    onMouseEnter={e => !isSel && (e.currentTarget.style.background = '#f8fafc')}
                    onMouseLeave={e => !isSel && (e.currentTarget.style.background = '#ffffff')}
                  >
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: isSel ? '#1e40af' : '#0f172a' }}>
                        {c.name || c.cust_id}
                      </div>
                      <div style={{ fontSize: 11, color: '#64748b' }}>
                        {c.cust_id} · {c.tier} {c.location ? `· ${c.location}` : ''}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <RiskBadge level={riskLabel} />
                      <div style={{ fontSize: 10, color: '#64748b', marginTop: 3 }}>
                        Risk: {churnRisk.toFixed(0)}%
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [customers, setCustomers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [tab, setTab] = useState('journey');
  const [listLoading, setListLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    let ignore = false;
    async function init() {
      setListLoading(true);
      try {
        const r = await fetch(`${API}/api/customers?limit=1000&offset=0`);
        if (r.ok && !ignore) {
          const data = await r.json();
          const list = data.customers || [];
          setCustomers(list);
          setSelected(prev => prev || list[0] || null);
        }
      } catch (e) {
        console.error('API unavailable:', e);
      }
      if (!ignore) setListLoading(false);
    }
    init();
    return () => { ignore = true; };
  }, []);

  /* Load full customer detail when selection changes */
  const selectCustomer = useCallback(async (cust) => {
    setSelected(cust);
    setTab('journey');
    setDetailLoading(true);
    try {
      const r = await fetch(`${API}/api/customer/${cust.cust_id}`);
      if (r.ok) {
        const detail = await r.json();
        setSelected({
          ...cust,
          ...detail.profile,
          cust_id: cust.cust_id,
          timeline: detail.timeline || cust.timeline || [],
          identity_graph: detail.identity_graph || cust.identity_graph || { nodes: [], edges: [] },
          journeys: detail.journeys || cust.journeys || [],
          analytics: detail.analytics || cust.analytics || {},
          churn_risk_pct: detail.analytics?.churn_risk_pct ?? cust.churn_risk_pct,
          friction_index: detail.analytics?.friction_index ?? cust.friction_index,
          risk_level: detail.analytics?.risk_level ?? cust.risk_level,
          next_best_action: detail.analytics?.next_best_action ?? cust.next_best_action,
        });
      }
    } catch (e) {
      console.error('Could not load customer detail:', e);
    }
    setDetailLoading(false);
  }, []);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f8fafc' }}>

      {/* Header Bar */}
      <header className="header">
        <div className="header-inner">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10,
              background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(37,99,235,.25)', color: '#fff', fontSize: 18,
            }}>
              💳
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', letterSpacing: '-.01em' }}>
                Journey Intelligence
              </div>
              <div style={{ fontSize: 11, color: '#64748b' }}>
                American Express · Customer Experience Platform
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <SearchableCustomerDropdown
              customers={customers}
              selected={selected}
              onSelect={selectCustomer}
            />

            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#64748b' }}>
              <span>{customers.length || 500} customers tracked</span>
              <span className="live-dot" style={{ width: 7, height: 7, borderRadius: '50%', background: '#16a34a' }} />
              <span style={{ color: '#16a34a', fontWeight: 600 }}>Live</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{ flex: 1 }} className="container">
        <div style={{ padding: '24px 0 48px' }}>

          {/* Navigation Tabs Bar */}
          <div className="tabs" style={{ marginBottom: 24 }}>
            {[
              { id: 'journey', label: 'Customer Journey' },
              { id: 'analytics', label: 'Insights' },
              { id: 'simulator', label: 'Test Events' },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`tab-btn ${tab === t.id ? 'active' : ''}`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {detailLoading && tab === 'journey' && (
            <div style={{ padding: '32px 0', textAlign: 'center', color: '#64748b', fontSize: 13 }}>
              Loading customer details…
            </div>
          )}

          {!detailLoading && (
            <div className="fade-up" key={(tab + selected?.cust_id)} style={{ width: '100%', boxSizing: 'border-box' }}>
              {tab === 'journey' && <JourneyTab customer={selected} apiBase={API} />}
              {tab === 'analytics' && <AnalyticsTab apiBase={API} />}
              {tab === 'simulator' && <SimulatorTab apiBase={API} />}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid #e2e8f0', background: '#ffffff', padding: '14px 24px' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: '#64748b' }}>American Express · Journey Intelligence Platform</span>
          <span style={{ fontSize: 12, color: '#64748b' }}>All data is internal and confidential</span>
        </div>
      </footer>
    </div>
  );
}
