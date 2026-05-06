import BinaryTree from "./BinaryTree";
import React, { useState, useEffect, useRef } from "react";
import { ApiService } from "../../../../../services/ApiService";

// ── Types ────────────────────────────────────────────────────────────────────
interface MemberDetail {
  "Left Business": number;
  "Right Business": number;
  "Left Carry Forward Business": number;
  "Right Carry Forward Business": number;
}

interface TreeNode {
  id: number;
  left_child_id: number | null;
  right_child_id: number | null;
  username: string;          // "MemberName [UserName]" display string
  rawUserName: string;       // SP UserName — used for expand API call
  paidstatus: "Paid" | "UnPaid";
  description: {
    userName: string;
    Reg_Date: string;
    Bot_Status: string;
    Bot_Activation_Date: string;
    totalInvestmentAmount: number;
    Sponsor: string;
    MemberJoiningDetail: string;
    totalleftTeamCount: number;
    totalRightTeamCount: number;
    leftTeamCount: number;
    rightTeamCount: number;
    leftRemainingTeamCount: number;
    rightRemaining: number;
  };
  image: string;
  level: number;              // relative level from SP response
}

// ─────────────────────────────────────────────────────────────────────────────
// buildTreeNodes
// Converts the flat SP response array into a linked TreeNode[] array.
//
// SP key fields:
//   MemberId      – node's own id
//   PlaceUnderId  – parent's MemberId  (0 for root)
//   Position      – 0=root, 1=left child, 2=right child
//   UserName      – login code used as SearchUserName in expand calls
//   Status        – "ACtive" | "Blocked"
//   MemberDetail  – JSON string [{Left Business, Right Business, ...}]
//
// Algorithm (two passes):
//   Pass 1 – map every row into a TreeNode with null child ids
//   Pass 2 – for each non-root node, locate its parent and set the
//             correct left_child_id / right_child_id pointer
//             (first-wins per position to handle duplicate SP rows)
// ─────────────────────────────────────────────────────────────────────────────
function buildTreeNodes(rows: any[]): TreeNode[] {
  if (!rows?.length) return [];
  if (rows[0]?.StatusCode === "0") return [];

  // Pass 1 – create nodes
  const nodeMap = new Map<number, TreeNode & { _parentId: number; _position: number }>();

  for (const row of rows) {
    const memberId: number = row.MemberId;
    if (nodeMap.has(memberId)) continue; // skip duplicates

    let detail: MemberDetail = {
      "Left Business": 0, "Right Business": 0,
      "Left Carry Forward Business": 0, "Right Carry Forward Business": 0,
    };
    try {
      const parsed = JSON.parse(row.MemberDetail || "[]");
      if (Array.isArray(parsed) && parsed[0]) detail = parsed[0];
    } catch { /* keep defaults */ }

    const isActive = row.Status?.toLowerCase() === "active";

    nodeMap.set(memberId, {
      id:             memberId,
      left_child_id:  null,
      right_child_id: null,
      username:       `${row.MemberName ?? "-"} [${row.UserName ?? ""}]`,
      rawUserName:    row.UserName ?? "",
      paidstatus:     isActive ? "Paid" : "UnPaid",
      description: {
        userName:               row.MemberName           ?? "-",
        Reg_Date:               row.RegDate              ?? "",
        Bot_Status:             row.Status               ?? "",
        Bot_Activation_Date:    row.PaidDate             ?? "-",
        totalInvestmentAmount:  row.BusinessPoint        ?? 0,
        Sponsor:                row.Sponsor              ?? "-",
        MemberJoiningDetail:    row.MemberJoiningDetail  ?? "",
        totalleftTeamCount:     detail["Left Business"]                 ?? 0,
        totalRightTeamCount:    detail["Right Business"]                ?? 0,
        leftTeamCount:          detail["Left Carry Forward Business"]   ?? 0,
        rightTeamCount:         detail["Right Carry Forward Business"]  ?? 0,
        leftRemainingTeamCount: 0,
        rightRemaining:         0,
      },
      image:      row.ProfilePic    ?? "",
      level:      row.Level         ?? 0,
      _parentId:  row.PlaceUnderId  ?? 0,
      _position:  row.Position      ?? 0,
    });
  }

  // Pass 2 – wire up left/right child pointers
  for (const node of nodeMap.values()) {
    if (node._position === 0) continue; // root — no parent

    const parent = nodeMap.get(node._parentId);
    if (!parent) continue;

    if (node._position === 1 && parent.left_child_id === null) {
      parent.left_child_id = node.id;
    } else if (node._position === 2 && parent.right_child_id === null) {
      parent.right_child_id = node.id;
    }
  }

  // Sort root-first so allNodes[0] is always the root
  return Array.from(nodeMap.values()).sort((a, b) => a.level - b.level);
}

