"""
Data Loader for NexusStitch 360.
Primary source: customers_nested.json.
Supplementary sources: events.csv, journeys.csv, identity_nodes.csv,
                       identity_edges.csv, pair_samples.csv.

Real column schemas (confirmed from data files):

customers_nested.json top-level keys:
  cust_id, name, tier, email, phone, card_last4, location,
  tenure_months, annual_spend_usd, churn_probability, risk_segment,
  churned_30d, traits (dict), preferred_channel,
  timeline (list of event objects), nodes (list), edges (list)

events.csv columns (28):
  event_id, true_cust_id, journey_id, journey_step, timestamp, timestamp_iso,
  channel, event_type, issue_type, tier, city, location, friction_score,
  sentiment, resolution_status, amount_usd, observed_cust_id, observed_name,
  observed_email, observed_phone, observed_card_last4, observed_cookie_id,
  observed_device_id, observed_ip, duration_sec, agent_id, payload_json,
  is_breakpoint

journeys.csv columns (20):
  journey_id, cust_id, issue_type, tier, start_timestamp, end_timestamp,
  event_count, channel_count, channel_switches, max_friction, mean_friction,
  resolved, terminal_status, escalated, repeat_contact_14d,
  breakpoint_event_id, transaction_amount_usd, severity,
  resolution_difficulty, customer_churned_30d

identity_nodes.csv columns (4):
  id, type, val, owner_cust_id

identity_edges.csv columns (5):
  source, target, rel_type, type, owner_cust_id

pair_samples.csv columns (6):
  event_id_left, event_id_right, is_match, pair_type,
  true_cust_id_left, true_cust_id_right
"""

import json
import csv
import os
import time

DATA_DIR = os.path.dirname(__file__)

# ── CSV helpers ───────────────────────────────────────────────────────────────

def _read_csv(filename):
    path = os.path.join(DATA_DIR, filename)
    with open(path, newline='', encoding='utf-8') as f:
        return list(csv.DictReader(f))


def _float(val, default=0.0):
    try:
        return float(val)
    except (TypeError, ValueError):
        return default


def _int(val, default=0):
    try:
        return int(val)
    except (TypeError, ValueError):
        return default


def _bool(val):
    return str(val).strip().lower() in ('true', '1', 'yes')


# ── In-memory caches ──────────────────────────────────────────────────────────

_CUSTOMERS_NESTED = None
_EVENTS_BY_CUST   = None
_JOURNEYS_BY_CUST = None
_NODES_BY_CUST    = None
_EDGES_BY_CUST    = None
_PAIRS_INDEX      = None


# ── Loaders ──────────────────────────────────────────────────────────────────

def _load_customers_nested(limit=None):
    """
    Load customers_nested.json. Returns a list of raw customer dicts.
    Each dict already has: cust_id, name, tier, email, phone, card_last4,
    location, timeline (list), nodes (list), edges (list), churn_probability,
    risk_segment, traits, annual_spend_usd, tenure_months.
    """
    global _CUSTOMERS_NESTED
    if _CUSTOMERS_NESTED is not None:
        return _CUSTOMERS_NESTED[:limit] if limit else _CUSTOMERS_NESTED

    path = os.path.join(DATA_DIR, "customers_nested.json")
    with open(path, encoding='utf-8') as f:
        data = json.load(f)
    _CUSTOMERS_NESTED = data if isinstance(data, list) else list(data.values())
    return _CUSTOMERS_NESTED[:limit] if limit else _CUSTOMERS_NESTED


