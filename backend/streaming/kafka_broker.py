"""
Apache Kafka / Redpanda Decoupled Message Broker Simulation.
Ingests raw events from channels into topics and decouples ingestion from stream processing.
"""

import time
from typing import Dict, List, Any, Callable
from collections import defaultdict, deque

class KafkaMessageBroker:
    """Decoupled Multi-Topic Kafka Broker for Cross-Channel Ingestion."""
    
    TOPICS = [
        "amex.web.events",
        "amex.app.events",
        "amex.call.events",
        "amex.branch.events"
    ]
    
    def __init__(self):
        self.topics: Dict[str, deque] = defaultdict(deque)
        self.subscribers: Dict[str, List[Callable]] = defaultdict(list)
        self.metrics = {
            "total_messages_published": 0,
            "topic_counts": defaultdict(int),
            "bytes_processed": 0
        }

    def publish(self, topic: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Publish event message to a Kafka topic."""
        if topic not in self.TOPICS:
            topic = "amex.web.events"  # Fallback topic
            
        record = {
            "topic": topic,
            "partition": 0,
            "offset": self.metrics["topic_counts"][topic],
            "timestamp": time.time(),
            "payload": payload
        }
        
        self.topics[topic].append(record)
        self.metrics["total_messages_published"] += 1
        self.metrics["topic_counts"][topic] += 1
        self.metrics["bytes_processed"] += len(str(payload))
        
        # Notify topic subscribers (e.g. Flink Stream Processor)
        for callback in self.subscribers[topic]:
            callback(record)
            
        return record

    def subscribe(self, topic: str, callback: Callable):
        """Subscribe a stream consumer to a Kafka topic."""
        self.subscribers[topic].append(callback)

    def get_stats(self) -> Dict[str, Any]:
        """Return Kafka broker operational metrics."""
        return {
            "topics": list(self.TOPICS),
            "total_published": self.metrics["total_messages_published"],
            "topic_counts": dict(self.metrics["topic_counts"]),
            "bytes_processed": self.metrics["bytes_processed"],
            "status": "HEALTHY (Kafka Broker Connected)"
        }