// ── Component ─────────────────────────────────────────────────────────────────
const BinaryTreeComponent = () => {
  const { universalService } = ApiService();

  const [allNodes, setAllNodes]             = useState<TreeNode[]>([]);
  const [rootNode, setRootNode]             = useState<TreeNode | null>(null);
  const [centeredUserId, setCenteredUserId] = useState<number | null>(null);
  const [treeLoading, setTreeLoading]       = useState(false);
  const [expandingId, setExpandingId]       = useState<number | null>(null); // which node is loading
  const [treeError, setTreeError]           = useState<string | null>(null);

  // Logged-in username from localStorage
  const [LoggedUserName] = useState<string>(
    () => localStorage.getItem("UserName") || ""
  );

  // Search
  const [searchText, setSearchText]       = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching]         = useState(false);

  // Cache: SP UserNames already fetched — prevents redundant API calls
  const fetchedUserNames = useRef<Set<string>>(new Set());

  // ── Raw SP call ───────────────────────────────────────────────────────────
  const callSP = async (userName: string, searchUserName = ""): Promise<any[]> => {
    const res = await universalService({
      procName: "TeamGenealogy",
      Para: JSON.stringify({
        UserName:       userName,
        SearchUserName: searchUserName,
      }),
    });
    return Array.isArray(res) ? res : [];
  };

  // ── Full reset — replaces entire tree ─────────────────────────────────────
  // Payload: { UserName: loggedIn, SearchUserName: target (optional) }
  // SP re-roots at SearchUserName when provided.
  const loadRoot = async (searchUserName = "") => {
    setTreeLoading(true);
    setTreeError(null);
    setAllNodes([]);
    setRootNode(null);
    setCenteredUserId(null);
    fetchedUserNames.current.clear();

    try {
      const rows = await callSP(LoggedUserName, searchUserName);

      if (!rows.length || rows[0]?.StatusCode === "0") {
        setTreeError(rows[0]?.msg || "No records found.");
        return;
      }

      // Mark the root username as fetched
      const rootRow = rows.find((r: any) => r.Level === 0);
      if (rootRow?.UserName) fetchedUserNames.current.add(rootRow.UserName);

      const nodes = buildTreeNodes(rows);
      setRootNode(nodes.find(n => n.level === 0) ?? nodes[0] ?? null);
      setAllNodes(nodes);
    } catch (err) {
      console.error("loadRoot:", err);
      setTreeError("Failed to load tree. Please try again.");
    } finally {
      setTreeLoading(false);
    }
  };

  // ── Expand a leaf node — fetch its downline and merge ─────────────────────
  // Called when user clicks ∨ on a bottom-level node.
  //
  // Payload sent to SP:
  //   { UserName: LoggedUserName, SearchUserName: clickedNode.rawUserName }
  //
  // SP returns the clicked node as Level=0 with 3 levels beneath it.
  // We merge those new nodes into allNodes and patch child pointers
  // on already-existing nodes so the tree renders the new children.
  const expandNode = async (clickedId: number) => {
    if (!clickedId) return;

    const clickedNode = allNodes.find(n => n.id === clickedId);
    if (!clickedNode || !clickedNode.rawUserName) return;

    // Already fetched as a root — just scroll to it
    if (fetchedUserNames.current.has(clickedNode.rawUserName)) {
      setCenteredUserId(null);
      setTimeout(() => setCenteredUserId(clickedId), 0);
      return;
    }

    setExpandingId(clickedId);

    try {
      const rows = await callSP(LoggedUserName, clickedNode.rawUserName);

      if (!rows.length || rows[0]?.StatusCode === "0") {
        console.warn("expandNode: no data for", clickedNode.rawUserName);
        return;
      }

      fetchedUserNames.current.add(clickedNode.rawUserName);

      // Build the subtree returned by SP
      const newNodes = buildTreeNodes(rows);

      setAllNodes(prev => {
        const existingIds = new Set(prev.map(n => n.id));

        // Patch child pointers on nodes we already have in the pool
        // (the SP response gives us the expanded node at level=0 with
        //  its left_child_id / right_child_id filled in correctly)
        const patched = prev.map(n => {
          const fresh = newNodes.find(nn => nn.id === n.id);
          if (!fresh) return n;
          return {
            ...n,
            // Only patch if SP tells us about new children
            left_child_id:  fresh.left_child_id  ?? n.left_child_id,
            right_child_id: fresh.right_child_id ?? n.right_child_id,
          };
        });

        // Add nodes that don't exist in the pool yet
        const toAdd = newNodes.filter(n => !existingIds.has(n.id));

        return [...patched, ...toAdd];
      });

      // Scroll the expanded node into view
      setCenteredUserId(null);
      setTimeout(() => setCenteredUserId(clickedId), 50);

    } catch (err) {
      console.error("expandNode:", err);
    } finally {
      setExpandingId(null);
    }
  };

  // ── Live autocomplete as user types ──────────────────────────────────────
  const handleSearchChange = async (text: string) => {
    setSearchText(text);
    setSearchResults([]);
    if (!text.trim()) return;

    setSearching(true);
    try {
      const rows = await callSP(LoggedUserName, text);
      if (Array.isArray(rows) && rows[0]?.StatusCode !== "0") {
        const unique = new Map<number, any>();
        rows.forEach((r: any) => { if (!unique.has(r.MemberId)) unique.set(r.MemberId, r); });
        setSearchResults(Array.from(unique.values()).slice(0, 10));
      }
    } catch { /* silent */ }
    finally { setSearching(false); }
  };

  // ── Search submit — re-root tree at typed username ────────────────────────
  // Sends: { UserName: LoggedUserName, SearchUserName: searchText }
  const handleSearchSubmit = async () => {
    const trimmed = searchText.trim();
    if (!trimmed) return;
    setSearchResults([]);
    await loadRoot(trimmed);
  };

  useEffect(() => { loadRoot(); }, []);

  // ── Derived stats ──────────────────────────────────────────────────────────
  const totalMembers = allNodes.length;
  const activeMembers = allNodes.filter(n => n.paidstatus === "Paid").length;
  const rootDetail    = rootNode?.description;
  const imageBaseUrl  = (import.meta as any).env?.VITE_IMAGE_PREVIEW_URL ?? "";

  return (
    <div className="trezo-card bg-white dark:bg-[#0c1427] mb-[25px] p-[20px] md:p-[25px] rounded-md">

      {/* ── HEADER ── */}
      <div className="trezo-card-header mb-[10px] sm:flex items-center justify-between pb-5 border-b border-gray-200 dark:border-[#172036] -mx-[20px] md:-mx-[25px] px-[20px] md:px-[25px]">
        <div className="flex items-center gap-4 flex-wrap">
          <div>
            <h5 className="!mb-0 font-bold text-xl text-black dark:text-white leading-tight">
              Binary Tree
            </h5>
            <p className="text-[10px] text-gray-400 dark:text-gray-500 tracking-wide mt-0.5">
              {rootNode
                ? `${rootNode.description.userName} · ${rootNode.rawUserName}`
                : "Loading…"}
            </p>
          </div>

          {/* Stats */}
          <div className="hidden sm:flex items-center gap-4 pl-4 border-l border-gray-200 dark:border-[#172036]">
            {[
              { val: totalMembers,  lbl: "Loaded" },
              { val: activeMembers, lbl: "Active"  },
              { val: rootDetail?.totalleftTeamCount  ?? 0, lbl: "L Biz" },
              { val: rootDetail?.totalRightTeamCount ?? 0, lbl: "R Biz" },
            ].map(({ val, lbl }) => (
              <div key={lbl} className="text-center">
                <div className="text-lg font-bold text-amber-500 leading-none">{val}</div>
                <div className="text-[9px] uppercase tracking-widest text-gray-400 mt-0.5">{lbl}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Search bar ── */}
        <div className="flex items-center gap-2 mt-3 sm:mt-0">
          <div className="relative">
            <input
              type="text"
              value={searchText}
              onChange={e => handleSearchChange(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") handleSearchSubmit(); }}
              placeholder="Enter username…"
              className="h-[34px] pl-3 pr-3 w-52 text-xs rounded-md outline-none border border-gray-300 dark:border-[#172036] bg-white dark:bg-[#0c1427] text-black dark:text-white focus:border-primary-button-bg transition-all"
            />

            {/* Autocomplete dropdown */}
            {searchResults.length > 0 && (
              <div className="absolute top-full left-0 mt-1 z-50 w-64 bg-white dark:bg-[#0c1427] border border-gray-200 dark:border-[#172036] rounded-md shadow-xl max-h-52 overflow-y-auto">
                {searchResults.map((u: any) => (
                  <button
                    key={u.MemberId}
                    className="w-full text-left px-3 py-2.5 text-xs hover:bg-gray-50 dark:hover:bg-[#172036] text-black dark:text-white flex items-center gap-2 border-b border-gray-100 dark:border-[#172036] last:border-0"
                    onClick={() => {
                      setSearchText(u.UserName);
                      setSearchResults([]);
                      loadRoot(u.UserName);
                    }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ background: u.Status?.toLowerCase() === "active" ? "#22c55e" : "#ef4444" }} />
                    <span className="font-semibold">{u.MemberName}</span>
                    <span className="text-gray-400 ml-auto text-[10px]">[{u.UserName}]</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Search button — sends { UserName, SearchUserName } */}
          <button
            onClick={handleSearchSubmit}
            disabled={!searchText.trim() || treeLoading}
            title="Search"
            className="w-[34px] h-[34px] flex items-center justify-center rounded-md border border-primary-button-bg text-primary-button-bg hover:bg-primary-button-bg hover:text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {searching || treeLoading
              ? <span className="inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
              : <i className="material-symbols-outlined text-[20px]">search</i>
            }
          </button>

          {/* Reset to own tree */}
          <button
            onClick={() => { setSearchText(""); setSearchResults([]); loadRoot(); }}
            title="Reset to my tree"
            className="w-[34px] h-[34px] flex items-center justify-center rounded-md border border-gray-300 dark:border-[#172036] text-gray-500 hover:bg-gray-100 dark:hover:bg-[#172036] transition-all"
          >
            <i className="material-symbols-outlined text-[20px]">refresh</i>
          </button>
        </div>
      </div>

      {/* ── TREE CARD ── */}
      <div className="border border-gray-200 dark:border-[#172036] rounded-xl overflow-hidden mt-4">

        {/* Sub-header + legend */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 dark:border-[#172036] bg-gray-50 dark:bg-[#060d14] flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <div className="w-[3px] h-[18px] rounded-full bg-primary-button-bg" />
            <span className="text-sm font-bold tracking-widest text-black dark:text-white uppercase">
              Binary Network
            </span>
            <span className="text-[10px] bg-primary-button-bg text-white rounded-full px-2 py-0.5 font-semibold">
              {totalMembers} nodes
            </span>
            {/* Expand spinner — shown while fetching a downline */}
            {expandingId !== null && (
              <span className="flex items-center gap-1 text-[10px] text-indigo-500">
                <span className="inline-block w-3 h-3 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                Loading downline…
              </span>
            )}
          </div>
          <div className="hidden sm:flex items-center gap-3">
            {[
              { color: "#22c55e", shadow: "0 0 5px #22c55e80", label: "Active"  },
              { color: "#ef4444", shadow: undefined,            label: "Blocked" },
              { color: "#6366f1", shadow: undefined,            label: "Label"   },
            ].map(({ color, shadow, label }) => (
              <div key={label} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: color, boxShadow: shadow }} />
                <span className="text-[10px] text-gray-500 dark:text-gray-400">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Hint */}
        <div className="flex items-center gap-2 px-5 py-2 bg-indigo-50 dark:bg-[#0a1525] border-b border-indigo-100 dark:border-[#172036]">
          <i className="material-symbols-outlined text-[15px] text-indigo-500">info</i>
          <span className="text-[11px] text-gray-500 dark:text-gray-400">
            <strong className="text-indigo-500">Hover</strong> a node to see details.&nbsp;
            Click <strong className="text-indigo-500">∨</strong> on bottom members to fetch their downline from the server.
          </span>
        </div>

        {/* ── TREE CONTENT ── */}
        <div className="min-h-[520px] overflow-x-auto">

          {/* Full-page skeleton on initial load */}
          {treeLoading && (
            <div className="flex flex-col items-center justify-center min-h-[520px] gap-4">
              <div className="flex flex-col items-center gap-3 animate-pulse">
                <div className="w-[90px] h-[90px] rounded-full bg-gray-200 dark:bg-[#172036]" />
                <div className="w-24 h-4 rounded-md bg-gray-200 dark:bg-[#172036]" />
                <div className="w-0.5 h-9 bg-gray-200 dark:bg-[#172036]" />
                <div className="flex gap-24">
                  {[0, 1].map(i => (
                    <div key={i} className="flex flex-col items-center gap-2">
                      <div className="w-[72px] h-[72px] rounded-full bg-gray-200 dark:bg-[#172036]" />
                      <div className="w-20 h-4 rounded-md bg-gray-200 dark:bg-[#172036]" />
                    </div>
                  ))}
                </div>
                <div className="w-0.5 h-9 bg-gray-100 dark:bg-[#172036]" />
                <div className="flex gap-10">
                  {[0, 1, 2, 3].map(i => (
                    <div key={i} className="flex flex-col items-center gap-2">
                      <div className="w-[60px] h-[60px] rounded-full bg-gray-100 dark:bg-[#1a2a3a]" />
                      <div className="w-16 h-3 rounded-md bg-gray-100 dark:bg-[#1a2a3a]" />
                    </div>
                  ))}
                </div>
              </div>
              <p className="text-xs text-gray-400 tracking-widest uppercase mt-2">Loading tree…</p>
            </div>
          )}

          {/* Error */}
          {!treeLoading && treeError && (
            <div className="flex flex-col items-center justify-center min-h-[520px] gap-3">
              <i className="material-symbols-outlined text-[48px] text-red-400">error</i>
              <p className="text-sm font-semibold text-red-500">{treeError}</p>
              <button
                onClick={() => loadRoot()}
                className="mt-2 px-4 py-2 text-xs font-bold rounded-md bg-primary-button-bg text-white hover:opacity-90 transition"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Tree rendered — always from true root, full depth */}
          {!treeLoading && !treeError && rootNode && (
            <div className="animate-in fade-in duration-500">
              <BinaryTree
                allUsers={allNodes}
                rootUser={allNodes.find(n => n.level === 0) ?? allNodes[0]}
                centeredUserId={centeredUserId}
                onLeafClick={expandNode}
                imageBaseUrl={imageBaseUrl}
                maxDepth={3}
              />
            </div>
          )}

          {/* Empty state */}
          {!treeLoading && !treeError && !rootNode && (
            <div className="flex flex-col items-center justify-center min-h-[520px] gap-3 text-gray-400">
              <i className="material-symbols-outlined text-[48px]">account_tree</i>
              <p className="text-sm">No tree data found.</p>
            </div>
          )}
        </div>
      </div>

      {/* ── ROOT INFO STRIP ── */}
      {rootNode && !treeLoading && (
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { lbl: "Sponsor",  val: rootDetail?.Sponsor            || "—" },
            { lbl: "Joined",   val: rootDetail?.Reg_Date           || "—" },
            { lbl: "Status",   val: rootDetail?.Bot_Status         || "—" },
            { lbl: "L Biz",    val: `${rootDetail?.totalleftTeamCount ?? 0}` },
          ].map(({ lbl, val }) => (
            <div key={lbl}
              className="bg-gray-50 dark:bg-[#060d14] border border-gray-200 dark:border-[#172036] rounded-lg px-4 py-3">
              <div className="text-[9px] uppercase tracking-widest text-gray-400">{lbl}</div>
              <div className="text-sm font-semibold text-black dark:text-white mt-0.5 truncate">{val}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BinaryTreeComponent;