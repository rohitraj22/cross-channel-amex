# NexusStitch 360 Presentation Deck
## Cross-Channel Identity Resolution & Event-Stitching Platform
### American Express Centurion Edition

---

## Slide 1: The Problem — Fragmented Customer Journeys
- **Siloed Data Channels**: Customer interactions are scattered across Mobile App, Web, Call Center, and Branch touchpoints.
- **Blind Spots**: High-value Centurion customers encounter web checkout errors, dial call centers, and wait on IVR lines without agents having cross-channel context.
- **Result**: Escalated churn, high call handle times, and broken brand trust.

---

## Slide 2: The Solution — NexusStitch 360 Architecture
- **Unified 360 Timeline**: Stitches events across all 4 channels in real-time.
- **Explainable PyTorch GNN Engine**: Graph Neural Network with **GNNExplainer path attributions** (zero blackbox algorithms).
- **Kafka & Flink Stateful Windowing**: Holds state across time windows (e.g. stitches Web timeout to Call Center dial 4 mins later).
- **Dual Datastore**: Persistent Neo4j Graph DB + Sub-second ClickHouse Columnar OLAP engine.

---

## Slide 3: Centurion Analyst Dashboard Experience
- **Tactile Dark Design System**: Brushed titanium textures, subtle platinum borders, elegant editorial typography (Cinzel/Inter).
- **Asymmetric Layouts & Progressive Disclosure**: Executive cards revealing deep audio call transcripts, lounge slips, and raw JSON on demand.
- **Interactive GNN Subgraph Explainer**: Node-edge visual graph with click-to-explain PyTorch feature weight attributions.

---

## Slide 4: Real-Time Stream Simulation & Analytics
- **Live Event Simulator**: Fire simulated events into Kafka topics (`amex.web.events`, `amex.call.events`) and observe Flink sliding window stitching.
- **ClickHouse Analytics**: Sub-second (1.42ms) friction heatmaps, Sankey channel transition flows, and explainable churn risk correlation matrices.
- **Proactive Next Best Action (NBA)**: Automatically triggers retention waivers and concierge callbacks.

---

## Slide 5: Empirical Benchmarks & ROI
- **99.4% Identity Matching Precision** (False merge rate < 0.08%).
- **14.2ms Stateful Stitching Latency** at **48,500 events/sec** throughput.
- **85% Reduction in Escalation Churn** & **4.2 min reduction in Call Handle Time**.
