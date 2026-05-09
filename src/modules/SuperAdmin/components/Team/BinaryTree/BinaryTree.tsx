/**
 * BinaryTree.jsx
 * Recursive binary-tree renderer with pixel-perfect SVG connector lines.
 *
 * Green border  = paidstatus "Paid"
 * Red border    = paidstatus "UnPaid"
 *
 * Popup design matches the "MEMBER DETAILS" screenshot exactly:
 *   - Purple-pink gradient header with × close button
 *   - Alternating dark-gray rows for each field
 *   - Status badge (Active=green, InActive=orange pill)
 *   - Investment in cyan/teal
 *   - Business Summary table at bottom
 */

import React, {
  useState, useEffect, useRef, useLayoutEffect, useCallback,
} from "react";

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const STYLE_ID = "bt-styles-v9";
function injectStyles() {
  if (typeof document === "undefined" || document.getElementById(STYLE_ID)) return;
  const s = document.createElement("style");
  s.id = STYLE_ID;
  s.textContent = `
  .bt-root { width:100%; box-sizing:border-box; font-family:'Segoe UI',Arial,sans-serif; }

  .bt-viewport {
    width:100%; height:600px; overflow:hidden; position:relative;
    cursor:grab; user-select:none; touch-action:none;
    border-bottom:1px solid #e5e7eb;
    background:#f0f1f3;
  }
  .bt-viewport:active { cursor:grabbing; }
  .bt-canvas { position:absolute; top:0; left:0; transform-origin:0 0; }
  .bt-inner  { padding:40px 24px 56px; display:inline-block; position:relative; }
  .bt-level-row { display:flex; justify-content:center; }
  .bt-col {
    display:flex; flex-direction:column; align-items:center;
    flex:1; min-width:120px;
  }

  /* ── avatar ── */
  .bt-avatar {
    width:90px; height:90px; border-radius:50%;
    border:3px solid #d1d5db; background:#f3f4f6;
    display:flex; align-items:center; justify-content:center;
    overflow:hidden; flex-shrink:0; cursor:pointer;
    transition:transform .15s, box-shadow .15s;
    position:relative; z-index:2;
  }
  .bt-avatar:hover { transform:scale(1.05); }
  .bt-avatar img { width:100%; height:100%; object-fit:cover; border-radius:50%; }

  /* Green = Paid */
  .bt-avatar.paid   { border-color:#22c55e; box-shadow:0 0 0 3px rgba(34,197,94,.20); }
  /* Red   = UnPaid */
  .bt-avatar.unpaid { border-color:#ef4444; box-shadow:0 0 0 3px rgba(239,68,68,.20); }

  /* blank slot */
  .bt-avatar.empty { border:3px dashed #d1d5db; background:#f0f1f3; cursor:default; }
  .bt-avatar.empty:hover { transform:none; }

  /* ── name pill ── */
  .bt-label {
    margin-top:8px; background:#6366f1; color:#fff;
    font-size:10px; font-weight:700; letter-spacing:.9px;
    padding:4px 14px; border-radius:4px; text-align:center;
    max-width:140px; overflow:hidden; text-overflow:ellipsis;
    white-space:nowrap; text-transform:uppercase; user-select:none;
    position:relative; z-index:2;
  }
  .bt-label.empty-label { background:#9ca3af; }
  .bt-label.paid   { background:#22c55e; border:none;}
  .bt-label.unpaid { background:#ef4444; border:none;}

  /* ── Paid/UnPaid badge ── */
  .bt-paid-badge {
    margin-top:4px; font-size:9px; font-weight:700;
    letter-spacing:.8px; padding:2px 10px; border-radius:20px;
    text-align:center; text-transform:uppercase;
    user-select:none; position:relative; z-index:2;
  }
  .bt-paid-badge.paid   { background:rgba(34,197,94,.12); color:#16a34a; border:1px solid rgba(34,197,94,.35); }
  .bt-paid-badge.unpaid { background:rgba(239,68,68,.10);  color:#dc2626; border:1px solid rgba(239,68,68,.30); }

  /* ── chevron ── */
  .bt-chevron {
    margin-top:10px; width:30px; height:30px; border-radius:50%;
    border:2px solid #6366f1; background:#fff;
    display:flex; align-items:center; justify-content:center;
    cursor:pointer; color:#6366f1;
    transition:background .18s, transform .15s, box-shadow .18s;
    box-shadow:0 2px 8px rgba(99,102,241,.2);
    flex-shrink:0; position:relative; z-index:2;
    animation:btPulse 2s ease-in-out infinite;
  }
  .bt-chevron svg {
    width:15px; height:15px; stroke:currentColor;
    fill:none; stroke-width:2.5; stroke-linecap:round; stroke-linejoin:round;
  }
  .bt-chevron:hover {
    background:#6366f1; color:#fff;
    box-shadow:0 4px 16px rgba(99,102,241,.4);
    transform:translateY(-1px) scale(1.1); animation:none;
  }
  @keyframes btPulse {
    0%,100% { box-shadow:0 2px 8px rgba(99,102,241,.2); }
    50%      { box-shadow:0 2px 16px rgba(99,102,241,.5); }
  }

  /* ── node wrapper ── */
  .bt-node-wrap {
    display:flex; flex-direction:column; align-items:center;
    position:relative; padding-top:36px;
  }
  .bt-node-wrap.bt-root-node { padding-top:0; }

  /* ═══════════════════════════════════════════════════════════════════════════
   * MEMBER DETAILS POPUP — matches screenshot exactly
   * Fixed positioned so it never gets clipped by overflow:hidden parents
   * ═══════════════════════════════════════════════════════════════════════════ */
  .bt-popup-overlay {
    position:fixed; inset:0; z-index:9998;
    pointer-events:none;
  }

  .bt-popup {
    position:fixed;
    z-index:9999;
    width:340px;
    background:#fff;
    border-radius:12px;
    box-shadow:0 20px 60px rgba(0,0,0,.25);
    overflow:hidden;
    pointer-events:all;
    animation:btPopIn .18s ease;
  }
  @keyframes btPopIn {
    from { opacity:0; transform:scale(.94); }
    to   { opacity:1; transform:scale(1);   }
  }

  /* Header — purple-pink gradient matching screenshot */
  .bt-popup-header {
    background:linear-gradient(135deg,#7c3aed,#ec4899);
    display:flex; align-items:center; justify-content:space-between;
    padding:12px 16px;
  }
  .bt-popup-title {
    font-size:13px; font-weight:800; color:#fff;
    letter-spacing:1.2px; text-transform:uppercase;
  }
  .bt-popup-close {
    width:22px; height:22px; border-radius:50%;
    border:2px solid rgba(255,255,255,.6);
    background:transparent; color:#fff; cursor:pointer;
    display:flex; align-items:center; justify-content:center;
    font-size:13px; font-weight:700; line-height:1;
    transition:background .15s;
  }
  .bt-popup-close:hover { background:rgba(255,255,255,.25); }

  /* Rows — alternating dark-gray matching screenshot */
  .bt-popup-row {
    display:flex; align-items:center; justify-content:space-between;
    padding:9px 16px;
    background:#5a5a5a;
    border-bottom:1px solid rgba(255,255,255,.08);
  }
  .bt-popup-row:nth-child(even) { background:#4e4e4e; }
  .bt-popup-row-label {
    font-size:11px; font-weight:600; color:#e5e7eb; letter-spacing:.3px;
  }
  .bt-popup-row-value {
    font-size:11px; font-weight:600; color:#fff; text-align:right;
  }

  /* Status pill — InActive = orange, Active = green */
  .bt-status-pill {
    display:inline-block; font-size:10px; font-weight:700;
    padding:2px 10px; border-radius:20px; letter-spacing:.5px;
  }
  .bt-status-pill.active   { background:#22c55e; color:#fff; }
  .bt-status-pill.inactive { background:#f97316; color:#fff; }
  .bt-status-pill.paid     { background:#22c55e; color:#fff; }
  .bt-status-pill.unpaid   { background:#ef4444; color:#fff; }

  /* Investment value — cyan matching screenshot */
  .bt-invest-val { color:#06b6d4; font-weight:700; font-size:12px; }

  /* Business Summary section */
  .bt-popup-summary-head {
    background:#3f3f3f;
    padding:8px 16px;
    font-size:11px; font-weight:700; color:#e5e7eb;
    text-align:center; letter-spacing:.5px;
    border-bottom:1px solid rgba(255,255,255,.08);
  }
  .bt-popup-summary-grid {
    background:#4a4a4a;
    display:grid; grid-template-columns:1fr 1fr;
    gap:0;
  }
  .bt-popup-summary-cell {
    padding:8px 14px;
    border-bottom:1px solid rgba(255,255,255,.08);
    border-right:1px solid rgba(255,255,255,.08);
    display:flex; align-items:center; justify-content:space-between;
  }
  .bt-popup-summary-cell:nth-child(even) { border-right:none; }
  .bt-popup-summary-cell-label { font-size:10px; color:#d1d5db; font-weight:500; }
  .bt-popup-summary-cell-val   { font-size:12px; font-weight:800; color:#fff; }
  `;
  document.head.appendChild(s);
}