def _load_events_by_cust():
    """
    Load events.csv → dict keyed by true_cust_id → sorted list of event dicts.
    Normalises to the shape expected by main.py timeline consumers:
      event_id, timestamp, channel, event_type, friction_score, sentiment,
      location, payload (dict), identifiers (dict), is_breakpoint (bool)
    """
    global _EVENTS_BY_CUST
    if _EVENTS_BY_CUST is not None:
        return _EVENTS_BY_CUST

    rows = _read_csv("events.csv")
    index = {}
    for row in rows:
        cid = row.get("true_cust_id", "")
        try:
            payload = json.loads(row.get("payload_json", "{}") or "{}")
        except Exception:
            payload = {}

        evt = {
            "event_id":        row.get("event_id", ""),
            "cust_id":         cid,
            "journey_id":      row.get("journey_id", ""),
            "journey_step":    _int(row.get("journey_step", 0)),
            "timestamp":       _float(row.get("timestamp", time.time())),
            "timestamp_iso":   row.get("timestamp_iso", ""),
            "channel":         row.get("channel", ""),
            "event_type":      row.get("event_type", ""),
            "issue_type":      row.get("issue_type", ""),
            "friction_score":  _float(row.get("friction_score", 0)),
            "sentiment":       row.get("sentiment", "neutral"),
            "resolution_status": row.get("resolution_status", ""),
            "amount_usd":      _float(row.get("amount_usd", 0)),
            "location":        row.get("location", row.get("city", "")),
            "agent_id":        row.get("agent_id", ""),
            "duration_sec":    _float(row.get("duration_sec", 0)),
            "is_breakpoint":   _bool(row.get("is_breakpoint", "false")),
            "payload":         payload,
            # Observed identity signals (may be empty strings)
            "identifiers": {
                "cust_id":    row.get("observed_cust_id", ""),
                "name":       row.get("observed_name", ""),
                "email":      row.get("observed_email", ""),
                "phone":      row.get("observed_phone", ""),
                "card_last4": row.get("observed_card_last4", ""),
                "cookie_id":  row.get("observed_cookie_id", ""),
                "device_id":  row.get("observed_device_id", ""),
                "ip":         row.get("observed_ip", ""),
            },
        }
        index.setdefault(cid, []).append(evt)

    for cid in index:
        index[cid].sort(key=lambda e: e["timestamp"])

    _EVENTS_BY_CUST = index
    return _EVENTS_BY_CUST


def _load_journeys_by_cust():
    """
    Load journeys.csv → dict keyed by cust_id → list of journey dicts.
    (A customer may have multiple journeys.)
    """
    global _JOURNEYS_BY_CUST
    if _JOURNEYS_BY_CUST is not None:
        return _JOURNEYS_BY_CUST

    rows = _read_csv("journeys.csv")
    index = {}
    for row in rows:
        cid = row.get("cust_id", "")
        j = {
            "journey_id":           row.get("journey_id", ""),
            "cust_id":              cid,
            "issue_type":           row.get("issue_type", ""),
            "tier":                 row.get("tier", ""),
            "start_timestamp":      _float(row.get("start_timestamp", 0)),
            "end_timestamp":        _float(row.get("end_timestamp", 0)),
            "event_count":          _int(row.get("event_count", 0)),
            "channel_count":        _int(row.get("channel_count", 0)),
            "channel_switches":     _int(row.get("channel_switches", 0)),
            "max_friction":         _float(row.get("max_friction", 0)),
            "mean_friction":        _float(row.get("mean_friction", 0)),
            "resolved":             _bool(row.get("resolved", "false")),
            "terminal_status":      row.get("terminal_status", ""),
            "escalated":            _bool(row.get("escalated", "false")),
            "repeat_contact_14d":   _bool(row.get("repeat_contact_14d", "false")),
            "breakpoint_event_id":  row.get("breakpoint_event_id", ""),
            "transaction_amount_usd": _float(row.get("transaction_amount_usd", 0)),
            "severity":             row.get("severity", ""),
            "resolution_difficulty":_float(row.get("resolution_difficulty", 0)),
            "customer_churned_30d": _bool(row.get("customer_churned_30d", "false")),
        }
        index.setdefault(cid, []).append(j)

    _JOURNEYS_BY_CUST = index
    return _JOURNEYS_BY_CUST


def _load_nodes_by_cust():
    """
    Load identity_nodes.csv → dict keyed by owner_cust_id → list of node dicts.
    Node schema: { id, type, val, owner_cust_id }
    """
    global _NODES_BY_CUST
    if _NODES_BY_CUST is not None:
        return _NODES_BY_CUST

    rows = _read_csv("identity_nodes.csv")
    index = {}
    for row in rows:
        cid = row.get("owner_cust_id", "")
        node = {
            "id":   row.get("id", ""),
            "type": row.get("type", ""),
            "val":  row.get("val", ""),
        }
        index.setdefault(cid, []).append(node)

    _NODES_BY_CUST = index
    return _NODES_BY_CUST


def _load_edges_by_cust():
    """
    Load identity_edges.csv → dict keyed by owner_cust_id → list of edge dicts.
    Edge schema: { source, target, rel_type, type, owner_cust_id }
    """
    global _EDGES_BY_CUST
    if _EDGES_BY_CUST is not None:
        return _EDGES_BY_CUST

    rows = _read_csv("identity_edges.csv")
    index = {}
    for row in rows:
        cid = row.get("owner_cust_id", "")
        edge = {
            "source":   row.get("source", ""),
            "target":   row.get("target", ""),
            "rel_type": row.get("rel_type", ""),
            "type":     row.get("type", ""),
        }
        index.setdefault(cid, []).append(edge)

    _EDGES_BY_CUST = index
    return _EDGES_BY_CUST


