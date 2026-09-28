# EPIDEMIC LAB: Network Surgery & Counterfactual Epidemic Simulator
> **DSA Capstone Project** • Interactive Network Epidemiology Laboratory

---

## 🔬 Overview & Scientific Identity
**EPIDEMIC LAB** is an interactive scientific graph laboratory where you observe, experiment upon, and perform surgery on contact networks to study epidemic transmission dynamics.

- **Core Story:** `PERSON → CONTACT → TRANSMISSION → NETWORK → OUTBREAK`
- **Visual-First Design:** 80% visual (Canvas network graph, particle animations, dynamic sparklines, causal icon chains) and 20% text.
- **Strict Scientific Color System:**
  - Primary Lavender `#9FA1FF`
  - Soft Lavender `#B5BAFF`
  - Sky Blue `#AEE2FF` (Exposed state)
  - Mint `#D9F9DF` (Recovered state)
  - Deep Lavender `#9192E8` (Infectious state & active particle pulses)
  - Light translucent glassmorphism surfaces on near-white lavender grid background.

---

## ⚡ Real DSA Implementations & Viva Defense Reference

| Data Structure / Algorithm | File Location | Complexity | Real Architectural Purpose |
| :--- | :--- | :--- | :--- |
| **Adjacency List** | [`src/dataStructures/AdjacencyList.ts`](file:///c:/Users/Thiruyazhini%20P%20S/OneDrive/Desktop/Epidemicstimulator/src/dataStructures/AdjacencyList.ts) | • Add node/edge: $O(1)$<br>• Edge surgery: $O(deg)$<br>• Space: $O(V + E)$ | Models the contact network. Supports real surgical operations: `removeEdge`, `disableEdge`, `restoreEdge`, `rewireEdge`, and `isolateNode`. |
| **Binary Min-Heap** | [`src/dataStructures/MinHeap.ts`](file:///c:/Users/Thiruyazhini%20P%20S/OneDrive/Desktop/Epidemicstimulator/src/dataStructures/MinHeap.ts) | • Insert: $O(\log N)$<br>• ExtractMin: $O(\log N)$<br>• Peek: $O(1)$<br>• Space: $O(N)$ | Priority event scheduler driving temporal disease state transitions (`BECOME_INFECTIOUS` at day $t + \text{incubation}$, `RECOVER` at day $t + \text{infectious}$). |
| **FIFO Queue** | [`src/dataStructures/Queue.ts`](file:///c:/Users/Thiruyazhini%20P%20S/OneDrive/Desktop/Epidemicstimulator/src/dataStructures/Queue.ts) | • Enqueue: $O(1)$<br>• Dequeue: $O(1)$<br>• Space: $O(N)$ | Manages Breadth-First Search (BFS) epidemic wavefront exploration and traversal animations. |
| **Hash Map** | [`src/dataStructures/HashMap.ts`](file:///c:/Users/Thiruyazhini%20P%20S/OneDrive/Desktop/Epidemicstimulator/src/dataStructures/HashMap.ts) | • Get / Set: $O(1)$ avg<br>• Worst: $O(K)$ collision<br>• Space: $O(M + N)$ | Separate-chaining hash map tracking node health states ($S, E, I, R$). Exposes bucket snapshots and load factor for the DSA Lab. |
| **Transmission Tree** | [`src/dataStructures/TransmissionTree.ts`](file:///c:/Users/Thiruyazhini%20P%20S/OneDrive/Desktop/Epidemicstimulator/src/dataStructures/TransmissionTree.ts) | • Record: $O(1)$<br>• Trace to Seed: $O(\text{depth})$<br>• Space: $O(V)$ | Phylogenetic directed tree capturing the exact infection transmission chain: *who infected whom*, timestamp, and secondary reproduction count. |
| **Tarjan's Bridge Algorithm** | [`src/algorithms/GraphAlgorithms.ts`](file:///c:/Users/Thiruyazhini%20P%20S/OneDrive/Desktop/Epidemicstimulator/src/algorithms/GraphAlgorithms.ts) | • Time: $O(V + E)$<br>• Space: $O(V)$ | Computes discovery times (`disc`) and low-link values (`low`) in a single DFS pass to identify critical inter-community bridge edges. |
| **BFS & DFS Traversal** | [`src/algorithms/GraphAlgorithms.ts`](file:///c:/Users/Thiruyazhini%20P%20S/OneDrive/Desktop/Epidemicstimulator/src/algorithms/GraphAlgorithms.ts) | • Time: $O(V + E)$<br>• Space: $O(V)$ | Ordered graph traversals with animated wave/trail visualization. |
| **Shortest Path** | [`src/algorithms/GraphAlgorithms.ts`](file:///c:/Users/Thiruyazhini%20P%20S/OneDrive/Desktop/Epidemicstimulator/src/algorithms/GraphAlgorithms.ts) | • Time: $O(V + E)$<br>• Space: $O(V)$ | Finds the shortest path between patient zero seeds and superspreader hubs. |
| **Connected Components** | [`src/algorithms/GraphAlgorithms.ts`](file:///c:/Users/Thiruyazhini%20P%20S/OneDrive/Desktop/Epidemicstimulator/src/algorithms/GraphAlgorithms.ts) | • Time: $O(V + E)$<br>• Space: $O(V)$ | Identifies partitioned subgraphs following bridge removal or node quarantine. |
| **Patient Registry & Classifier** | [`src/dataStructures/PatientRegistry.ts`](file:///c:/Users/Thiruyazhini%20P%20S/OneDrive/Desktop/Epidemicstimulator/src/dataStructures/PatientRegistry.ts) | • Lookup: $O(1)$<br>• Risk Evaluation: $O(1)$<br>• Space: $O(N)$ | Maintains private encrypted health records, thermal infrared scan logs, location tracking zones, and automated infection risk assessment. |
| **Seeded RNG** | [`src/utils/SeededRNG.ts`](file:///c:/Users/Thiruyazhini%20P%20S/OneDrive/Desktop/Epidemicstimulator/src/utils/SeededRNG.ts) | • Next: $O(1)$<br>• Space: $O(1)$ | Mulberry32 deterministic generator ensuring identical stochastic trials between baseline and counterfactual runs. |

---

## 🖥️ Screen Architecture

1. **Landing Page:** Interactive animated canvas hero with pulsing nodes and traveling edge transmission particles, feature cards, and direct CTAs.
2. **Login Screen:** Split screen with responsive network physics on the left, glassmorphic auth panel on the right, and **Self-Check: Clinical & Thermal Intake** trigger.
3. **Clinical Intake & Thermal Screening Modal:**
   - Infrared temperature slider / sensor simulator (°C / °F) with real-time fever threshold alerts ($38.0^\circ\text{C}+$ pyrexia).
   - Medical vitals: Oxygen Saturation ($\text{SpO}_2\%$), Heart Rate ($\text{BPM}$), Dry Cough severity, Anosmia (loss of taste/smell), and Dyspnea.
   - Geo-location check-in zone tracking with spatial coordinates (Zone A Research Core, Zone B Transit Hub, Zone C Student Quad, Zone D Medical Pavilion).
   - Epidemiological risk classification scoring ($0-100\%$) mapping patients directly to $S, E, I, R$ states.
4. **Surveillance & Individual Patient Records:**
   - Searchable, filterable private patient database with data masking / unmasking toggle.
   - Individual confidential patient file showing thermal fluctuation timeline, location history, and "Locate on Contact Network" button.
5. **Laboratory:**
   - **Left:** Visual parameter sliders (Population, Transmission $\beta$, Contact Density, Seed Patients).
   - **Center (65-70%):** Interactive HTML5 Canvas graph supporting pan, zoom, node drag, edge hover, community halos, and transmission ripples.
   - **Right:** Floating glass KPIs with active sparkline and community counters.
   - **Bottom:** Timeline scrubber with historical day playback and speed multipliers ($1\times, 2\times, 4\times$).
   - **Node Details:** Displays individual thermal reading and check-in zone directly upon node click.
6. **Network Surgery Mode:**
   - Dims surrounding chrome and brightens the graph.
   - Clicking an edge reveals a floating mini toolbar: **REMOVE**, **REWIRE**, **DISABLE**, **RESTORE**, and risk metrics.
   - Selecting a node opens the **Floating Node Panel** with direct **Isolate Patient** and **Trace to Seed** triggers.
7. **Counterfactual Lab (Signature Feature):**
   - Side-by-side synchronized canvas view: **Baseline (Immutable)** vs. **Counterfactual (Intervention)**.
   - Shared Seeded RNG ($1337$) ensures identical stochastic trials.
   - Highlights blocked paths with floating annotations and exact path diffs (`#000 → #005 → #012` vs `#000 → #005 ✕ BLOCKED`).
   - Includes **"Why did the outbreak change?"** vertical causal evidence chain.
8. **Transmission Replay:**
   - Phylogenetic branching transmission tree with chronological growth scrubber.
   - **TRACE TO SOURCE** button that illuminates the exact path back to patient zero.
9. **Analytics & Monte Carlo Ensembles:**
   - Live SEIR Area curves ($S, E, I, R$).
   - Monte Carlo multi-run runner ($10, 30, 50, 100$ runs) with shaded 25th–75th percentile uncertainty envelope and median trajectory.
10. **DSA Lab:**
    - Dedicated interactive playground for the core data structures: Adjacency List, Min-Heap, FIFO Queue, and Separate-Chaining Hash Map.

---

## 🚀 Running Locally

```bash
# 1. Install dependencies
npm install

# 2. Start the Vite development server
npm run dev

# 3. Open in browser:
http://localhost:5173
```
