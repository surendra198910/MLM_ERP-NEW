/**
 * BinaryTree.jsx
 * Recursive binary-tree renderer with pixel-perfect SVG connector lines.
 * Blank (empty) slots show a default profile silhouette avatar.
 *
 * Props:
 *   allUsers       – flat array of TreeNode objects
 *   rootUser       – root node
 *   centeredUserId – scroll/re-view target after expand
 *   onLeafClick    – (id) => void
 *   imageBaseUrl   – prefix for node.image URLs
 *   maxDepth       – levels to render (default 3)
 *   disableNavigation – hide Back/Up buttons
 */

import React, { useState, useEffect, useRef, useLayoutEffect, useCallback } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const STYLE_ID = "bt-styles-v6";
function injectStyles() {
  if (typeof document === "undefined" || document.getElementById(STYLE_ID)) return;
  const s = document.createElement("style");
  s.id = STYLE_ID;
  s.textContent = `
  .bt-root {
    width: 100%;
    overflow-x: auto;
    overflow-y: visible;
    background: #fff;
    padding: 40px 24px 56px;
    box-sizing: border-box;
    font-family: 'Segoe UI', Arial, sans-serif;
  }

  .bt-tree-area {
    position: relative;
    display: inline-block;
    min-width: 100%;
  }

  .bt-svg-overlay {
    position: absolute;
    top: 0; left: 0;
    width: 100%; height: 100%;
    pointer-events: none;
    overflow: visible;
  }

  .bt-level-row {
    display: flex;
    justify-content: center;
  }

  .bt-col {
    display: flex;
    flex-direction: column;
    align-items: center;
    flex: 1;
    min-width: 120px;
  }

  /* ── avatar ── */
  .bt-avatar {
    width: 90px; height: 90px;
    border-radius: 50%;
    border: 3px solid #d1d5db;
    background: #f3f4f6;
    display: flex; align-items: center; justify-content: center;
    overflow: hidden;
    flex-shrink: 0;
    cursor: pointer;
    transition: transform .15s, box-shadow .15s;
    position: relative;
    z-index: 2;
  }
  .bt-avatar:hover { transform: scale(1.05); }
  .bt-avatar img { width:100%; height:100%; object-fit:cover; border-radius:50%; }
  .bt-avatar.paid   { border-color:#22c55e; box-shadow:0 0 0 3px rgba(34,197,94,.20); }
  .bt-avatar.unpaid { border-color:#ef4444; box-shadow:0 0 0 3px rgba(239,68,68,.20); }

  /* blank slot — dashed grey border, slightly muted background */
  .bt-avatar.empty {
    border: 3px dashed #d1d5db;
    background: #f0f1f3;
    cursor: default;
  }
  .bt-avatar.empty:hover { transform: none; }

  /* ── name pill ── */
  .bt-label {
    margin-top: 8px;
    background: #6366f1; color: #fff;
    font-size: 10px; font-weight: 700;
    letter-spacing: .9px; padding: 4px 14px;
    border-radius: 4px; text-align: center;
    max-width: 110px; overflow: hidden;
    text-overflow: ellipsis; white-space: nowrap;
    text-transform: uppercase; user-select: none;
    position: relative; z-index: 2;
  }
  .bt-label.empty-label { background: #9ca3af; }

  /* ── chevron ── */
  .bt-chevron {
    margin-top: 10px;
    width: 30px; height: 30px; border-radius: 50%;
    border: 2px solid #6366f1; background: #fff;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; color: #6366f1;
    transition: background .18s, transform .15s, box-shadow .18s;
    box-shadow: 0 2px 8px rgba(99,102,241,.2);
    flex-shrink: 0; position: relative; z-index: 2;
  }
  .bt-chevron svg {
    width:15px; height:15px; stroke:currentColor;
    fill:none; stroke-width:2.5;
    stroke-linecap:round; stroke-linejoin:round;
  }
  .bt-chevron:hover {
    background:#6366f1; color:#fff;
    box-shadow: 0 4px 16px rgba(99,102,241,.4);
    transform: translateY(-1px) scale(1.1);
  }
  @keyframes btPulse {
    0%,100% { box-shadow:0 2px 8px rgba(99,102,241,.2); }
    50%      { box-shadow:0 2px 16px rgba(99,102,241,.5); }
  }
  .bt-chevron { animation: btPulse 2s ease-in-out infinite; }
  .bt-chevron:hover { animation: none; }

  /* ── node wrapper ── */
  .bt-node-wrap {
    display: flex; flex-direction: column; align-items: center;
    position: relative;
    padding-top: 36px;
  }
  .bt-node-wrap.bt-root-node { padding-top: 0; }

  /* ── tooltip ── */
  .bt-tooltip {
    display: none;
    position: absolute;
    top: 36px; left: calc(100% + 14px);
    z-index: 999; width: 260px;
    background: #fff; border: 1px solid #e5e7eb;
    border-radius: 14px;
    box-shadow: 0 12px 40px rgba(0,0,0,.14);
    padding: 12px 14px; font-size: 12px;
    pointer-events: none;
  }
  .bt-tooltip::before {
    content: "";
    position: absolute; top: 20px; left: -7px;
    width: 12px; height: 12px; background: #fff;
    border-left: 1px solid #e5e7eb; border-bottom: 1px solid #e5e7eb;
    transform: rotate(45deg);
  }
  .bt-node-wrap:hover .bt-tooltip { display: block; }
  .bt-tt-head {
    background: linear-gradient(135deg,#6366f1,#818cf8);
    color:#fff; padding:7px 10px; border-radius:8px;
    font-weight:700; font-size:12px; margin-bottom:8px; letter-spacing:.3px;
  }
  .bt-tt-row {
    display:flex; justify-content:space-between; align-items:center;
    padding:3px 2px; border-bottom:1px solid #f3f4f6; gap:8px;
  }
  .bt-tt-row:last-child { border-bottom:none; }
  .bt-tt-lbl { color:#6b7280; font-size:11px; flex-shrink:0; }
  .bt-tt-val { font-weight:600; color:#111827; font-size:11px; text-align:right; }
  .bt-tt-val.green { color:#16a34a; }
  .bt-tt-val.red   { color:#dc2626; }
  .bt-tt-sub {
    font-weight:700; margin:8px 0 5px; font-size:10px;
    color:#6366f1; text-transform:uppercase; letter-spacing:.8px;
  }
  .bt-tt-grid { display:grid; grid-template-columns:1fr 1fr; gap:4px; }
  .bt-tt-box {
    background:#f9fafb; border:1px solid #f3f4f6;
    padding:4px 6px; border-radius:6px;
    display:flex; justify-content:space-between; align-items:center; font-size:10px;
  }
  .bt-tt-box span { color:#9ca3af; }
  .bt-tt-box b    { color:#1f2937; font-size:12px; }

  /* ── nav ── */
  .bt-nav {
    display:flex; flex-wrap:wrap; gap:8px;
    justify-content:center; padding:14px 16px 6px;
    border-top:1px solid #e5e7eb; margin-top:8px;
    background:#f9fafb; border-radius:0 0 12px 12px;
  }
  .bt-nav-btn {
    display:inline-flex; align-items:center; gap:5px;
    background:linear-gradient(135deg,#6366f1,#818cf8);
    border:none; border-radius:6px; color:#fff; cursor:pointer;
    font-size:9px; font-weight:700; letter-spacing:.8px;
    height:28px; padding:0 12px;
    text-transform:uppercase; white-space:nowrap;
    transition:opacity .2s,transform .15s;
  }
  .bt-nav-btn:hover:not(:disabled) { opacity:.9; transform:translateY(-1px); }
  .bt-nav-btn:disabled { opacity:.4; cursor:not-allowed; }
  `;
  document.head.appendChild(s);
}