def _load_pairs():
    """
    Load pair_samples.csv → list of pair dicts.
    Schema: { event_id_left, event_id_right, is_match (int), pair_type,
              true_cust_id_left, true_cust_id_right }
    Used by the identity resolution model for GNN training pairs / explainability.
    """
    global _PAIRS_INDEX
    if _PAIRS_INDEX is not None:
        return _PAIRS_INDEX

    rows = _read_csv("pair_samples.csv")
    pairs = []
    for row in rows:
        pairs.append({
            "event_id_left":    row.get("event_id_left", ""),
            "event_id_right":   row.get("event_id_right", ""),
            "is_match":         _int(row.get("is_match", 0)),
            "pair_type":        row.get("pair_type", ""),
            "true_cust_id_left":  row.get("true_cust_id_left", ""),
            "true_cust_id_right": row.get("true_cust_id_right", ""),
        })

    _PAIRS_INDEX = pairs
    return _PAIRS_INDEX


# ── Customer enrichment ───────────────────────────────────────────────────────

def _risk_level_from_churn(churn_prob):
    """Map churn probability to a risk label with balanced enterprise thresholds."""
    if churn_prob >= 0.40:
        return "CRITICAL"
    if churn_prob >= 0.25:
        return "HIGH"
    if churn_prob >= 0.12:
        return "MODERATE"
    return "LOW"


def _next_best_action(risk_level, journeys):
    """Derive a human-readable NBA from risk level and journey data."""
    has_unresolved = any(
        not j.get("resolved", True) or j.get("escalated", False)
        for j in journeys
    )
    if risk_level == "CRITICAL":
        return "Call this customer today. Assign a dedicated relationship manager and offer a courtesy credit."
    if risk_level == "HIGH":
        if has_unresolved:
            return "Send a proactive message with a direct senior-agent callback link. Waive any pending fee."
        return "Reach out proactively — offer a loyalty incentive before they consider leaving."
    if risk_level == "MODERATE":
        return "Monitor closely. Send a personalised satisfaction check-in over email."
    return "Continue standard engagement. No immediate action required."


def _friction_index(journeys, events):
    """Compute a 0–100 friction index for a customer from their journeys and events."""
    if journeys:
        # Average max_friction across journeys, scaled to 100
        avg = sum(j.get("max_friction", 0) for j in journeys) / len(journeys)
        return round(avg * 100, 1)
    if events:
        avg = sum(e.get("friction_score", 0) for e in events) / len(events)
        return round(avg * 100, 1)
    return 0.0


def _build_analytics(cust_raw, journeys, events):
    """Build the analytics block for a customer."""
    churn_prob = _float(cust_raw.get("churn_probability", 0))
    risk_level = _risk_level_from_churn(churn_prob)
    fi = _friction_index(journeys, events)

    # Channel sequence from journeys
    channels_seen = []
    for j in journeys:
        pass  # journeys.csv doesn't have channel_sequence column; derive from events

    channel_seq = "→".join(
        sorted(set(e.get("channel", "") for e in events if e.get("channel")))
    ) if events else ""

    return {
        "risk_level":       risk_level,
        "friction_index":   fi,
        "churn_risk_pct":   round(churn_prob * 100, 1),
        "next_best_action": _next_best_action(risk_level, journeys),
        "channel_sequence": channel_seq,
        "unresolved_flag":  any(not j.get("resolved", True) for j in journeys),
        "total_journeys":   len(journeys),
        "escalated_journeys": sum(1 for j in journeys if j.get("escalated", False)),
        "churned_30d":      _bool(cust_raw.get("churned_30d", False)),
    }


