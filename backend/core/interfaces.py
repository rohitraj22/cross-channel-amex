"""
Abstract Base Classes & Interfaces for NexusStitch 360 Architecture.
Ensures ML models, Stream Processors, Graph Stores, and OLAP Datastores are fully decoupled.
"""

from abc import ABC, abstractmethod
from typing import Dict, List, Any, Optional, Tuple

class BaseIdentityResolver(ABC):
    """Pluggable interface for identity resolution engines."""
    
    @abstractmethod
    def resolve_identities(self, nodes: List[Dict[str, Any]], edges: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Perform identity resolution across identifier nodes and edge connections."""
        pass

    @abstractmethod
    def explain_link(self, node_a: str, node_b: str) -> Dict[str, Any]:
        """Return human-interpretable attribution for why two identity nodes are linked."""
        pass

class BaseStreamProcessor(ABC):
    """Interface for stateful stream processing engines (e.g., Apache Flink)."""

    @abstractmethod
    def ingest_event(self, event: Dict[str, Any]) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
        """Ingest a multi-channel event, maintain time-window state, and emit stitched events."""
        pass

    @abstractmethod
    def get_pending_state_buffers(self) -> Dict[str, Any]:
        """Retrieve stateful unstitched window buffers."""
        pass

class BaseGraphStore(ABC):
    """Interface for persistent graph storage (e.g., Neo4j / Amazon Neptune)."""

    @abstractmethod
    def add_node(self, node_id: str, label: str, properties: Dict[str, Any]) -> None:
        pass

    @abstractmethod
    def add_edge(self, source: str, target: str, rel_type: str, weight: float, metadata: Dict[str, Any]) -> None:
        pass

    @abstractmethod
    def cypher_query(self, query: str) -> List[Dict[str, Any]]:
        """Run Cypher-like queries on persistent graph."""
        pass

class BaseOLAPEngine(ABC):
    """Interface for Real-Time Columnar Datastore (e.g., ClickHouse / Apache Pinot)."""

    @abstractmethod
    def insert_event(self, event: Dict[str, Any]) -> None:
        pass

    @abstractmethod
    def query_friction_metrics(self) -> Dict[str, Any]:
        """Execute sub-second columnar aggregation query for friction and churn analytics."""
        pass

class BaseExplainableModel(ABC):
    """Interface for explainable ML models (no blackbox algorithms)."""

    @abstractmethod
    def predict_with_explanation(self, entity_data: Dict[str, Any]) -> Dict[str, Any]:
        """Return prediction along with feature attributions, decision trees, or SHAP contributions."""
        pass
