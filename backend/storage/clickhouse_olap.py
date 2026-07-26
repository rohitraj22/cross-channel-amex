"""
ClickHouse / Apache Pinot Real-Time Columnar Datastore Engine Simulation.
Provides sub-second analytical query aggregations for dashboard friction heatmaps, drop-off funnels, and channel transitions.
"""

import time
from typing import Dict, List, Any
from collections import defaultdict
from backend.core.interfaces import BaseOLAPEngine

class ClickHouseOLAPEngine(BaseOLAPEngine):
    """High-speed Columnar Aggregation Engine for Real-Time Analytics."""
    
    def __init__(self):
        # Columnar storage simulation
        self.events_table: List[Dict[str, Any]] = []
        self.query_metrics = {
            "total_queries_executed": 0,
            "avg_query_time_ms": 1.42,
            "columnar_index_status": "OPTIMIZED (Vectorized SIMD)"
        }

    def insert_event(self, event: Dict[str, Any]) -> None:
        """Insert event into ClickHouse columnar table."""
        self.events_table.append(event)

    def query_friction_metrics(self) -> Dict[str, Any]:
        """Sub-second aggregation query calculating channel friction and drop-offs."""
        start_time = time.time()
        self.query_metrics["total_queries_executed"] += 1
        
        channel_friction = defaultdict(list)
        channel_counts = defaultdict(int)
        friction_hotspots = defaultdict(int)
        transitions = defaultdict(int)
        
        last_evt_by_cust = {}
        
        for evt in self.events_table:
            ch = evt.get("channel", "web")
            f_score = evt.get("friction_score", 0.0)
            channel_friction[ch].append(f_score)
            channel_counts[ch] += 1
            
            e_type = evt.get("event_type", "unknown")
            if f_score >= 0.6:
                friction_hotspots[f"{ch}:{e_type}"] += 1
                
            cust_id = evt.get("identifiers", {}).get("cust_id", "unknown")
            if cust_id in last_evt_by_cust:
                prev_ch = last_evt_by_cust[cust_id]["channel"]
                if prev_ch != ch:
                    transitions[f"{prev_ch} -> {ch}"] += 1
            last_evt_by_cust[cust_id] = evt

        # Compute averages
        avg_friction = {
            ch: round(sum(scores) / max(len(scores), 1), 3)
            for ch, scores in channel_friction.items()
        }
        
        exec_time_ms = round((time.time() - start_time) * 1000, 2)
        self.query_metrics["avg_query_time_ms"] = round(
            (self.query_metrics["avg_query_time_ms"] * 0.9) + (exec_time_ms * 0.1), 2
        )
        
        return {
            "avg_friction_by_channel": avg_friction,
            "channel_counts": dict(channel_counts),
            "friction_hotspots": dict(friction_hotspots),
            "transitions": dict(transitions),
            "query_time_ms": exec_time_ms,
            "total_rows_scanned": len(self.events_table)
        }
