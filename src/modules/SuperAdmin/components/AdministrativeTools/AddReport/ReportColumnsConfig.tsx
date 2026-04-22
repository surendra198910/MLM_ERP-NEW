"use client";

import React from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
} from "@hello-pangea/dnd";
import type { DropResult } from "@hello-pangea/dnd";
import { GripVertical } from "lucide-react";

/* ═══════════════════════════════════════
   TYPE  (exported so AddReport can import)
═══════════════════════════════════════ */
export type ReportColumn = {
  id: number;
  columnName: string;         // read-only, from DB
  displayName: string;        // editable label shown in grid header
  columnexpression: string;   // maps to ColumnExpr in API payload
  displayOrder: number;       // drag-reordered position
  columnIndex: number;        // original DB order (unchanged)
  isDefault: boolean;         // DefaultVisible
  isCurrency: boolean;
  isTotal: boolean;
  isSort: boolean;            // only one row can be true at a time
  isHidden: boolean;
  sortDirection: "ASC" | "DSC";
};

interface Props {
  columns: ReportColumn[];
  setColumns: React.Dispatch<React.SetStateAction<ReportColumn[]>>;
}

/* ═══════════════════════════════════════
   COMPONENT
═══════════════════════════════════════ */
const ReportColumnsConfig: React.FC<Props> = ({ columns, setColumns }) => {

  /* Generic field updater ─ enforces single-sort rule */
  const updateColumn = <K extends keyof ReportColumn>(
    index: number,
    key: K,
    value: ReportColumn[K]
  ) => {
    setColumns((prev) => {
      const copy = [...prev];

      if (key === "isSort" && value === true) {
        // only one sort column allowed
        return copy.map((c, i) => ({ ...c, isSort: i === index }));
      }

      copy[index] = { ...copy[index], [key]: value };
      return copy;
    });
  };

  /* Drag-end: reorder + re-number displayOrder */
  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const items = Array.from(columns);
    const [moved] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, moved);
    setColumns(items.map((it, idx) => ({ ...it, displayOrder: idx + 1 })));
  };

  if (!columns.length) return null;

  return (
    <div className="trezo-card bg-white dark:bg-[#0c1427] rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm mb-[25px]">

      {/* ── HEADER ── */}
      <div className="px-5 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <h5 className="font-semibold text-lg text-black dark:text-white">
          Report Columns
          <span className="ml-2 text-sm font-normal text-gray-400">
            ({columns.filter(c => !c.isHidden).length} visible / {columns.length} total)
          </span>
        </h5>
        <p className="text-xs text-gray-400 hidden sm:block">
          Drag <GripVertical size={12} className="inline" /> to reorder • Only one Sort column allowed
        </p>
      </div>

      {/* ── TABLE ── */}
      <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
        <table className="w-full text-sm min-w-[900px]">

          {/* HEAD */}
          <thead className="sticky top-0 z-10 bg-primary-table-bg dark:bg-[#0c1427] border-b border-gray-200 dark:border-gray-700">
            <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
              <th className="px-4 py-3 w-10">#</th>
              <th className="px-4 py-3 min-w-[140px]">Column Name</th>
              <th className="px-4 py-3 min-w-[150px]">Display Name</th>
              <th className="px-4 py-3 min-w-[180px]">
                Column Expression
                <span
                  className="ml-1 text-gray-400 cursor-help"
                  title="SQL expression or alias used in the SELECT clause"
                >ⓘ</span>
              </th>
              <th className="px-4 py-3 text-center w-20">Default</th>
              <th className="px-4 py-3 text-center w-20">Currency</th>
              <th className="px-4 py-3 text-center w-16">Total</th>
              <th className="px-4 py-3 text-center w-16">Hidden</th>
              <th className="px-4 py-3 text-center w-16">Sort</th>
              <th className="px-4 py-3 w-28">Sort Dir</th>
              <th className="px-4 py-3 w-12 text-center">Move</th>
            </tr>
          </thead>

          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="report-columns">
              {(provided) => (
                <tbody ref={provided.innerRef} {...provided.droppableProps}>
                  {columns.map((col, i) => (
                    <Draggable
                      key={col.id}
                      draggableId={String(col.id)}
                      index={i}
                      isDragDisabled={col.isHidden}
                    >
                      {(drag, snapshot) => (
                        <tr
                          ref={drag.innerRef}
                          {...drag.draggableProps}
                          className={[
                            "border-b last:border-0 border-gray-100 dark:border-gray-700/60 transition-colors",
                            col.isHidden
                              ? "opacity-40 bg-gray-50 dark:bg-gray-800/40"
                              : "hover:bg-gray-50 dark:hover:bg-white/[0.03]",
                            snapshot.isDragging
                              ? "bg-blue-50 dark:bg-blue-900/20 shadow-lg"
                              : "",
                          ].join(" ")}
                        >
                          {/* S.No */}
                          <td className="px-4 py-2.5 text-gray-400 text-xs">{i + 1}</td>

                          {/* Column Name — read-only */}
                          <td className="px-4 py-2">
                            <input
                              value={col.columnName}
                              readOnly
                              className="w-full px-2.5 py-1.5 text-xs rounded-md
                                         border border-gray-200 dark:border-gray-700
                                         bg-gray-100 dark:bg-gray-900
                                         text-gray-500 cursor-not-allowed"
                            />
                          </td>

                          {/* Display Name */}
                          <td className="px-4 py-2">
                            <input
                              value={col.displayName}
                              disabled={col.isHidden}
                              onChange={(e) => updateColumn(i, "displayName", e.target.value)}
                              placeholder="Display label…"
                              className="w-full px-2.5 py-1.5 text-xs rounded-md
                                         border border-gray-300 dark:border-gray-700
                                         bg-white dark:bg-gray-800
                                         text-gray-800 dark:text-gray-200
                                         outline-none focus:border-primary-button-bg transition
                                         disabled:bg-gray-100 dark:disabled:bg-gray-900 disabled:cursor-not-allowed"
                            />
                          </td>

                          {/* ★ Column Expression (ColumnExpr) */}
                          <td className="px-4 py-2">
                            <input
                              value={col.columnexpression}
                              disabled={col.isHidden}
                              onChange={(e) => updateColumn(i, "columnexpression", e.target.value)}
                              placeholder="e.g. CAST(Col AS VARCHAR)"
                              className="w-full px-2.5 py-1.5 text-xs font-mono rounded-md
                                         border border-gray-300 dark:border-gray-700
                                         bg-white dark:bg-gray-800
                                         text-gray-800 dark:text-gray-200
                                         outline-none focus:border-primary-button-bg transition
                                         disabled:bg-gray-100 dark:disabled:bg-gray-900 disabled:cursor-not-allowed"
                            />
                          </td>

                          {/* Checkboxes: isDefault, isCurrency, isTotal */}
                          {(["isDefault", "isCurrency", "isTotal"] as const).map((key) => (
                            <td key={key} className="px-4 py-2 text-center">
                              <input
                                type="checkbox"
                                checked={col[key]}
                                disabled={col.isHidden}
                                onChange={(e) => updateColumn(i, key, e.target.checked)}
                                className="w-4 h-4 accent-primary-button-bg cursor-pointer
                                           disabled:cursor-not-allowed"
                              />
                            </td>
                          ))}

                          {/* isHidden — always enabled */}
                          <td className="px-4 py-2 text-center">
                            <input
                              type="checkbox"
                              checked={col.isHidden}
                              onChange={(e) => updateColumn(i, "isHidden", e.target.checked)}
                              className="w-4 h-4 accent-primary-button-bg cursor-pointer"
                            />
                          </td>

                          {/* isSort */}
                          <td className="px-4 py-2 text-center">
                            <input
                              type="checkbox"
                              checked={col.isSort}
                              disabled={col.isHidden}
                              onChange={(e) => updateColumn(i, "isSort", e.target.checked)}
                              className="w-4 h-4 accent-primary-button-bg cursor-pointer
                                         disabled:cursor-not-allowed"
                              title="Only one sort column is allowed"
                            />
                          </td>

                          {/* Sort Direction */}
                          <td className="px-4 py-2">
                            <select
                              value={col.sortDirection}
                              disabled={col.isHidden || !col.isSort}
                              onChange={(e) =>
                                updateColumn(i, "sortDirection", e.target.value as "ASC" | "DSC")
                              }
                              className="w-full px-2 py-1.5 text-xs rounded-md
                                         border border-gray-300 dark:border-gray-700
                                         bg-white dark:bg-gray-800
                                         text-gray-800 dark:text-gray-200
                                         outline-none transition
                                         disabled:bg-gray-100 dark:disabled:bg-gray-900 disabled:cursor-not-allowed"
                            >
                              <option value="ASC">ASC</option>
                              <option value="DSC">DESC</option>
                            </select>
                          </td>

                          {/* Drag handle */}
                          <td className="px-4 py-2 text-center">
                            {!col.isHidden ? (
                              <button
                                type="button"
                                {...drag.dragHandleProps}
                                className="cursor-grab active:cursor-grabbing p-1.5 rounded
                                           text-gray-400 hover:text-gray-700 hover:bg-gray-100
                                           dark:hover:bg-gray-700 dark:hover:text-gray-200 transition"
                                title="Drag to reorder"
                              >
                                <GripVertical size={16} />
                              </button>
                            ) : (
                              <span className="text-gray-300 px-1.5">—</span>
                            )}
                          </td>
                        </tr>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </tbody>
              )}
            </Droppable>
          </DragDropContext>
        </table>
      </div>
    </div>
  );
};

export default ReportColumnsConfig;
