import React, { useEffect, useRef } from "react";
import { OrgChart } from "d3-org-chart";

// ── Types ────────────────────────────────────────────────────────────────────
interface OrgNode {
  nodeId: string;
  parentNodeId?: string | null;
  width?: number;
  height?: number;
  template?: string;
  name?: string;
  username?: string;
  PaidStatus?: "paid" | "unpaid";
  directSubordinates?: number;
  totalSubordinates?: number;
  [key: string]: any;
}

interface Props {
  data: OrgNode[] | null;
  onNodeClick?: (nodeId: string) => void;
}

// ── Inject styles once ───────────────────────────────────────────────────────
const STYLE_ID = "org-chart-pro-styles";
function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;600;700&family=Exo+2:wght@300;400;500;600&display=swap');

    :root {
      --ot-bg:       #f4f6fa;
      --ot-card:     #ffffff;
      --ot-border:   #dde3ef;
      --ot-gold:     #d97706;
      --ot-gold-dim: #f59e0b;
      --ot-cyan:     #0ea5e9;
      --ot-green:    #16a34a;
      --ot-red:      #dc2626;
      --ot-text:     #1e293b;
      --ot-text-dim: #94a3b8;
    }

    .org-chart-pro-wrap {
      overflow: hidden;
      width: 100%;
      min-height: 520px;
      position: relative;
    }

    /* ── connector lines ── */
    @keyframes orgDash { to { stroke-dashoffset: -18; } }
    .org-chart-pro-wrap path.link {
      stroke: #0ea5e9 !important;
      stroke-width: 2px !important;
      stroke-dasharray: 6,3 !important;
      fill: none !important;
      animation: orgDash 1.5s linear infinite !important;
    }

    /* ── expand/collapse button ── */
    .org-chart-pro-wrap .node-button-circle {
      fill: #ffffff !important;
      stroke: var(--ot-gold-dim) !important;
    }
    .org-chart-pro-wrap .node-button-text {
      fill: var(--ot-gold) !important;
    }

    /* ── node card ── */
    .org-node-card {
      font-family: 'Exo 2', sans-serif;
      background: var(--ot-card);
      border: 1px solid var(--ot-border);
      border-radius: 16px;
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
      padding: 14px 10px 10px;
      position: relative;
      cursor: pointer;
      box-shadow: 0 2px 12px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.06);
      box-sizing: border-box;
      overflow: hidden;
      transition: box-shadow 0.2s, border-color 0.2s;
    }
    .org-node-card:hover {
      border-color: var(--ot-cyan);
      box-shadow: 0 0 0 1px var(--ot-cyan), 0 8px 24px rgba(14,165,233,0.15);
    }
    .org-node-card.root {
      border-color: var(--ot-gold-dim);
      box-shadow: 0 0 0 1px var(--ot-gold-dim), 0 8px 32px rgba(245,158,11,0.15);
    }
    .org-node-card.root:hover {
      border-color: var(--ot-gold);
      box-shadow: 0 0 0 2px var(--ot-gold), 0 8px 32px rgba(217,119,6,0.2);
    }

    /* ── status dot ── */
    .org-node-dot {
      position: absolute; top: 9px; right: 9px;
      width: 8px; height: 8px; border-radius: 50%;
    }
    .org-node-dot.active   { background: var(--ot-green); box-shadow: 0 0 6px var(--ot-green); }
    .org-node-dot.inactive { background: var(--ot-red); }

    /* ── spinning avatar ring ── */
    @keyframes orgSpin { to { transform: rotate(360deg); } }

    .org-avatar-ring {
      width: 62px; height: 62px; border-radius: 50%;
      padding: 3px;
      background: conic-gradient(var(--ot-cyan), #38bdf8, var(--ot-cyan));
      flex-shrink: 0; margin-bottom: 8px;
      animation: orgSpin 8s linear infinite;
    }
    .org-node-card.root .org-avatar-ring {
      background: conic-gradient(var(--ot-gold), var(--ot-gold-dim), var(--ot-gold));
    }
    .org-avatar-inner {
      width: 100%; height: 100%; border-radius: 50%;
      background: #f0f7ff;
      display: flex; align-items: center; justify-content: center;
      animation: orgSpin 8s linear infinite reverse;
    }
    .org-diamond {
      width: 32px; height: 32px;
      background: linear-gradient(135deg, var(--ot-cyan) 30%, #38bdf8);
      clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%);
      position: relative;
    }
    .org-node-card.root .org-diamond {
      background: linear-gradient(135deg, var(--ot-gold) 30%, var(--ot-gold-dim));
    }
    .org-diamond::after {
      content: '';
      position: absolute; top: 50%; left: 50%;
      transform: translate(-50%, -50%);
      width: 12px; height: 12px;
      background: rgba(255,255,255,.45);
      clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%);
    }

    /* ── name / username ── */
    .org-node-name {
      font-family: 'Rajdhani', sans-serif;
      font-size: 14px; font-weight: 700; letter-spacing: 1px;
      color: var(--ot-text); text-align: center; line-height: 1.4;
      max-width: 154px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
    .org-node-uname {
      font-size: 10px; color: var(--ot-cyan);
      letter-spacing: 1px; margin-top: 2px; text-align: center;
    }
    .org-node-card.root .org-node-uname { color: var(--ot-gold); }

    /* ── stats row ── */
    .org-node-stats {
      display: flex; width: 100%;
      margin-top: 8px;
      border-top: 1px solid var(--ot-border);
      padding-top: 7px;
      background: #f8fafc;
      border-radius: 0 0 12px 12px;
      margin-left: -10px;
      margin-right: -10px;
      padding-left: 10px;
      padding-right: 10px;
      width: calc(100% + 20px);
      margin-bottom: -10px;
    }
    .org-stat {
      flex: 1; display: flex; flex-direction: column; align-items: center;
    }
    .org-stat + .org-stat { border-left: 1px solid var(--ot-border); }
    .org-stat-val {
      font-family: 'Rajdhani', sans-serif;
      font-size: 16px; font-weight: 700; color: var(--ot-gold); line-height: 1;
    }
    .org-stat:first-child .org-stat-val { color: var(--ot-cyan); }
    .org-stat-lbl {
      font-size: 8px; color: var(--ot-text-dim);
      letter-spacing: 1px; text-transform: uppercase; margin-top: 2px; text-align: center;
    }
  `;
  document.head.appendChild(style);
}

// ── Build HTML template for one node ────────────────────────────────────────
function buildTemplate(n: OrgNode): string {
  const isRoot  = !n.parentNodeId || n.parentNodeId === "" || n.parentNodeId === null;
  const active  = n.PaidStatus === "paid";
  const name    = n.name     ?? n.Name     ?? "";
  const uname   = n.username ?? n.Username ?? n.nodeId ?? "";
  const direct  = n.directSubordinates ?? 0;
  const total   = n.totalSubordinates  ?? 0;

  return `
    <div class="org-node-card${isRoot ? " root" : ""}">
      <div class="org-node-dot ${active ? "active" : "inactive"}"></div>
      <div class="org-avatar-ring">
        <div class="org-avatar-inner">
          <div class="org-diamond"></div>
        </div>
      </div>
      <div class="org-node-name" title="${name}">${name}</div>
      <div class="org-node-uname">[${uname}]</div>
      <div class="org-node-stats">
        <div class="org-stat">
          <div class="org-stat-val">${direct}</div>
          <div class="org-stat-lbl">Direct</div>
        </div>
        <div class="org-stat">
          <div class="org-stat-val">${total}</div>
          <div class="org-stat-lbl">Total</div>
        </div>
      </div>
    </div>`;
}

// ── Normalise one raw API row → fields OrgChart v2 expects ──────────────────
// OrgChart (named export / v2) uses: id, parentId, width, height + nodeContent()
function normaliseRow(n: OrgNode) {
  return {
    ...n,
    // v2 named-export uses "id" and "parentId"
    id:       String(n.nodeId      ?? n.id      ?? ""),
    parentId: n.parentNodeId != null && n.parentNodeId !== ""
                ? String(n.parentNodeId)
                : n.parentId  != null && n.parentId  !== ""
                ? String(n.parentId)
                : null,           // root → null
    width:  n.width  ?? 180,
    height: n.height ?? 196,
    // keep original fields so buildTemplate can read them
    name:               n.name     ?? n.Name     ?? "",
    username:           n.username ?? n.Username ?? n.nodeId ?? "",
    PaidStatus:         n.PaidStatus ?? "unpaid",
    directSubordinates: n.directSubordinates ?? 0,
    totalSubordinates:  n.totalSubordinates  ?? 0,
  };
}

// ── Component ────────────────────────────────────────────────────────────────
const OrgChartComponent: React.FC<Props> = ({ data, onNodeClick }) => {
  const chartRef      = useRef<HTMLDivElement | null>(null);
  const chartInstance = useRef<any>(null);

  useEffect(() => { injectStyles(); }, []);

  useEffect(() => {
    if (!data?.length || !chartRef.current) return;

    // Destroy previous instance before re-rendering
    if (chartInstance.current) {
      try { chartInstance.current.container(null); } catch (_) { /* ignore */ }
      chartInstance.current = null;
    }
    if (chartRef.current) chartRef.current.innerHTML = "";

    const rows = data.map(normaliseRow);

    chartInstance.current = new OrgChart()
      .container(chartRef.current)
      .data(rows)
      .nodeWidth(() => 180)
      .nodeHeight(() => 196)
      .childrenMargin(() => 70)
      .siblingsMargin(() => 50)
      .neighbourMargin(() => 30)
      .layout("top")
      .compact(false)
      .nodeContent((d: any) => buildTemplate(d.data))
      .onNodeClick((d: any) => {
        // Fire external handler with the raw nodeId from original data
        const rawNodeId = d.data?.nodeId ?? d.id ?? "";
        onNodeClick?.(rawNodeId);
      })
      .render()
      .fit();

    return () => {
      try { chartInstance.current?.container(null); } catch (_) { /* ignore */ }
      chartInstance.current = null;
    };
  }, [data]);

  return (
    <div className="org-chart-pro-wrap">
      <div
        ref={chartRef}
        style={{ width: "100%", minHeight: 520, background: "#f4f6fa" }}
      />
    </div>
  );
};

export default OrgChartComponent;