// ─────────────────────────────────────────────────────────────────────────────
// Default profile SVG
// ─────────────────────────────────────────────────────────────────────────────
const PersonSVG = ({ muted = false }) => (
  <svg viewBox="0 0 80 80" fill="none" style={{ width: 72, height: 72 }}>
    <circle cx="40" cy="30" r="18" fill={muted ? "#c8cbd0" : "#d1d5db"} />
    <path d="M10 72c0-16.569 13.431-30 30-30s30 13.431 30 30" fill={muted ? "#c8cbd0" : "#d1d5db"} />
  </svg>
);

// ─────────────────────────────────────────────────────────────────────────────
// MemberPopup — "MEMBER DETAILS" popup matching screenshot exactly
// ─────────────────────────────────────────────────────────────────────────────
const MemberPopup = ({ node, anchorRect, onClose }) => {
  const popupRef = useRef(null);
  const paid = node.paidstatus === "Paid";
  const d    = node.description || {};

  // Position popup: prefer right of avatar, fallback to left if off-screen
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!anchorRect || !popupRef.current) return;
    const pw = 340;
    const ph = popupRef.current.offsetHeight || 380;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let left = anchorRect.right + 12;
    let top  = anchorRect.top;

    // flip left if no room on right
    if (left + pw > vw - 8) left = anchorRect.left - pw - 12;
    // clamp vertically
    if (top + ph > vh - 8) top = vh - ph - 8;
    if (top < 8) top = 8;

    setPos({ top, left });
  }, [anchorRect]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) onClose();
    };
    setTimeout(() => document.addEventListener("mousedown", handler), 0);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const name    = node.username || "—";
  const status  = d.Bot_Status || "—";
  const isActive = status?.toLowerCase() === "active";

  return (
    <div
      ref={popupRef}
      className="bt-popup"
      style={{ top: pos.top, left: pos.left }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* ── Header ── */}
      <div className="bt-popup-header">
        <span className="bt-popup-title">Member Details</span>
        <button className="bt-popup-close" onClick={onClose}>×</button>
      </div>

      {/* ── Rows ── */}
      <div>
        {/* Member Name */}
        <div className="bt-popup-row">
          <span className="bt-popup-row-label">Member Name</span>
          <span className="bt-popup-row-value">{d.userName || "—"}</span>
        </div>

        {/* Sponsor */}
        <div className="bt-popup-row">
          <span className="bt-popup-row-label">Sponsor Name</span>
          <span className="bt-popup-row-value">{d.Sponsor || "NotFound"}</span>
        </div>

        {/* Joining Date */}
        <div className="bt-popup-row">
          <span className="bt-popup-row-label">Joining Date</span>
          <span className="bt-popup-row-value">{d.Reg_Date || "—"}</span>
        </div>

        {/* Status */}
        <div className="bt-popup-row">
          <span className="bt-popup-row-label">Status</span>
          <span className={`bt-status-pill ${isActive ? "active" : "inactive"}`}>
            {isActive ? "Active" : "InActive"}
          </span>
        </div>

        {/* Payment Status */}
        <div className="bt-popup-row">
          <span className="bt-popup-row-label">Payment</span>
          <span className={`bt-status-pill ${paid ? "paid" : "unpaid"}`}>
            {paid ? "Paid" : "UnPaid"}
          </span>
        </div>

        {/* Investment */}
        <div className="bt-popup-row">
          <span className="bt-popup-row-label">Investment</span>
          <span className="bt-invest-val">${d.totalInvestmentAmount ?? "0.00"}</span>
        </div>

        {/* Activation Date */}
        <div className="bt-popup-row">
          <span className="bt-popup-row-label">Activation Date</span>
          <span className="bt-popup-row-value">{d.Bot_Activation_Date || "--"}</span>
        </div>
      </div>

      {/* ── Business Summary ── */}
      <div className="bt-popup-summary-head">Business Summary</div>
      <div className="bt-popup-summary-grid">
        {[
          { l: "Total Left",     v: d.totalleftTeamCount      ?? 0 },
          { l: "Total Right",    v: d.totalRightTeamCount     ?? 0 },
          { l: "Current Left",   v: d.leftTeamCount           ?? 0 },
          { l: "Current Right",  v: d.rightTeamCount          ?? 0 },
          { l: "Remaining Left", v: d.leftRemainingTeamCount  ?? 0 },
          { l: "Remaining Right",v: d.rightRemaining          ?? 0 },
        ].map(({ l, v }) => (
          <div className="bt-popup-summary-cell" key={l}>
            <span className="bt-popup-summary-cell-label">{l}</span>
            <span className="bt-popup-summary-cell-val">{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// BtNode — single real or blank node
// ─────────────────────────────────────────────────────────────────────────────
const BtNode = React.forwardRef<any, { node: any; onExpand: (id: number) => void; imageBaseUrl?: string; isRoot?: boolean; onShowPopup: (node: any, rect: DOMRect) => void; expandedUserNames?: Set<string> }>(function BtNode(
  { node, onExpand, imageBaseUrl = "", isRoot = false, onShowPopup, expandedUserNames = new Set<string>() },
  avatarRef: any
) {
  const isEmpty = !node || !node.id;

  if (isEmpty) {
    return (
      <div className={`bt-node-wrap${isRoot ? " bt-root-node" : ""}`}>
        <div className="bt-avatar empty" ref={avatarRef}>
          <PersonSVG muted />
        </div>
        <div className="bt-label empty-label">BLANK</div>
      </div>
    );
  }

  const paid = node.paidstatus === "Paid";
  const name = (node.username?.replace(/\[.*?\]/, "").trim() || "—").toUpperCase();

  const handleAvatarClick = (e) => {
    e.stopPropagation();
    if (avatarRef?.current) {
      const rect = avatarRef.current.getBoundingClientRect();
      onShowPopup(node, rect);
    }
  };

  return (
    <div className={`bt-node-wrap${isRoot ? " bt-root-node" : ""}`}>
      {/* Avatar — click opens popup */}
      <div
        className={`bt-avatar ${paid ? "paid" : "unpaid"}`}
        ref={avatarRef}
        onClick={handleAvatarClick}
        title="Click to view member details"
      >
        {node.image
          ? <img src={`${imageBaseUrl}${node.image}`} alt={name}
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
          : <PersonSVG />
        }
      </div>

      {/* Name pill */}
      <div className={`bt-label ${paid ? "paid" : "unpaid"}`}>{name}</div>

      {/* Paid/UnPaid badge */}
      {/* <div className={`bt-paid-badge ${paid ? "paid" : "unpaid"}`}>
        {paid ? "Paid" : "UnPaid"}
      </div> */}

      {/* Chevron — only when node has children AND downline not yet opened */}
      {node.hasChildren && !expandedUserNames.has(node.rawUserName) && (
        <button className="bt-chevron"
          title={`View downline of ${name}`}
          onClick={(e) => { e.stopPropagation(); onExpand(node.id); }}>
          <svg viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9" /></svg>
        </button>
      )}
    </div>
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// BtLevel — recursive renderer
// ─────────────────────────────────────────────────────────────────────────────
function BtLevel({ node, allUsers, depth, maxDepth, onExpand, imageBaseUrl, onRegisterRef, isRoot, onShowPopup, expandedUserNames = new Set<string>() }) {
  if (!node) return null;

  const avatarRef     = useRef(null);
  const leftBlankRef  = useRef(null);
  const rightBlankRef = useRef(null);

  const left  = node.left_child_id  ? (allUsers.find((u) => u.id === node.left_child_id)  || null) : null;
  const right = node.right_child_id ? (allUsers.find((u) => u.id === node.right_child_id) || null) : null;

  const renderKids = depth < maxDepth;

  useEffect(() => {
    if (onRegisterRef && node?.id) onRegisterRef(node.id, avatarRef);
  }, [node?.id, onRegisterRef]);

  useEffect(() => {
    if (!onRegisterRef || !renderKids) return;
    if (!left)  onRegisterRef(`blank-left-${node.id}`,  leftBlankRef);
    if (!right) onRegisterRef(`blank-right-${node.id}`, rightBlankRef);
  }, [left, right, renderKids, node?.id, onRegisterRef]);

  return (
    <div className="bt-col">
      <BtNode
        ref={avatarRef}
        node={node}
        onExpand={onExpand}
        imageBaseUrl={imageBaseUrl}
        isRoot={isRoot}
        onShowPopup={onShowPopup}
        expandedUserNames={expandedUserNames}
      />
      {renderKids && (
        <div style={{ display: "flex", width: "100%" }}>
          <div className="bt-col">
            {left
              ? <BtLevel node={left} allUsers={allUsers} depth={depth + 1} maxDepth={maxDepth}
                  onExpand={onExpand} imageBaseUrl={imageBaseUrl} onRegisterRef={onRegisterRef}
                  isRoot={false} onShowPopup={onShowPopup} expandedUserNames={expandedUserNames} />
              : <BtNode ref={leftBlankRef} node={null}
                  onExpand={onExpand} imageBaseUrl={imageBaseUrl} onShowPopup={onShowPopup}
                  expandedUserNames={expandedUserNames} />
            }
          </div>
          <div className="bt-col">
            {right
              ? <BtLevel node={right} allUsers={allUsers} depth={depth + 1} maxDepth={maxDepth}
                  onExpand={onExpand} imageBaseUrl={imageBaseUrl} onRegisterRef={onRegisterRef}
                  isRoot={false} onShowPopup={onShowPopup} expandedUserNames={expandedUserNames} />
              : <BtNode ref={rightBlankRef} node={null}
                  onExpand={onExpand} imageBaseUrl={imageBaseUrl} onShowPopup={onShowPopup}
                  expandedUserNames={expandedUserNames} />
            }
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SVG line builder
// ─────────────────────────────────────────────────────────────────────────────
function buildLines(node, allUsers, depth, maxDepth, refMap, containerRect, zoom = 1) {
  if (!node || depth >= maxDepth) return [];
  const lines = [];

  const parentRef = refMap.current[node.id];
  if (!parentRef?.current) return lines;

  const pRect = parentRef.current.getBoundingClientRect();
  const pCx   = (pRect.left + pRect.width / 2 - containerRect.left) / zoom;
  const pBot  = (pRect.bottom - containerRect.top) / zoom;

  const left  = node.left_child_id  ? allUsers.find((u) => u.id === node.left_child_id)  : null;
  const right = node.right_child_id ? allUsers.find((u) => u.id === node.right_child_id) : null;

  const getPos = (childNode, blankKey) => {
    const ref = childNode ? refMap.current[childNode.id] : refMap.current[blankKey];
    if (!ref?.current) return null;
    const r = ref.current.getBoundingClientRect();
    return {
      cx:  (r.left + r.width / 2 - containerRect.left) / zoom,
      top: (r.top  - containerRect.top) / zoom,
    };
  };

  const lPos = getPos(left,  `blank-left-${node.id}`);
  const rPos = getPos(right, `blank-right-${node.id}`);

  const midY = lPos && rPos
    ? Math.min(lPos.top, rPos.top) - 4
    : (lPos || rPos) ? (lPos || rPos).top - 4 : null;

  if (midY === null) return lines;

  lines.push(`M ${pCx} ${pBot} L ${pCx} ${midY}`);
  if (lPos && rPos) {
    lines.push(`M ${lPos.cx} ${midY} L ${rPos.cx} ${midY}`);
    lines.push(`M ${lPos.cx} ${midY} L ${lPos.cx} ${lPos.top}`);
    lines.push(`M ${rPos.cx} ${midY} L ${rPos.cx} ${rPos.top}`);
  } else if (lPos) {
    lines.push(`M ${pCx} ${midY} L ${lPos.cx} ${midY}`);
    lines.push(`M ${lPos.cx} ${midY} L ${lPos.cx} ${lPos.top}`);
  } else if (rPos) {
    lines.push(`M ${pCx} ${midY} L ${rPos.cx} ${midY}`);
    lines.push(`M ${rPos.cx} ${midY} L ${rPos.cx} ${rPos.top}`);
  }

  if (left)  lines.push(...buildLines(left,  allUsers, depth + 1, maxDepth, refMap, containerRect, zoom));
  if (right) lines.push(...buildLines(right, allUsers, depth + 1, maxDepth, refMap, containerRect, zoom));
  return lines;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main BinaryTree component
// ─────────────────────────────────────────────────────────────────────────────
const BinaryTree = ({
  allUsers = [], rootUser, onLeafClick,
  imageBaseUrl = "", maxDepth = 3, disableNavigation = false,
  centeredUserId = null as number | null, expandedUserNames = new Set<string>(),
}: {
  allUsers?: object[]; rootUser: object; onLeafClick: (id: number) => void;
  imageBaseUrl?: string; maxDepth?: number; disableNavigation?: boolean;
  centeredUserId?: number | null; expandedUserNames?: Set<string>;
}) => {
  void centeredUserId; // acknowledged — used by parent for scroll logic
  const [selectedRoot, setSelectedRoot] = useState(rootUser);
  const [svgPaths, setSvgPaths]         = useState([]);
  const [svgSize, setSvgSize]           = useState({ w: 0, h: 0 });
  const [zoom, setZoom]                 = useState(1);
  const [pan, setPan]                   = useState({ x: 40, y: 40 });

  // Popup state
  const [popup, setPopup] = useState<{ node: any; rect: DOMRect } | null>(null);

  const viewportRef  = useRef(null);
  const containerRef = useRef(null);
  const refMap       = useRef({});
  const isDragging   = useRef(false);
  const dragStart    = useRef({ x: 0, y: 0, panX: 0, panY: 0 });

  const registerRef = useCallback((id, ref) => { refMap.current[id] = ref; }, []);

  useEffect(() => { injectStyles(); }, []);
  useEffect(() => { setSelectedRoot(rootUser); }, [rootUser]);

  // Close popup when dragging starts
  const handleShowPopup = useCallback((node, rect) => {
    setPopup((prev) => prev?.node?.id === node.id ? null : { node, rect });
  }, []);

  const handleClosePopup = useCallback(() => setPopup(null), []);

  const redrawLines = useCallback(() => {
    if (!containerRef.current || !selectedRoot) return;
    requestAnimationFrame(() => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      setSvgSize({ w: rect.width / zoom, h: rect.height / zoom });
      setSvgPaths(buildLines(selectedRoot, allUsers, 1, maxDepth, refMap, rect, zoom));
    });
  }, [selectedRoot, allUsers, maxDepth, zoom]);

  useLayoutEffect(() => { redrawLines(); }, [redrawLines]);

  useEffect(() => {
    const ro = new ResizeObserver(redrawLines);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [redrawLines]);

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    setPopup(null);
    const vp = viewportRef.current;
    if (!vp) return;
    const { left, top } = vp.getBoundingClientRect();
    const mx = e.clientX - left;
    const my = e.clientY - top;
    const factor = e.deltaY < 0 ? 1.1 : 0.9;
    setZoom((prev) => {
      const next = Math.min(2.5, Math.max(0.15, prev * factor));
      setPan((p) => ({ x: mx - (mx - p.x) * (next / prev), y: my - (my - p.y) * (next / prev) }));
      return next;
    });
  }, []);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

  const onMouseDown = useCallback((e) => {
    if (e.button !== 0) return;
    isDragging.current = true;
    dragStart.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
  }, [pan]);

  const onMouseMove = useCallback((e) => {
    if (!isDragging.current) return;
    setPan({ x: dragStart.current.panX + (e.clientX - dragStart.current.x), y: dragStart.current.panY + (e.clientY - dragStart.current.y) });
  }, []);

  const onMouseUp = useCallback(() => { isDragging.current = false; }, []);

  if (!selectedRoot) return null;

  return (
    <div className="bt-root">
      <div ref={viewportRef} className="bt-viewport"
        onMouseDown={onMouseDown} onMouseMove={onMouseMove}
        onMouseUp={onMouseUp} onMouseLeave={onMouseUp}>
        <div ref={containerRef} className="bt-canvas"
          style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}>
          <svg width={svgSize.w} height={svgSize.h}
            style={{ position:"absolute", top:0, left:0, pointerEvents:"none", zIndex:1, overflow:"visible" }}>
            {svgPaths.map((d, i) => (
              <path key={i} d={d} stroke="#c7c7c7" strokeWidth="2" fill="none" />
            ))}
          </svg>
          <div className="bt-inner">
            <div className="bt-level-row">
              <BtLevel
                node={selectedRoot} allUsers={allUsers}
                depth={1} maxDepth={maxDepth}
                onExpand={onLeafClick} imageBaseUrl={imageBaseUrl}
                onRegisterRef={registerRef} isRoot={true}
                onShowPopup={handleShowPopup}
                expandedUserNames={expandedUserNames}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── MEMBER DETAILS POPUP (fixed, outside canvas) ── */}
      {popup && (
        <MemberPopup
          node={popup.node}
          anchorRect={popup.rect}
          onClose={handleClosePopup}
        />
      )}
    </div>
  );
};

export default BinaryTree;