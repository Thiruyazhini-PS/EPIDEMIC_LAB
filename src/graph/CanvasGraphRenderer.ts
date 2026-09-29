// src/graph/CanvasGraphRenderer.ts
/**
 * Canvas Graph Renderer for Epidemic Lab.
 * Renders high-performance interactive network visualizations on HTML5 Canvas:
 * - Smooth physics layout (D3 force or spring-electrical model)
 * - Pan, zoom, node drag, edge hover
 * - S -> E -> I -> R visual states with shapes/symbols for accessibility
 * - Community halos and bridge highlighting
 * - Animated transmission particles moving along edges with ripple arrivals
 * - Algorithmic inspection trails (BFS/DFS sequences, shortest paths, bridges)
 *
 * Designed to maintain 60 FPS even with 1000+ nodes and edges.
 */

import type { NodeId } from '../dataStructures/AdjacencyList';
import type { HealthState } from '../simulation/DiseaseModel';

export interface VisualNode {
  id: NodeId;
  label: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  degree: number;
  community: number;
  state: HealthState;
  pulsePhase: number;
  rippleRadius?: number;
}

export interface VisualEdge {
  source: NodeId;
  target: NodeId;
  weight: number;
  isBridge: boolean;
  disabled?: boolean;
}

export interface TransmissionParticle {
  sourceId: NodeId;
  targetId: NodeId;
  progress: number; // 0 to 1
  speed: number;
  active: boolean;
}

export interface RenderOptions {
  highlightedBridges?: Set<string>;
  highlightedPath?: NodeId[];
  traversalOrder?: Map<NodeId, number>;
  focusedNodeId?: NodeId | null;
  userNodeId?: NodeId | null;
  hoveredEdgeKey?: string | null;
  surgeryMode?: boolean;
  riskMapMode?: boolean;
  riskScores?: Map<NodeId, 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>;
  traceDegrees?: {
    deg1: Set<NodeId>;
    deg2: Set<NodeId>;
    deg3: Set<NodeId>;
  };
  isolatedNodes?: Set<NodeId>;
}