// ─────────────────────────────────────────────────────────────────────────────
// Default profile SVG — shown for real nodes without a photo
// ─────────────────────────────────────────────────────────────────────────────
const PersonSVG = ({ muted = false }) => (
  <svg viewBox="0 0 80 80" fill="none" style={{ width: 72, height: 72 }}>
    <circle cx="40" cy="30" r="18" fill={muted ? "#c8cbd0" : "#d1d5db"} />
    <path
      d="M10 72c0-16.569 13.431-30 30-30s30 13.431 30 30"
      fill={muted ? "#c8cbd0" : "#d1d5db"}
    />
  </svg>
);

// ─────────────────────────────────────────────────────────────────────────────
// BtNode — single real or blank node
// ─────────────────────────────────────────────────────────────────────────────
const BtNode = React.forwardRef(function BtNode(
  { node, isLeaf, onExpand, imageBaseUrl = "", isRoot = false },
  avatarRef
) {
  const isEmpty = !node || !node.id;

  // ── BLANK slot ──
  if (isEmpty) {
    return (
      <div className={`bt-node-wrap${isRoot ? " bt-root-node" : ""}`}>
        <div className="bt-avatar empty" ref={avatarRef}>
          {/* Default profile silhouette — muted colours */}
          <PersonSVG muted />
        </div>
        <div className="bt-label empty-label">BLANK</div>
      </div>
    );
  }

  // ── Real node ──
  const paid = node.paidstatus === "Paid";
  const d    = node.description || {};
  const name = (node.username?.replace(/\[.*?\]/, "").trim() || node.username || "—").toUpperCase();

  return (
    <div className={`bt-node-wrap${isRoot ? " bt-root-node" : ""}`}>
      <div className={`bt-avatar ${paid ? "paid" : "unpaid"}`} ref={avatarRef}>
        {node.image
          ? <img src={`${imageBaseUrl}${node.image}`} alt={name}
              onError={e => { e.target.style.display = "none"; }} />
          : <PersonSVG />
        }
      </div>

      <div className="bt-label">{name}</div>

      {/* Tooltip */}
      <div className="bt-tooltip">
        <div className="bt-tt-head">{node.username}</div>
        {[
          { l: "Sponsor",    v: d.Sponsor             || "—", c: "" },
          { l: "Joined",     v: d.Reg_Date            || "—", c: "" },
          { l: "Status",     v: d.Bot_Status          || "—", c: d.Bot_Status === "Active" ? "green" : "red" },
          { l: "Activation", v: d.Bot_Activation_Date || "—", c: "" },
          { l: "Investment", v: `$${d.totalInvestmentAmount ?? 0}`, c: "green" },
        ].map(({ l, v, c }) => (
          <div className="bt-tt-row" key={l}>
            <span className="bt-tt-lbl">{l}</span>
            <span className={`bt-tt-val ${c}`}>{v}</span>
          </div>
        ))}
        <div className="bt-tt-sub">Business</div>
        <div className="bt-tt-grid">
          {[
            ["Tot L", d.totalleftTeamCount  ?? 0],
            ["Tot R", d.totalRightTeamCount ?? 0],
            ["Cur L", d.leftTeamCount       ?? 0],
            ["Cur R", d.rightTeamCount      ?? 0],
          ].map(([l, v]) => (
            <div className="bt-tt-box" key={l}><span>{l}</span><b>{v}</b></div>
          ))}
        </div>
      </div>

      {isLeaf && (
        <button className="bt-chevron"
          title={`Expand downline of ${name}`}
          onClick={e => { e.stopPropagation(); onExpand(node.id); }}>
          <svg viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9" /></svg>
        </button>
      )}
    </div>
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// BtLevel — recursive renderer; registers avatar refs for SVG lines
// ─────────────────────────────────────────────────────────────────────────────
function BtLevel({ node, allUsers, depth, maxDepth, onExpand, imageBaseUrl, onRegisterRef, isRoot }) {
  if (!node) return null;

  const avatarRef = useRef(null);

  const left  = node.left_child_id  ? (allUsers.find(u => u.id === node.left_child_id)  || null) : null;
  const right = node.right_child_id ? (allUsers.find(u => u.id === node.right_child_id) || null) : null;

  const hasAnyChild = !!(left || right);
  const isLeaf      = depth >= maxDepth || !hasAnyChild;
  const renderKids  = depth < maxDepth;

  const leftBlankRef  = useRef(null);
  const rightBlankRef = useRef(null);

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
        isLeaf={isLeaf}
        onExpand={onExpand}
        imageBaseUrl={imageBaseUrl}
        isRoot={isRoot}
      />

      {renderKids && (
        <div style={{ display: "flex", width: "100%" }}>
          {/* Left child */}
          <div className="bt-col">
            {left
              ? <BtLevel
                  node={left} allUsers={allUsers} depth={depth + 1}
                  maxDepth={maxDepth} onExpand={onExpand} imageBaseUrl={imageBaseUrl}
                  onRegisterRef={onRegisterRef} isRoot={false}
                />
              : <BtNode ref={leftBlankRef} node={null} isLeaf={false}
                  onExpand={onExpand} imageBaseUrl={imageBaseUrl} />
            }
          </div>
          {/* Right child */}
          <div className="bt-col">
            {right
              ? <BtLevel
                  node={right} allUsers={allUsers} depth={depth + 1}
                  maxDepth={maxDepth} onExpand={onExpand} imageBaseUrl={imageBaseUrl}
                  onRegisterRef={onRegisterRef} isRoot={false}
                />
              : <BtNode ref={rightBlankRef} node={null} isLeaf={false}
                  onExpand={onExpand} imageBaseUrl={imageBaseUrl} />
            }
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Build SVG path strings by measuring real DOM positions
// ─────────────────────────────────────────────────────────────────────────────
function buildLines(node, allUsers, depth, maxDepth, refMap, containerRect) {
  if (!node || depth >= maxDepth) return [];
  const lines = [];

  const parentRef = refMap.current[node.id];
  if (!parentRef?.current) return lines;

  const pRect = parentRef.current.getBoundingClientRect();
  const pCx   = pRect.left + pRect.width  / 2 - containerRect.left;
  const pBot  = pRect.bottom - containerRect.top;

  const left  = node.left_child_id  ? allUsers.find(u => u.id === node.left_child_id)  : null;
  const right = node.right_child_id ? allUsers.find(u => u.id === node.right_child_id) : null;

  const getPos = (childNode, blankKey) => {
    const ref = childNode ? refMap.current[childNode.id] : refMap.current[blankKey];
    if (!ref?.current) return null;
    const r = ref.current.getBoundingClientRect();
    return { cx: r.left + r.width / 2 - containerRect.left, top: r.top - containerRect.top };
  };

  const lPos = getPos(left,  `blank-left-${node.id}`);
  const rPos = getPos(right, `blank-right-${node.id}`);

  const midY = lPos && rPos
    ? Math.min(lPos.top, rPos.top) - 4
    : (lPos || rPos)
      ? (lPos || rPos).top - 4
      : null;

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

  if (left)  lines.push(...buildLines(left,  allUsers, depth + 1, maxDepth, refMap, containerRect));
  if (right) lines.push(...buildLines(right, allUsers, depth + 1, maxDepth, refMap, containerRect));

  return lines;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────
const BinaryTree = ({
  allUsers          = [],
  rootUser,
  onLeafClick,
  imageBaseUrl      = "",
  maxDepth          = 3,
  disableNavigation = false,
}) => {
  const [selectedRoot, setSelectedRoot] = useState(rootUser);
  const [svgPaths, setSvgPaths]         = useState([]);
  const [svgSize, setSvgSize]           = useState({ w: 0, h: 0 });

  const containerRef = useRef(null);
  const refMap       = useRef({});

  const registerRef = useCallback((id, ref) => {
    refMap.current[id] = ref;
  }, []);

  useEffect(() => { injectStyles(); }, []);
  useEffect(() => { setSelectedRoot(rootUser); }, [rootUser]);


  const redrawLines = useCallback(() => {
    if (!containerRef.current || !selectedRoot) return;
    requestAnimationFrame(() => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      setSvgSize({ w: rect.width, h: rect.height });
      setSvgPaths(buildLines(selectedRoot, allUsers, 1, maxDepth, refMap, rect));
    });
  }, [selectedRoot, allUsers, maxDepth]);

  useLayoutEffect(() => { redrawLines(); }, [redrawLines]);

  useEffect(() => {
    const ro = new ResizeObserver(redrawLines);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [redrawLines]);

  if (!selectedRoot) return null;

  const goToTop = () => setSelectedRoot(rootUser);
  const goUp    = () => {
    const parent = allUsers.find(
      u => u.left_child_id === selectedRoot.id || u.right_child_id === selectedRoot.id
    );
    if (parent) setSelectedRoot(parent);
  };

  return (
    <div className="bt-root">
      <div className="bt-tree-area" ref={containerRef}>
        <svg
          className="bt-svg-overlay"
          width={svgSize.w}
          height={svgSize.h}
          style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none", zIndex: 1 }}
        >
          {svgPaths.map((d, i) => (
            <path key={i} d={d} stroke="#c7c7c7" strokeWidth="2" fill="none" />
          ))}
        </svg>

        <div className="bt-level-row">
          <BtLevel
            node={selectedRoot}
            allUsers={allUsers}
            depth={1}
            maxDepth={maxDepth}
            onExpand={onLeafClick}
            imageBaseUrl={imageBaseUrl}
            onRegisterRef={registerRef}
            isRoot={true}
          />
        </div>
      </div>

      {!disableNavigation && (
        <div className="bt-nav">
          <button className="bt-nav-btn" onClick={goToTop}
            disabled={selectedRoot?.id === rootUser?.id}>
            ↑ Back to Top
          </button>
          <button className="bt-nav-btn" onClick={goUp}
            disabled={selectedRoot?.id === rootUser?.id}>
            ↑ Go Up
          </button>
        </div>
      )}
    </div>
  );
};

export default BinaryTree;