def _build_customer_record(cust_raw, events_idx, journeys_idx, nodes_idx, edges_idx):
    """
    Build a fully enriched customer dict from nested JSON + CSV sources.
    Priority: CSV data wins over nested JSON where available.
    """
    cid = cust_raw.get("cust_id", "")

    # Events: prefer events.csv over nested timeline
    csv_events = events_idx.get(cid, [])
    timeline   = csv_events if csv_events else cust_raw.get("timeline", [])

    # Journeys from journeys.csv
    journeys = journeys_idx.get(cid, [])

    # Nodes / edges: prefer CSV over nested
    csv_nodes = nodes_idx.get(cid, [])
    csv_edges = edges_idx.get(cid, [])
    nodes = csv_nodes if csv_nodes else cust_raw.get("nodes", [])
    edges = csv_edges if csv_edges else cust_raw.get("edges", [])

    analytics = _build_analytics(cust_raw, journeys, timeline)

    return {
        # Flat profile fields (as expected by main.py)
        "cust_id":          cid,
        "name":             cust_raw.get("name", cid),
        "tier":             cust_raw.get("tier", ""),
        "email":            cust_raw.get("email", ""),
        "phone":            cust_raw.get("phone", ""),
        "card_last4":       cust_raw.get("card_last4", ""),
        "location":         cust_raw.get("location", ""),
        "tenure_months":    _int(cust_raw.get("tenure_months", 0)),
        "annual_spend_usd": _float(cust_raw.get("annual_spend_usd", 0)),
        "preferred_channel":cust_raw.get("preferred_channel", ""),
        "traits":           cust_raw.get("traits", {}),
        # Data
        "timeline":         timeline,
        "nodes":            nodes,
        "edges":            edges,
        "journeys":         journeys,
        "analytics":        analytics,
    }


# ── Public API ────────────────────────────────────────────────────────────────

def get_sample_customers(limit=500):
    """
    Primary data loader called by main.py at startup.
    Returns up to `limit` fully enriched customer dicts.
    Loading 500 customers is fast; the JSON file is parsed once and cached.
    """
    raws      = _load_customers_nested(limit=limit)
    events_idx  = _load_events_by_cust()
    journeys_idx= _load_journeys_by_cust()
    nodes_idx   = _load_nodes_by_cust()
    edges_idx   = _load_edges_by_cust()

    return [
        _build_customer_record(r, events_idx, journeys_idx, nodes_idx, edges_idx)
        for r in raws
    ]


def get_sample_events():
    """Return a flat list of all events from events.csv."""
    idx = _load_events_by_cust()
    flat = []
    for evts in idx.values():
        flat.extend(evts)
    return flat


def get_sample_journeys():
    """Return a flat list of all journey records from journeys.csv."""
    idx = _load_journeys_by_cust()
    flat = []
    for jlist in idx.values():
        flat.extend(jlist)
    return flat


def get_pair_samples(limit=1000):
    """
    Return pair samples from pair_samples.csv.
    Used for identity-resolution model metrics and explainability demos.
    """
    return _load_pairs()[:limit]


def get_analytics_summary():
    """
    Aggregate statistics from CSV files for the analytics dashboard.
    Returns per-channel avg friction, risk distribution, unresolved counts, etc.
    """
    journeys_idx = _load_journeys_by_cust()
    events_idx   = _load_events_by_cust()

    all_journeys = [j for jlist in journeys_idx.values() for j in jlist]
    all_events   = [e for evts in events_idx.values()   for e in evts]

    # Risk distribution (from churn_probability in nested JSON — derive from journeys here)
    escalated   = sum(1 for j in all_journeys if j.get("escalated", False))
    unresolved  = sum(1 for j in all_journeys if not j.get("resolved", True))
    churned_30d = sum(1 for j in all_journeys if j.get("customer_churned_30d", False))

    # Avg friction by channel from events.csv
    channel_friction = {}
    channel_counts   = {}
    for e in all_events:
        ch = e.get("channel", "unknown")
        fs = e.get("friction_score", 0)
        channel_friction[ch] = channel_friction.get(ch, 0) + fs
        channel_counts[ch]   = channel_counts.get(ch, 0) + 1

    avg_friction_by_channel = {
        ch: round(channel_friction[ch] / channel_counts[ch], 3)
        for ch in channel_friction if channel_counts[ch] > 0
    }

    # Weekly issue volume (last 7 buckets from severity field)
    severity_counts = {}
    for j in all_journeys:
        sev = j.get("severity", "low")
        severity_counts[sev] = severity_counts.get(sev, 0) + 1

    return {
        "total_journeys":          len(all_journeys),
        "total_events":            len(all_events),
        "escalated_journeys":      escalated,
        "unresolved_journeys":     unresolved,
        "churned_customers_30d":   churned_30d,
        "avg_friction_by_channel": avg_friction_by_channel,
        "severity_distribution":   severity_counts,
        "issue_type_distribution": _count_field(all_journeys, "issue_type"),
        "terminal_status_distribution": _count_field(all_journeys, "terminal_status"),
        "channel_distribution":    _count_field(all_events, "channel"),
    }


def _count_field(records, field):
    counts = {}
    for r in records:
        v = r.get(field, "unknown") or "unknown"
        counts[v] = counts.get(v, 0) + 1
    return dict(sorted(counts.items(), key=lambda x: -x[1])[:10])