export class CanvasGraphRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private nodes: Map<NodeId, VisualNode> = new Map();
  private edges: VisualEdge[] = [];
  private particles: TransmissionParticle[] = [];

  // Viewport transform
  public transform = { x: 0, y: 0, scale: 1 };
  private isDragging = false;
  private draggedNode: VisualNode | null = null;
  private lastMouse = { x: 0, y: 0 };
  public hoveredNode: VisualNode | null = null;
  public hoveredEdge: VisualEdge | null = null;

  private animationFrameId: number | null = null;
  public options: RenderOptions = {};
  public onNodeSelect?: (node: VisualNode | null) => void;
  public onEdgeSelect?: (edge: VisualEdge | null, clientPos: { x: number; y: number }) => void;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.setupEvents();
  }

  /**
   * Set nodes and edges, assigning initial positions in concentric community orbits
   */
  setData(
    nodeList: { id: NodeId; label: string; community: number }[],
    edgeList: VisualEdge[],
    states: Map<NodeId, HealthState>
  ) {
    const width = this.canvas.width || 800;
    const height = this.canvas.height || 600;
    const centerX = width / 2;
    const centerY = height / 2;

    this.edges = [...edgeList];
    const degreeMap = new Map<NodeId, number>();

    for (const e of edgeList) {
      if (!e.disabled) {
        degreeMap.set(e.source, (degreeMap.get(e.source) || 0) + 1);
        degreeMap.set(e.target, (degreeMap.get(e.target) || 0) + 1);
      }
    }

    // Communities clustering centers
    const commAngles: { [c: number]: { cx: number; cy: number } } = {
      0: { cx: centerX - 180, cy: centerY - 80 },
      1: { cx: centerX + 180, cy: centerY - 80 },
      2: { cx: centerX, cy: centerY + 160 },
      3: { cx: centerX - 120, cy: centerY + 180 },
    };

    for (const n of nodeList) {
      const existing = this.nodes.get(n.id);
      const degree = degreeMap.get(n.id) || 1;
      const radius = Math.max(5.5, Math.min(14, 5 + Math.sqrt(degree) * 2.2));
      const state = states.get(n.id) || 'S';

      const commCenter = commAngles[n.community % 4] || { cx: centerX, cy: centerY };
      const jitterAngle = Math.random() * Math.PI * 2;
      const jitterDist = 20 + Math.random() * 90;

      if (existing) {
        existing.degree = degree;
        existing.radius = radius;
        existing.state = state;
      } else {
        this.nodes.set(n.id, {
          id: n.id,
          label: n.label,
          x: commCenter.cx + Math.cos(jitterAngle) * jitterDist,
          y: commCenter.cy + Math.sin(jitterAngle) * jitterDist,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          radius,
          degree,
          community: n.community,
          state,
          pulsePhase: Math.random() * Math.PI * 2,
        });
      }
    }
  }

  /**
   * Update disease states for nodes smoothly
   */
  updateStates(states: Map<NodeId, HealthState>) {
    for (const [id, state] of states.entries()) {
      const vNode = this.nodes.get(id);
      if (vNode && vNode.state !== state) {
        vNode.state = state;
        vNode.rippleRadius = vNode.radius; // trigger state change ripple
      }
    }
  }

  /**
   * Emit an animated transmission particle from source to target
   */
  spawnTransmissionParticle(sourceId: NodeId, targetId: NodeId) {
    this.particles.push({
      sourceId,
      targetId,
      progress: 0,
      speed: 0.035 + Math.random() * 0.015,
      active: true,
    });
  }

  /**
   * Physics simulation step: spring forces on edges and repulsion between nodes
   */
  private stepPhysics() {
    const nodesArr = Array.from(this.nodes.values());
    const kRepel = 700;
    const kSpring = 0.012;
    const damp = 0.88;

    // Node-node repulsion (Coulomb-like)
    for (let i = 0; i < nodesArr.length; i++) {
      const n1 = nodesArr[i];
      if (n1 === this.draggedNode) continue;

      for (let j = i + 1; j < nodesArr.length; j++) {
        const n2 = nodesArr[j];
        const dx = n2.x - n1.x;
        const dy = n2.y - n1.y;
        const distSq = dx * dx + dy * dy + 1;
        const dist = Math.sqrt(distSq);

        if (dist < 220) {
          const force = kRepel / distSq;
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;

          n1.vx -= fx;
          n1.vy -= fy;
          if (n2 !== this.draggedNode) {
            n2.vx += fx;
            n2.vy += fy;
          }
        }
      }
    }

    // Edge springs (Hooke-like)
    for (const edge of this.edges) {
      if (edge.disabled) continue;
      const n1 = this.nodes.get(edge.source);
      const n2 = this.nodes.get(edge.target);
      if (!n1 || !n2) continue;

      const dx = n2.x - n1.x;
      const dy = n2.y - n1.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const desiredLength = edge.isBridge ? 130 : 65;
      const diff = dist - desiredLength;
      const force = diff * kSpring;

      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;

      if (n1 !== this.draggedNode) {
        n1.vx += fx;
        n1.vy += fy;
      }
      if (n2 !== this.draggedNode) {
        n2.vx -= fx;
        n2.vy -= fy;
      }
    }

    // Community gravitation pull
    const width = this.canvas.width || 800;
    const height = this.canvas.height || 600;
    const centerX = width / 2;
    const centerY = height / 2;

    for (const n of nodesArr) {
      if (n === this.draggedNode) continue;

      // Slight pull towards center
      n.vx += (centerX - n.x) * 0.0004;
      n.vy += (centerY - n.y) * 0.0004;

      n.vx *= damp;
      n.vy *= damp;
      n.x += n.vx;
      n.y += n.vy;
    }
  }

  /**
   * Main render loop
   */
  start() {
    if (this.animationFrameId !== null) return;

    const render = () => {
      this.stepPhysics();
      this.draw();
      this.animationFrameId = requestAnimationFrame(render);
    };

    this.animationFrameId = requestAnimationFrame(render);
  }

  stop() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * Draw complete scene onto canvas
   */
  private draw() {
    const ctx = this.ctx;
    const dpr = window.devicePixelRatio || 1;

    ctx.save();
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Apply zoom & pan transform
    ctx.scale(dpr, dpr);
    ctx.translate(this.transform.x, this.transform.y);
    ctx.scale(this.transform.scale, this.transform.scale);

    // 1. Draw subtle Community Halos
    this.drawCommunityHalos(ctx);

    // 2. Draw Edges
    this.drawEdges(ctx);

    // 3. Draw Transmission Particles
    this.drawParticles(ctx);

    // 4. Draw Nodes
    this.drawNodes(ctx);

    ctx.restore();
  }

  private drawCommunityHalos(ctx: CanvasRenderingContext2D) {
    const communityNodes = new Map<number, VisualNode[]>();
    for (const n of this.nodes.values()) {
      const list = communityNodes.get(n.community) || [];
      list.push(n);
      communityNodes.set(n.community, list);
    }

    ctx.save();
    for (const [, list] of communityNodes.entries()) {
      if (list.length === 0) continue;
      let sumX = 0, sumY = 0;
      for (const n of list) {
        sumX += n.x;
        sumY += n.y;
      }
      const cx = sumX / list.length;
      const cy = sumY / list.length;

      let maxDist = 60;
      for (const n of list) {
        const d = Math.hypot(n.x - cx, n.y - cy);
        if (d > maxDist) maxDist = d;
      }

      const grad = ctx.createRadialGradient(cx, cy, 20, cx, cy, maxDist + 40);
      grad.addColorStop(0, 'rgba(174, 226, 255, 0.16)');
      grad.addColorStop(0.7, 'rgba(181, 186, 255, 0.08)');
      grad.addColorStop(1, 'rgba(255, 255, 255, 0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, maxDist + 40, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  private drawEdges(ctx: CanvasRenderingContext2D) {
    const isSurgery = this.options.surgeryMode;
    const highlightBridges = this.options.highlightedBridges;
    const path = this.options.highlightedPath;
    const pathEdges = new Set<string>();

    if (path && path.length > 1) {
      for (let i = 0; i < path.length - 1; i++) {
        const k1 = `${path[i]}-${path[i + 1]}`;
        const k2 = `${path[i + 1]}-${path[i]}`;
        pathEdges.add(k1);
        pathEdges.add(k2);
      }
    }

    for (const edge of this.edges) {
      const n1 = this.nodes.get(edge.source);
      const n2 = this.nodes.get(edge.target);
      if (!n1 || !n2) continue;

      const edgeKey = `${edge.source}-${edge.target}`;
      const isHovered = this.hoveredEdge && (
        (this.hoveredEdge.source === edge.source && this.hoveredEdge.target === edge.target) ||
        (this.hoveredEdge.source === edge.target && this.hoveredEdge.target === edge.source)
      );

      ctx.save();

      if (edge.disabled) {
        // Disabled edge: faint dashed
        ctx.strokeStyle = 'rgba(180, 185, 210, 0.22)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
      } else if (pathEdges.has(edgeKey)) {
        // Path highlighted: glowing deep lavender
        ctx.strokeStyle = '#9192E8';
        ctx.lineWidth = 3.5;
        ctx.shadowColor = '#9192E8';
        ctx.shadowBlur = 10;
      } else if (highlightBridges && (highlightBridges.has(edgeKey) || highlightBridges.has(`${edge.target}-${edge.source}`))) {
        // Bridge highlight mode: bright lavender-mint with dash
        ctx.strokeStyle = '#9192E8';
        ctx.lineWidth = 2.8;
        ctx.setLineDash([6, 3]);
        ctx.shadowColor = '#9FA1FF';
        ctx.shadowBlur = 8;
      } else if (isHovered) {
        // Hovered edge: highlighted with glow
        ctx.strokeStyle = isSurgery ? '#9192E8' : '#B5BAFF';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#9FA1FF';
        ctx.shadowBlur = 6;
      } else if (edge.isBridge) {
        // Natural bridge: slightly thicker lavender
        ctx.strokeStyle = 'rgba(145, 146, 232, 0.42)';
        ctx.lineWidth = 1.8;
        ctx.setLineDash([5, 3]);
      } else {
        // Normal contact edge: thin soft lavender
        ctx.strokeStyle = 'rgba(181, 186, 255, 0.32)';
        ctx.lineWidth = 1.2;
      }

      ctx.beginPath();
      ctx.moveTo(n1.x, n1.y);
      ctx.lineTo(n2.x, n2.y);
      ctx.stroke();

      ctx.restore();
    }
  }

  private drawParticles(ctx: CanvasRenderingContext2D) {
    const remainingParticles: TransmissionParticle[] = [];

    for (const p of this.particles) {
      if (!p.active) continue;
      const n1 = this.nodes.get(p.sourceId);
      const n2 = this.nodes.get(p.targetId);
      if (!n1 || !n2) continue;

      p.progress += p.speed;

      if (p.progress >= 1) {
        p.active = false;
        n2.rippleRadius = n2.radius; // Trigger arrival ripple
      } else {
        remainingParticles.push(p);

        // Smooth cubic ease-in-out
        const t = p.progress;
        const px = n1.x + (n2.x - n1.x) * t;
        const py = n1.y + (n2.y - n1.y) * t;

        ctx.save();
        ctx.fillStyle = '#9192E8';
        ctx.shadowColor = '#9192E8';
        ctx.shadowBlur = 12;

        ctx.beginPath();
        ctx.arc(px, py, 3.8, 0, Math.PI * 2);
        ctx.fill();

        // Particle trail
        ctx.strokeStyle = 'rgba(145, 146, 232, 0.4)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(px - (n2.x - n1.x) * 0.05, py - (n2.y - n1.y) * 0.05);
        ctx.lineTo(px, py);
        ctx.stroke();

        ctx.restore();
      }
    }

    this.particles = remainingParticles;
  }

  private drawNodes(ctx: CanvasRenderingContext2D) {
    const focusedId = this.options.focusedNodeId;
    const traversal = this.options.traversalOrder;

    for (const n of this.nodes.values()) {
      n.pulsePhase = (n.pulsePhase + 0.03) % (Math.PI * 2);

      const isHovered = this.hoveredNode?.id === n.id;
      const isFocused = focusedId === n.id;
      const isUser = this.options.userNodeId === n.id;
      const traversalNum = traversal?.get(n.id);

      ctx.save();

      // State-based coloring and glow according to palette:
      // S: soft lavender/blue #9FA1FF / #AEE2FF
      // E: sky-blue #AEE2FF with slow pulsing ring
      // I: bright lavender #9192E8 with energetic glow
      // R: soft mint #D9F9DF with faded glow
      let fillColor = '#9FA1FF';
      let strokeColor = '#B5BAFF';
      let glowColor: string | null = null;
      let strokeWidth = 1.5;

      switch (n.state) {
        case 'S':
          fillColor = '#AEE2FF';
          strokeColor = '#9FA1FF';
          break;
        case 'E':
          fillColor = '#AEE2FF';
          strokeColor = '#9192E8';
          strokeWidth = 2.2;
          glowColor = 'rgba(174, 226, 255, 0.7)';
          break;
        case 'I':
          fillColor = '#9192E8';
          strokeColor = '#FFFFFF';
          strokeWidth = 2.5;
          glowColor = '#9192E8';
          break;
        case 'R':
          fillColor = '#D9F9DF';
          strokeColor = '#8FD9A8';
          glowColor = 'rgba(217, 249, 223, 0.4)';
          break;
      }

      // 1. Draw arrival ripple if active
      if (n.rippleRadius !== undefined && n.rippleRadius < n.radius + 24) {
        n.rippleRadius += 0.9;
        const alpha = Math.max(0, 1 - (n.rippleRadius - n.radius) / 24);
        ctx.strokeStyle = `rgba(145, 146, 232, ${alpha})`;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.rippleRadius, 0, Math.PI * 2);
        ctx.stroke();
      }

      // 2. Glow effect
      if (glowColor || isHovered || isFocused || isUser) {
        ctx.shadowColor = isUser ? '#9192E8' : (glowColor || '#9192E8');
        ctx.shadowBlur = isUser ? 20 : (isHovered || isFocused ? 16 : 9);
      }

      // 2b. Authenticated User Node Highlight Ring
      if (isUser) {
        ctx.save();
        ctx.strokeStyle = '#9192E8';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([4, 4]);
        const haloRadius = n.radius + 8 + Math.sin(n.pulsePhase * 2) * 2;
        ctx.beginPath();
        ctx.arc(n.x, n.y, haloRadius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(159, 161, 255, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.arc(n.x, n.y, haloRadius + 4, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // 2c. Contact Tracing Concentric Degrees (1st, 2nd, 3rd Degree Halos)
      const traceDegrees = this.options.traceDegrees;
      if (traceDegrees) {
        if (traceDegrees.deg1.has(n.id)) {
          ctx.save();
          ctx.strokeStyle = '#F25F5C';
          ctx.lineWidth = 2;
          ctx.setLineDash([3, 2]);
          ctx.beginPath();
          ctx.arc(n.x, n.y, n.radius + 7, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        } else if (traceDegrees.deg2.has(n.id)) {
          ctx.save();
          ctx.strokeStyle = '#E5A93B';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 3]);
          ctx.beginPath();
          ctx.arc(n.x, n.y, n.radius + 6, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        } else if (traceDegrees.deg3.has(n.id)) {
          ctx.save();
          ctx.strokeStyle = '#9192E8';
          ctx.lineWidth = 1.2;
          ctx.setLineDash([2, 2]);
          ctx.beginPath();
          ctx.arc(n.x, n.y, n.radius + 5, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }
      }

      // 2d. Risk Heatmap Mode Halos & Override
      const isRiskMap = this.options.riskMapMode;
      const riskScore = this.options.riskScores?.get(n.id);
      if (isRiskMap && riskScore) {
        ctx.save();
        let riskColor = '#4EBA88'; // LOW
        if (riskScore === 'MEDIUM') riskColor = '#E5A93B';
        else if (riskScore === 'HIGH') riskColor = '#E76F51';
        else if (riskScore === 'CRITICAL') riskColor = '#F25F5C';

        ctx.strokeStyle = riskColor;
        ctx.lineWidth = 2;
        ctx.shadowColor = riskColor;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius + 6 + Math.sin(n.pulsePhase) * 1.5, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // 2e. Isolated Node Status
      const isIsolated = this.options.isolatedNodes?.has(n.id);
      if (isIsolated) {
        fillColor = '#60647E';
        strokeColor = '#A0A4BC';
        strokeWidth = 2;
      }

      // 3. Node Circle
      let curRadius = n.radius;
      if (n.state === 'E') {
        curRadius += Math.sin(n.pulsePhase) * 1.0;
      } else if (n.state === 'I') {
        curRadius += Math.sin(n.pulsePhase * 2) * 1.5;
      }
      if (isHovered || isUser) curRadius += 2.5;

      ctx.fillStyle = fillColor;
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = strokeWidth;

      ctx.beginPath();
      ctx.arc(n.x, n.y, curRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // 4. Accessibility icon/shape symbol inside node
      ctx.fillStyle = n.state === 'I' ? '#FFFFFF' : '#444766';
      ctx.font = `600 ${Math.max(7, Math.floor(curRadius * 0.7))}px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      let stateSymbol = '•';
      if (isIsolated) stateSymbol = '✕';
      else if (n.state === 'S') stateSymbol = 'S';
      else if (n.state === 'E') stateSymbol = 'E';
      else if (n.state === 'I') stateSymbol = 'I';
      else if (n.state === 'R') stateSymbol = 'R';

      ctx.fillText(stateSymbol, n.x, n.y);

      // 5. Traversal step order badge (for BFS/DFS)
      if (traversalNum !== undefined) {
        ctx.fillStyle = '#9192E8';
        ctx.beginPath();
        ctx.arc(n.x + curRadius + 2, n.y - curRadius - 2, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 8px Inter, sans-serif';
        ctx.fillText(String(traversalNum), n.x + curRadius + 2, n.y - curRadius - 2);
      }

      // 5b. Authenticated User Badge above node
      if (isUser) {
        ctx.save();
        ctx.shadowBlur = 0;
        const tagText = 'YOU (MY NODE)';
        ctx.font = 'bold 9px Inter, sans-serif';
        const metrics = ctx.measureText(tagText);
        const tagW = metrics.width + 12;
        const tagH = 16;
        const tagX = n.x - tagW / 2;
        const tagY = n.y - curRadius - 22;

        ctx.fillStyle = '#9192E8';
        ctx.beginPath();
        ctx.roundRect(tagX, tagY, tagW, tagH, 8);
        ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(tagText, n.x, tagY + tagH / 2);
        ctx.restore();
      }

      // 6. Label if hovered or hub
      if (isHovered || isFocused || isUser || n.degree >= 8) {
        ctx.fillStyle = '#444766';
        ctx.font = '500 10px Inter, sans-serif';
        ctx.fillText(n.label, n.x, n.y + curRadius + 11);
      }

      ctx.restore();
    }
  }

  /**
   * Set up mouse and pointer interactions
   */
  private setupEvents() {
    const canvas = this.canvas;

    const getCanvasPos = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const clientX = e.clientX - rect.left;
      const clientY = e.clientY - rect.top;
      // Invert viewport transform
      const worldX = (clientX - this.transform.x) / this.transform.scale;
      const worldY = (clientY - this.transform.y) / this.transform.scale;
      return { clientX, clientY, worldX, worldY };
    };

    canvas.addEventListener('mousedown', (e: MouseEvent) => {
      const { worldX, worldY, clientX, clientY } = getCanvasPos(e);
      this.lastMouse = { x: clientX, y: clientY };

      // Check if clicked a node
      let foundNode: VisualNode | null = null;
      for (const n of this.nodes.values()) {
        const dist = Math.hypot(n.x - worldX, n.y - worldY);
        if (dist <= n.radius + 4) {
          foundNode = n;
          break;
        }
      }

      if (foundNode) {
        this.draggedNode = foundNode;
        if (this.onNodeSelect) this.onNodeSelect(foundNode);
      } else {
        // Check if clicked an edge
        let clickedEdge: VisualEdge | null = null;
        for (const edge of this.edges) {
          const n1 = this.nodes.get(edge.source);
          const n2 = this.nodes.get(edge.target);
          if (!n1 || !n2) continue;
          const d = this.distToSegment(worldX, worldY, n1.x, n1.y, n2.x, n2.y);
          if (d <= 6) {
            clickedEdge = edge;
            break;
          }
        }

        if (clickedEdge) {
          if (this.onEdgeSelect) {
            this.onEdgeSelect(clickedEdge, { x: clientX, y: clientY });
          }
        } else {
          // Pan mode
          this.isDragging = true;
          if (this.onNodeSelect) this.onNodeSelect(null);
          if (this.onEdgeSelect) this.onEdgeSelect(null, { x: 0, y: 0 });
        }
      }
    });

    window.addEventListener('mousemove', (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      if (
        e.clientX < rect.left ||
        e.clientX > rect.right ||
        e.clientY < rect.top ||
        e.clientY > rect.bottom
      ) {
        if (!this.draggedNode && !this.isDragging) return;
      }

      const { worldX, worldY, clientX, clientY } = getCanvasPos(e);
      const dx = clientX - this.lastMouse.x;
      const dy = clientY - this.lastMouse.y;
      this.lastMouse = { x: clientX, y: clientY };

      if (this.draggedNode) {
        this.draggedNode.x = worldX;
        this.draggedNode.y = worldY;
        this.draggedNode.vx = 0;
        this.draggedNode.vy = 0;
      } else if (this.isDragging) {
        this.transform.x += dx;
        this.transform.y += dy;
      } else {
        // Hover hit detection
        let hNode: VisualNode | null = null;
        for (const n of this.nodes.values()) {
          const dist = Math.hypot(n.x - worldX, n.y - worldY);
          if (dist <= n.radius + 4) {
            hNode = n;
            break;
          }
        }
        this.hoveredNode = hNode;

        let hEdge: VisualEdge | null = null;
        if (!hNode) {
          for (const edge of this.edges) {
            const n1 = this.nodes.get(edge.source);
            const n2 = this.nodes.get(edge.target);
            if (!n1 || !n2) continue;
            const d = this.distToSegment(worldX, worldY, n1.x, n1.y, n2.x, n2.y);
            if (d <= 5) {
              hEdge = edge;
              break;
            }
          }
        }
        this.hoveredEdge = hEdge;
      }
    });

    window.addEventListener('mouseup', () => {
      this.draggedNode = null;
      this.isDragging = false;
    });

    canvas.addEventListener('wheel', (e: WheelEvent) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
      const newScale = Math.max(0.3, Math.min(3.5, this.transform.scale * zoomFactor));

      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      this.transform.x = mouseX - (mouseX - this.transform.x) * (newScale / this.transform.scale);
      this.transform.y = mouseY - (mouseY - this.transform.y) * (newScale / this.transform.scale);
      this.transform.scale = newScale;
    }, { passive: false });
  }

  /**
   * Distance from point (px, py) to line segment (x1, y1)-(x2, y2)
   */
  private distToSegment(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
    const l2 = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
    if (l2 === 0) return Math.hypot(px - x1, py - y1);
    let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)));
  }

  /**
   * Center camera view around nodes
   */
  centerView() {
    this.transform = { x: 0, y: 0, scale: 1 };
  }
}
