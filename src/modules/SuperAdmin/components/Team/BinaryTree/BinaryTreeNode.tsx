import React from "react";

interface UserDescription {
  Sponsor?: string;
  Reg_Date?: string;
  Bot_Status?: string;
  Bot_Activation_Date?: string;
  totalleftTeamCount?: number;
  totalRightTeamCount?: number;
  leftTeamCount?: number;
  rightTeamCount?: number;
  leftRemainingTeamCount?: number;
  rightRemaining?: number;
  totalInvestmentAmount?: number;
}

interface User {
  id: string | number | null;
  username: string;
  image: string;
  paidstatus: string | null;
  left_child_id?: string | number | null;
  right_child_id?: string | number | null;
  description?: UserDescription;
}

interface BinaryTreeNodeProps {
  user: User;
  allUsers: User[];
  deep: number;
  maxDeep?: number;
  renderDetail?: (user: User) => React.ReactNode;
  renderNode?: (user: User) => React.ReactNode;
  onClick?: (id: string | number) => void;
  onLeafClick?: (id: string | number) => void;
  colorText?: string;
  imageFake?: string;
  nameFake?: string;
}

export default class BinaryTreeNode extends React.Component<BinaryTreeNodeProps> {
  render() {
    const {
      user,
      allUsers,
      deep,
      maxDeep = 3,
      renderDetail,
      renderNode,
      onClick,
      onLeafClick,
      colorText = "#333",
      imageFake = "/plus.png",
      nameFake = "Blank",
    } = this.props;

    // ── Placeholder / empty-slot node ──────────────────────────────────────
    const fakeUser: User = {
      id: null,
      username: nameFake,
      paidstatus: null,
      left_child_id: null,
      right_child_id: null,
      image: "",  // no image → renders "+" symbol
    };

    const leftChild  = allUsers.find((u) => u.id === user.left_child_id)  || fakeUser;
    const rightChild = allUsers.find((u) => u.id === user.right_child_id) || fakeUser;

    // Leaf detection: no children resolved in pool OR at visual max depth
    const hasLeft    = !!user.left_child_id  && allUsers.some((u) => u.id === user.left_child_id);
    const hasRight   = !!user.right_child_id && allUsers.some((u) => u.id === user.right_child_id);
    const isDataLeaf = !hasLeft && !hasRight;
    const isAtMax    = deep >= maxDeep;

    // Show the expand chevron only on real nodes that are visually at the bottom
    const showExpand = !!user.id && (isDataLeaf || isAtMax);

    const isEmpty = !user.id;
    const paid    = user.paidstatus === "Paid";
    const imageBaseUrl = (import.meta as any).env?.VITE_IMAGE_PREVIEW_URL ?? "";

    const handleNodeClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!user.id) return;
      onClick?.(user.id);
    };

    const handleExpand = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!user.id) return;
      onLeafClick?.(user.id);
    };

    const desc = user.description;

    return (
      <li>
        {/* ── Node anchor — tooltip on hover ── */}
        <a onClick={handleNodeClick} href="javascript:void(0)">
          {renderNode ? renderNode(user) : (
            <div className="distributor-wrap">

              {/* ── Avatar ──────────────────────────────────────────────────
                  empty-slot → shows "+" (matches ASPX add_plus-512.png)
                  paid       → green border ring
                  unpaid     → red border ring                              */}
              {isEmpty ? (
                <div className="avatar empty-slot" title="Empty slot — no member">
                  +
                </div>
              ) : (
                <div className={`avatar ${paid ? "paid" : "unpaid"}`}>
                  {user.image ? (
                    <img
                      src={`${imageBaseUrl}${user.image}`}
                      alt={user.username}
                      onError={(e: any) => { e.target.style.display = "none"; }}
                    />
                  ) : (
                    /* Fallback SVG person icon when no image URL */
                    <svg viewBox="0 0 48 48" fill="none" style={{ width: 54, height: 54 }}>
                      <circle cx="24" cy="18" r="10" fill="#d1d5db" />
                      <path d="M8 42c0-8.837 7.163-16 16-16s16 7.163 16 16" fill="#d1d5db" />
                    </svg>
                  )}
                </div>
              )}

              {/* ── Name label — purple pill ── */}
              <span className="name">
                {isEmpty
                  ? "BLANK"
                  : user.username.replace(/\[.*?\]/, "").trim().toUpperCase() || user.username.toUpperCase()
                }
              </span>
            </div>
          )}

          {/* ── Tooltip detail panel ── */}
          <div className="distributor-details">
            {renderDetail ? renderDetail(user) : (
              <div className="details-wrap">
                {/* Header */}
                <div className="details-title header">
                  {isEmpty ? "Empty Slot" : user.username}
                  <span className="close-btn">×</span>
                </div>

                {!isEmpty && (
                  <>
                    <div className="details-row">
                      <span className="label">Member Name</span>
                      <span className="value">{user.username}</span>
                    </div>
                    <div className="details-row">
                      <span className="label">Sponsor</span>
                      <span className="value">{desc?.Sponsor || "-"}</span>
                    </div>
                    <div className="details-row">
                      <span className="label">Joining Date</span>
                      <span className="value">{desc?.Reg_Date || "-"}</span>
                    </div>
                    <div className="details-row">
                      <span className="label">Status</span>
                      <span className={`status-badge ${desc?.Bot_Status === "Active" ? "active" : "inactive"}`}>
                        {desc?.Bot_Status || "-"}
                      </span>
                    </div>
                    <div className="details-row">
                      <span className="label">Investment</span>
                      <span className="value highlight">
                        ${desc?.totalInvestmentAmount?.toFixed(2) || "0.00"}
                      </span>
                    </div>
                    <div className="details-row">
                      <span className="label">Activation Date</span>
                      <span className="value">{desc?.Bot_Activation_Date || "-"}</span>
                    </div>

                    <div className="details-subtitle">Business Summary</div>
                    <div className="business-grid">
                      {[
                        { lbl: "Tot. Left",   val: desc?.totalleftTeamCount    ?? 0 },
                        { lbl: "Tot. Right",  val: desc?.totalRightTeamCount   ?? 0 },
                        { lbl: "Cur. Left",   val: desc?.leftTeamCount         ?? 0 },
                        { lbl: "Cur. Right",  val: desc?.rightTeamCount        ?? 0 },
                        { lbl: "Rem. Left",   val: desc?.leftRemainingTeamCount ?? 0 },
                        { lbl: "Rem. Right",  val: desc?.rightRemaining        ?? 0 },
                      ].map(({ lbl, val }) => (
                        <div className="business-box" key={lbl}>
                          <span>{lbl}</span><b>{val}</b>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                <div className="horizontal-line" />
                <div className="sloping-line" />
              </div>
            )}
          </div>
        </a>

        {/* ── Expand chevron (∨) — OUTSIDE the anchor so it doesn't open tooltip ──
            Mirrors ASPX last_level_user ↓ arrow. Pulsing indigo circle.          */}
        {showExpand && (
          <div className="expand-down-btn-wrap">
            <button
              className="expand-down-btn"
              title={`Expand downline of ${user.username}`}
              onClick={handleExpand}
            >
              <svg viewBox="0 0 24 24">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
          </div>
        )}

        {/* ── Recurse into children ── */}
        {deep < maxDeep && (
          <ul>
            <BinaryTreeNode
              deep={deep + 1} maxDeep={maxDeep}
              allUsers={allUsers} user={leftChild}
              renderDetail={renderDetail} renderNode={renderNode}
              onClick={onClick} onLeafClick={onLeafClick}
              colorText={colorText} imageFake={imageFake} nameFake={nameFake}
            />
            <BinaryTreeNode
              deep={deep + 1} maxDeep={maxDeep}
              allUsers={allUsers} user={rightChild}
              renderDetail={renderDetail} renderNode={renderNode}
              onClick={onClick} onLeafClick={onLeafClick}
              colorText={colorText} imageFake={imageFake} nameFake={nameFake}
            />
          </ul>
        )}
      </li>
    );
  }
}