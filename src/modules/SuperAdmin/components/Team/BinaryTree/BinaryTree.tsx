/**
 * BinaryTree.jsx
 * Self-contained recursive binary-tree renderer.
 * UI matches the reference image exactly:
 *   - Large avatar circles (90px) — green border (Paid) / red border (UnPaid)
 *   - "+" grey dashed circle for empty slots
 *   - Purple pill name labels
 *   - Light grey connector lines
 *   - ∨ chevron below every bottom-level real node → triggers onLeafClick
 *   - Hover tooltip with full member details
 *
 * Props:
 *   allUsers       – flat array of all loaded TreeNode objects
 *   rootUser       – the root node to display at the top
 *   centeredUserId – after expand, parent sets this to re-view that node
 *   onLeafClick    – (id) => void  called when ∨ is clicked
 *   maxDepth       – how many levels deep to render (default 3)
 */

import React, { useState, useEffect, useRef } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// Style injection
// ─────────────────────────────────────────────────────────────────────────────
const STYLE_ID = "bt-styles-v3";
function injectStyles() {
  if (typeof document === "undefined" || document.getElementById(STYLE_ID)) return;
  const s = document.createElement("style");
  s.id = STYLE_ID;
  s.textContent = `
  /* ── layout ─────────────────────────────────────────────────────────── */
  .bt-root {
    width: 100%;
    overflow-x: auto;
    overflow-y: visible;
    background: #fff;
    padding: 40px 24px 56px;
    box-sizing: border-box;
    font-family: 'Segoe UI', Arial, sans-serif;
  }

  /* each "generation" is a flex row */
  .bt-level {
    display: flex;
    justify-content: center;
    align-items: flex-start;
  }

  /* one column per node — flex:1 so siblings share width equally */
  .bt-col {
    display: flex;
    flex-direction: column;
    align-items: center;
    flex: 1;
    min-width: 100px;
    position: relative;
  }

  /* ── connector lines ─────────────────────────────────────────────────── */
  /* vertical drop from node down to the horizontal bar */
  .bt-v-down {
    width: 2px;
    height: 36px;
    background: #c7c7c7;
  }
  /* vertical rise from horizontal bar up to child */
  .bt-v-up {
    width: 2px;
    height: 36px;
    background: #c7c7c7;
    margin: 0 auto;
  }
  /* children wrapper — horizontal bar is drawn via CSS on this element */
  .bt-children {
    display: flex;
    width: 100%;
    position: relative;
  }
  /* the horizontal bar: spans from centre of left child to centre of right child */
  .bt-children::before {
    content: "";
    position: absolute;
    top: 0;
    left: 25%;     /* starts at centre of left half */
    right: 25%;    /* ends at centre of right half  */
    height: 2px;
    background: #c7c7c7;
  }
  /* single child — no horizontal bar needed */
  .bt-children.bt-single::before { display: none; }

  /* ── avatar ──────────────────────────────────────────────────────────── */
  .bt-avatar {
    width: 90px;
    height: 90px;
    border-radius: 50%;
    border: 3px solid #d1d5db;
    background: #f3f4f6;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    flex-shrink: 0;
    position: relative;
    cursor: pointer;
    transition: transform 0.15s, box-shadow 0.15s;
  }
  .bt-avatar:hover { transform: scale(1.05); }

  .bt-avatar img {
    width: 100%; height: 100%;
    object-fit: cover; border-radius: 50%;
  }

  /* green ring — Active / Paid */
  .bt-avatar.paid {
    border-color: #22c55e;
    box-shadow: 0 0 0 3px rgba(34,197,94,.20);
  }
  /* red ring — InActive / UnPaid */
  .bt-avatar.unpaid {
    border-color: #ef4444;
    box-shadow: 0 0 0 3px rgba(239,68,68,.20);
  }
  /* "+" empty slot */
  .bt-avatar.empty {
    border: 3px dashed #d1d5db;
    background: #fafafa;
    font-size: 36px;
    font-weight: 200;
    color: #9ca3af;
    cursor: default;
  }
  .bt-avatar.empty:hover { transform: none; }

  /* ── name pill ───────────────────────────────────────────────────────── */
  .bt-label {
    margin-top: 8px;
    background: #6366f1;
    color: #fff;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.9px;
    padding: 4px 14px;
    border-radius: 4px;
    text-align: center;
    max-width: 100px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    text-transform: uppercase;
    user-select: none;
  }
  .bt-label.empty-label { background: #9ca3af; }

  /* ── expand chevron ──────────────────────────────────────────────────── */
  .bt-chevron {
    margin-top: 10px;
    width: 30px; height: 30px;
    border-radius: 50%;
    border: 2px solid #6366f1;
    background: #fff;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
    color: #6366f1;
    transition: background .18s, transform .15s, box-shadow .18s;
    box-shadow: 0 2px 8px rgba(99,102,241,.2);
    flex-shrink: 0;
  }
  .bt-chevron svg {
    width: 15px; height: 15px;
    stroke: currentColor; fill: none;
    stroke-width: 2.5; stroke-linecap: round; stroke-linejoin: round;
  }
  .bt-chevron:hover {
    background: #6366f1; color: #fff;
    box-shadow: 0 4px 16px rgba(99,102,241,.4);
    transform: translateY(-1px) scale(1.1);
  }
  @keyframes btPulse {
    0%,100% { box-shadow: 0 2px 8px rgba(99,102,241,.2); }
    50%      { box-shadow: 0 2px 16px rgba(99,102,241,.5); }
  }
  .bt-chevron { animation: btPulse 2s ease-in-out infinite; }
  .bt-chevron:hover { animation: none; }

  /* ── tooltip ─────────────────────────────────────────────────────────── */
  .bt-node-wrap {
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
  }
  .bt-tooltip {
    display: none;
    position: absolute;
    top: 0;
    left: calc(100% + 14px);
    z-index: 999;
    width: 260px;
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 14px;
    box-shadow: 0 12px 40px rgba(0,0,0,.14);
    padding: 12px 14px;
    font-size: 12px;
    pointer-events: none;
  }
  /* arrow */
  .bt-tooltip::before {
    content: "";
    position: absolute;
    top: 20px; left: -7px;
    width: 12px; height: 12px;
    background: #fff;
    border-left: 1px solid #e5e7eb;
    border-bottom: 1px solid #e5e7eb;
    transform: rotate(45deg);
  }
  .bt-node-wrap:hover .bt-tooltip { display: block; }

  .bt-tt-head {
    background: linear-gradient(135deg, #6366f1, #818cf8);
    color: #fff;
    padding: 7px 10px;
    border-radius: 8px;
    font-weight: 700;
    font-size: 12px;
    margin-bottom: 8px;
    letter-spacing: .3px;
  }
  .bt-tt-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 3px 2px;
    border-bottom: 1px solid #f3f4f6;
    gap: 8px;
  }
  .bt-tt-row:last-child { border-bottom: none; }
  .bt-tt-lbl { color: #6b7280; font-size: 11px; flex-shrink: 0; }
  .bt-tt-val { font-weight: 600; color: #111827; font-size: 11px; text-align: right; }
  .bt-tt-val.green { color: #16a34a; }
  .bt-tt-val.red   { color: #dc2626; }
  .bt-tt-sub {
    font-weight: 700; margin: 8px 0 5px;
    font-size: 10px; color: #6366f1;
    text-transform: uppercase; letter-spacing: .8px;
  }
  .bt-tt-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; }
  .bt-tt-box {
    background: #f9fafb; border: 1px solid #f3f4f6;
    padding: 4px 6px; border-radius: 6px;
    display: flex; justify-content: space-between; align-items: center;
    font-size: 10px;
  }
  .bt-tt-box span { color: #9ca3af; }
  .bt-tt-box b    { color: #1f2937; font-size: 12px; }

  /* ── navigation buttons ──────────────────────────────────────────────── */
  .bt-nav {
    display: flex; flex-wrap: wrap; gap: 8px;
    justify-content: center; padding: 14px 16px 6px;
    border-top: 1px solid #e5e7eb; margin-top: 8px;
    background: #f9fafb; border-radius: 0 0 12px 12px;
  }
  .bt-nav-btn {
    display: inline-flex; align-items: center; gap: 5px;
    background: linear-gradient(135deg, #6366f1, #818cf8);
    border: none; border-radius: 6px;
    color: #fff; cursor: pointer;
    font-size: 9px; font-weight: 700; letter-spacing: .8px;
    height: 28px; padding: 0 12px;
    text-transform: uppercase; white-space: nowrap;
    transition: opacity .2s, transform .15s;
  }
  .bt-nav-btn:hover:not(:disabled) { opacity: .9; transform: translateY(-1px); }
  .bt-nav-btn:disabled { opacity: .4; cursor: not-allowed; }
  `;
  document.head.appendChild(s);
}

