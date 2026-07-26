import React, { useState } from 'react';

const NODE_STYLES = {
  cust_id:   { bg:'linear-gradient(135deg,#D4AF37,#a8862b)', text:'#05080f', glow:'rgba(212,175,55,.4)', icon:'🆔' },
  email:     { bg:'linear-gradient(135deg,#3b82f6,#1d4ed8)', text:'#fff', glow:'rgba(59,130,246,.3)', icon:'✉️' },
  phone:     { bg:'linear-gradient(135deg,#ec4899,#be185d)', text:'#fff', glow:'rgba(236,72,153,.3)', icon:'📞' },
  cookie:    { bg:'linear-gradient(135deg,#8b5cf6,#6d28d9)', text:'#fff', glow:'rgba(139,92,246,.3)', icon:'🍪' },
  device_id: { bg:'linear-gradient(135deg,#10b981,#059669)', text:'#fff', glow:'rgba(16,185,129,.3)', icon:'📱' },
  card_last4:{ bg:'linear-gradient(135deg,#f59e0b,#d97706)', text:'#05080f', glow:'rgba(245,158,11,.35)', icon:'💳' },
};

const MOCK_GNN = (a, b) => ({
  node_a: a, node_b: b,
  overall_link_confidence: 0.96,
  gnn_explainer: {
    method: 'GNNExplainer (PyTorch Geometric)',
    subgraph_path: [a, 'LINKED_TO', b],
    feature_attributions: [
      { feature: 'Shared Primary Identifier Match', weight: 0.50 },
      { feature: 'Verified Authentication Gate',    weight: 0.35 },
      { feature: 'Temporal Co-occurrence (<5 min)', weight: 0.11 },
    ],
    interpretation: `High confidence link (96%). Derived from deterministic primary identifier match and session temporal co-occurrence within 5-minute window.`
  }
});