// ─────────────────────────────────────────────────────────────────────────────
// Person SVG fallback (when no image URL)
// ─────────────────────────────────────────────────────────────────────────────
const PersonSVG = () => (
  <svg viewBox="0 0 80 80" fill="none" style={{ width: 72, height: 72 }}>
    <circle cx="40" cy="30" r="18" fill="#d1d5db" />
    <path d="M10 72c0-16.569 13.431-30 30-30s30 13.431 30 30" fill="#d1d5db" />
  </svg>
);

// ─────────────────────────────────────────────────────────────────────────────
// Single node visual
// ─────────────────────────────────────────────────────────────────────────────
function BtNode({ node, isLeaf, onExpand, imageBaseUrl = "" }) {
  const isEmpty = !node || !node.id;

  if (isEmpty) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div className="bt-avatar empty">+</div>
        <div className="bt-label empty-label">BLANK</div>
      </div>
    );
  }

  const paid = node.paidstatus === "Paid";
  const d    = node.description || {};
  const name = node.username?.replace(/\[.*?\]/, "").trim().toUpperCase()
            || node.username?.toUpperCase()
            || "—";

  return (
    <div className="bt-node-wrap">
      {/* Avatar */}
      <div className={`bt-avatar ${paid ? "paid" : "unpaid"}`}>
        {node.image
          ? <img src={`${imageBaseUrl}${node.image}`} alt={name}
              onError={(e) => { e.target.style.display = "none"; }} />
          : <PersonSVG />
        }
      </div>

      {/* Name pill */}
      <div className="bt-label">{name}</div>

      {/* Tooltip */}
      <div className="bt-tooltip">
        <div className="bt-tt-head">{node.username}</div>
        {[
          { l: "Sponsor",    v: d.Sponsor          || "—",  c: "" },
          { l: "Joined",     v: d.Reg_Date         || "—",  c: "" },
          { l: "Status",     v: d.Bot_Status       || "—",  c: d.Bot_Status === "Active" ? "green" : "red" },
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
            ["Tot L", d.totalleftTeamCount    ?? 0],
            ["Tot R", d.totalRightTeamCount   ?? 0],
            ["Cur L", d.leftTeamCount         ?? 0],
            ["Cur R", d.rightTeamCount        ?? 0],
          ].map(([l, v]) => (
            <div className="bt-tt-box" key={l}>
              <span>{l}</span><b>{v}</b>
            </div>
          ))}
        </div>
      </div>

      {/* Expand chevron — only on real leaf nodes */}
      {isLeaf && (
        <button
          className="bt-chevron"
          title={`Expand downline of ${name}`}
          onClick={(e) => { e.stopPropagation(); onExpand(node.id); }}
        >
          <svg viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9" /></svg>
        </button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Recursive level renderer
// ─────────────────────────────────────────────────────────────────────────────
function BtLevel({ node, allUsers, depth, maxDepth, onExpand, imageBaseUrl }) {
  if (!node) return null;

  const left  = node.left_child_id
    ? (allUsers.find(u => u.id === node.left_child_id) || null)
    : null;
  const right = node.right_child_id
    ? (allUsers.find(u => u.id === node.right_child_id) || null)
    : null;

  // Leaf when we have no further data OR we've hit maxDepth
  const hasLeftData  = !!node.left_child_id  && allUsers.some(u => u.id === node.left_child_id);
  const hasRightData = !!node.right_child_id && allUsers.some(u => u.id === node.right_child_id);
  const isLeaf       = depth >= maxDepth || (!hasLeftData && !hasRightData);

  const shouldRenderChildren = depth < maxDepth;

  return (
    <div className="bt-col">
      {/* The node itself */}
      <BtNode
        node={node}
        isLeaf={isLeaf}
        onExpand={onExpand}
        imageBaseUrl={imageBaseUrl}
      />

      {/* Children */}
      {shouldRenderChildren && (
        <>
          {/* Vertical down from this node */}
          <div className="bt-v-down" />

          {/* Horizontal bar + two child columns */}
          <div className={`bt-children${(!node.left_child_id && !node.right_child_id) ? " bt-single" : ""}`}>
            {/* Left child */}
            <div className="bt-col">
              <div className="bt-v-up" />
              {left
                ? <BtLevel node={left} allUsers={allUsers} depth={depth+1}
                    maxDepth={maxDepth} onExpand={onExpand} imageBaseUrl={imageBaseUrl} />
                : <BtNode node={null} isLeaf={false} onExpand={onExpand} imageBaseUrl={imageBaseUrl} />
              }
            </div>

            {/* Right child */}
            <div className="bt-col">
              <div className="bt-v-up" />
              {right
                ? <BtLevel node={right} allUsers={allUsers} depth={depth+1}
                    maxDepth={maxDepth} onExpand={onExpand} imageBaseUrl={imageBaseUrl} />
                : <BtNode node={null} isLeaf={false} onExpand={onExpand} imageBaseUrl={imageBaseUrl} />
              }
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────
const BinaryTree = ({
  allUsers   = [],
  rootUser,
  centeredUserId,
  onLeafClick,
  imageBaseUrl = "",
  maxDepth   = 3,
  disableNavigation = false,
}) => {
  const [selectedRoot, setSelectedRoot] = useState(rootUser);

  useEffect(() => { injectStyles(); }, []);

  // Sync when parent resets (search / full refresh)
  useEffect(() => {
    setSelectedRoot(rootUser);
  }, [rootUser]);

  // Re-center after expand
  useEffect(() => {
    if (!centeredUserId) return;
    const t = allUsers.find(u => u.id === centeredUserId);
    if (t) setSelectedRoot(t);
  }, [centeredUserId, allUsers]);

  if (!selectedRoot) return null;

  const goToTop = () => setSelectedRoot(rootUser);

  const goUp = () => {
    const parent = allUsers.find(
      u => u.left_child_id === selectedRoot.id || u.right_child_id === selectedRoot.id
    );
    if (parent) setSelectedRoot(parent);
  };

  return (
    <div className="bt-root">
      <div className="bt-level">
        <BtLevel
          node={selectedRoot}
          allUsers={allUsers}
          depth={1}
          maxDepth={maxDepth}
          onExpand={onLeafClick}
          imageBaseUrl={imageBaseUrl}
        />
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