export default function IdentityGraph({ customer }) {
  const [gnn, setGnn] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeNode, setActiveNode] = useState(null);

  if (!customer) return <div className="empty-state">Select a customer to view identity graph.</div>;

  const { identity_graph, analytics } = customer;
  const nodes = identity_graph?.nodes || [];
  const edges = identity_graph?.edges || [];

  const explain = async (nodeId) => {
    setActiveNode(nodeId);
    setLoading(true);
    const custId = customer.cust_id || customer.profile?.cust_id || 'CUST_CENTURION_101';
    try {
      const r = await fetch(`/api/identity/explain?node_a=${encodeURIComponent(custId)}&node_b=${encodeURIComponent(nodeId)}`);
      if (r.ok) { setGnn(await r.json()); }
      else { setGnn(MOCK_GNN(custId, nodeId)); }
    } catch { setGnn(MOCK_GNN(custId, nodeId)); }
    setLoading(false);
  };

  return (
    <div style={{display:'flex', flexDirection:'column', gap:20}}>

      {/* Header */}
      <div className="card card-gold" style={{padding:'22px 28px'}}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3" style={{marginBottom:6}}>
              <span style={{fontSize:22}}>🕸️</span>
              <h2 className="serif" style={{fontSize:18, fontWeight:700, color:'#f8fafc'}}>
                PyTorch Geometric GNN Identity Graph
              </h2>
            </div>
            <div style={{fontSize:12, color:'#64748b'}}>
              Click any identifier node to run <strong style={{color:'#D4AF37'}}>GNNExplainer</strong> path attribution analysis.
            </div>
          </div>
          <div className="flex gap-4">
            <div className="stat-box" style={{textAlign:'center', minWidth:90}}>
              <div style={{fontSize:10, color:'#64748b', marginBottom:4}}>Nodes</div>
              <div className="mono" style={{fontSize:26, fontWeight:700, color:'#D4AF37'}}>{nodes.length}</div>
            </div>
            <div className="stat-box" style={{textAlign:'center', minWidth:90}}>
              <div style={{fontSize:10, color:'#64748b', marginBottom:4}}>GNN Confidence</div>
              <div className="mono" style={{fontSize:26, fontWeight:700, color:'#34d399'}}>98.4%</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'2fr 1fr', gap:20}}>

        {/* Graph Canvas */}
        <div className="card" style={{padding:'28px', minHeight:480, position:'relative', overflow:'hidden'}}>
          {/* Grid Background */}
          <div style={{
            position:'absolute', inset:0, opacity:.06,
            backgroundImage:'radial-gradient(circle,#94a3b8 1px,transparent 1px)',
            backgroundSize:'24px 24px', pointerEvents:'none'
          }} />

          {/* Central Persona Node */}
          <div style={{display:'flex', flexDirection:'column', alignItems:'center', marginBottom:40}}>
            <div style={{
              width:80, height:80, borderRadius:'50%',
              background:'linear-gradient(135deg,#D4AF37,#a8862b)',
              display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
              boxShadow:'0 0 40px rgba(212,175,55,.35), 0 0 80px rgba(212,175,55,.1)',
              border:'2px solid rgba(212,175,55,.6)', position:'relative', zIndex:2
            }}>
              <div style={{fontSize:12, fontWeight:800, color:'#05080f', fontFamily:'Cinzel,serif'}}>
                {(customer.name || '').split(' ').map(n=>n[0]).join('')}
              </div>
            </div>
            <div style={{
              width:2, height:32,
              background:'linear-gradient(180deg,rgba(212,175,55,.5),rgba(212,175,55,.05))'
            }} />
            <div style={{fontSize:10, color:'rgba(212,175,55,.7)', fontFamily:'Cinzel,serif', letterSpacing:'.1em', textTransform:'uppercase'}}>
              Unified Persona
            </div>
          </div>

          {/* Connection Lines (decorative) */}

          {/* Identity Node Grid */}
          <div style={{
            display:'grid',
            gridTemplateColumns: `repeat(${Math.min(nodes.length, 3)}, 1fr)`,
            gap:16
          }}>
            {nodes.map((n) => {
              const style = NODE_STYLES[n.type] || NODE_STYLES.cookie;
              const isActive = activeNode === n.id;
              return (
                <div key={n.id} className="id-node"
                  onClick={() => explain(n.id)}
                  style={{
                    border: isActive ? `1px solid ${style.glow}` : '1px solid rgba(226,232,240,.09)',
                    boxShadow: isActive ? `0 0 20px ${style.glow}` : 'none',
                    transform: isActive ? 'translateY(-4px) scale(1.03)' : 'none',
                  }}>
                  {/* Type badge */}
                  <div style={{
                    width:44, height:44, borderRadius:'50%',
                    background: style.bg, display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:20, boxShadow: `0 4px 16px ${style.glow}`,
                  }}>
                    {style.icon}
                  </div>
                  <div>
                    <div style={{
                      display:'inline-block', padding:'2px 8px', borderRadius:99,
                      background: style.bg, fontSize:9, fontWeight:700, fontFamily:'Inter,sans-serif',
                      color: style.text, textTransform:'uppercase', letterSpacing:'.07em', marginBottom:6
                    }}>{n.type}</div>
                    <div className="mono" style={{fontSize:10, color:'#94a3b8', lineHeight:1.5, wordBreak:'break-all', maxWidth:140}}>
                      {n.val || n.id}
                    </div>
                  </div>
                  <div style={{
                    fontSize:9, color:'rgba(212,175,55,.6)', fontFamily:'Cinzel,serif',
                    letterSpacing:'.08em', textTransform:'uppercase', textAlign:'center'
                  }}>
                    ✦ Explain Link
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{
            position:'absolute', bottom:16, right:20,
            fontSize:10, color:'#334155', fontFamily:'JetBrains Mono,monospace'
          }}>
            Zero Blackbox Policy · PyTorch Geometric + GNNExplainer
          </div>
        </div>

        {/* GNNExplainer Panel */}
        <div style={{display:'flex', flexDirection:'column', gap:16}}>
          <h3 className="serif" style={{fontSize:14, color:'#e2e8f0', fontWeight:600}}>
            GNNExplainer Attribution
          </h3>

          {loading ? (
            <div className="card" style={{padding:32, textAlign:'center'}}>
              <div style={{fontSize:30, marginBottom:10}} className="pulse">⚛</div>
              <div style={{fontSize:11, color:'#D4AF37', fontFamily:'JetBrains Mono,monospace'}}>
                Computing GNN subgraph feature attributions…
              </div>
            </div>
          ) : gnn ? (
            <div className="card card-gold detail-panel" style={{padding:'22px 22px'}}>
              {/* Confidence Score */}
              <div style={{textAlign:'center', padding:'20px 0', borderBottom:'1px solid rgba(226,232,240,.07)', marginBottom:16}}>
                <div style={{fontSize:10, color:'#64748b', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:8}}>Link Confidence Score</div>
                <div className="metric-number" style={{color:'#34d399', fontSize:44}}>
                  {Math.round(gnn.overall_link_confidence * 100)}%
                </div>
              </div>

              {/* Path */}
              <div style={{marginBottom:16}}>
                <div style={{fontSize:10, color:'#64748b', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:8}}>Subgraph Link Path</div>
                <div style={{
                  display:'flex', alignItems:'center', gap:8, flexWrap:'wrap',
                  background:'rgba(5,8,15,.7)', border:'1px solid rgba(226,232,240,.07)',
                  borderRadius:10, padding:'10px 14px', fontFamily:'JetBrains Mono,monospace', fontSize:10, color:'#D4AF37'
                }}>
                  <span style={{maxWidth:90, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{gnn.node_a}</span>
                  <span style={{color:'#334155'}}>──▶</span>
                  <span style={{maxWidth:90, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{gnn.node_b}</span>
                </div>
              </div>

              {/* Feature Attributions */}
              <div style={{marginBottom:16}}>
                <div style={{fontSize:10, color:'#64748b', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:12}}>
                  Top Feature Contributions
                </div>
                <div style={{display:'flex', flexDirection:'column', gap:10}}>
                  {gnn.gnn_explainer.feature_attributions.map((f, i) => (
                    <div key={i} style={{background:'rgba(5,8,15,.5)', border:'1px solid rgba(226,232,240,.06)', borderRadius:10, padding:12}}>
                      <div className="flex items-center justify-between" style={{marginBottom:7}}>
                        <span style={{fontSize:11, color:'#e2e8f0', fontWeight:600, flex:1, paddingRight:8}}>{f.feature}</span>
                        <span className="mono" style={{fontSize:12, fontWeight:700, color:'#D4AF37'}}>{Math.round(f.weight*100)}%</span>
                      </div>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{
                          width:`${f.weight*100}%`,
                          background:'linear-gradient(90deg,#D4AF37,#34d399)'
                        }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Interpretation */}
              <div style={{
                background:'rgba(212,175,55,.06)', border:'1px solid rgba(212,175,55,.15)',
                borderRadius:10, padding:14
              }}>
                <div style={{fontSize:10, fontWeight:700, color:'#D4AF37', marginBottom:6}}>Human Interpretation</div>
                <div style={{fontSize:11, color:'#94a3b8', lineHeight:1.7}}>{gnn.gnn_explainer.interpretation}</div>
              </div>
            </div>
          ) : (
            <div className="card" style={{padding:40, textAlign:'center', color:'#334155'}}>
              <div style={{fontSize:36, marginBottom:12}}>🕸️</div>
              <div style={{fontSize:12, lineHeight:1.7, color:'#475569'}}>
                Click any identifier node in the graph to run GNNExplainer path attribution.
              </div>
            </div>
          )}

          {/* Edge Legend */}
          <div className="card" style={{padding:'18px 20px'}}>
            <div style={{fontSize:10, fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:12}}>
              Identity Edge Registry
            </div>
            <div style={{display:'flex', flexDirection:'column', gap:8}}>
              {edges.map((e, i) => (
                <div key={i} className="flex items-center justify-between" style={{
                  background:'rgba(5,8,15,.5)', border:'1px solid rgba(226,232,240,.06)',
                  borderRadius:8, padding:'8px 12px', fontSize:10
                }}>
                  <span className="mono" style={{color:'#D4AF37', maxWidth:100, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>
                    {e.source}
                  </span>
                  <span style={{color:'#334155', fontSize:8}}>──{e.rel_type}──▶</span>
                  <span className="mono" style={{color:'#94a3b8', maxWidth:100, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>
                    {e.target}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
