"use client";

import React from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
} from "@hello-pangea/dnd";
import type { DropResult } from "@hello-pangea/dnd";

import { GripVertical } from "lucide-react";
/* ================= TYPES ================= */

export type ReportColumn = {
  id: number;
  columnName: string;
  displayName: string;
  displayOrder: number;

  columnIndex: number;   // ⭐ NEW (IMPORTANT)

  isDefault: boolean;
  isCurrency: boolean;
  isTotal: boolean;

  isSort: boolean;
  isHidden: boolean;
  sortDirection: "ASC" | "DSC";
};

interface Props {
  columns: ReportColumn[];
  setColumns: React.Dispatch<React.SetStateAction<ReportColumn[]>>;
}

/* ================= COMPONENT ================= */

const ReportColumnsConfig: React.FC<Props> = ({
  columns,
  setColumns,
}) => {
  const updateColumn = <K extends keyof ReportColumn>(
    index: number,
    key: K,
    value: ReportColumn[K]
  ) => {
    setColumns((prev) => {
      const copy = [...prev];

      /* ⭐ only one sort allowed */
      if (key === "isSort" && value === true) {
        return copy.map((c, i) => ({
          ...c,
          isSort: i === index,
        }));
      }

      copy[index] = { ...copy[index], [key]: value };
      return copy;
    });
  };
  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(columns);
    const [moved] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, moved);

    const updated = items.map((it, idx) => ({
      ...it,
      displayOrder: idx + 1,
    
    }));

    setColumns(updated);
  };
  if (!columns.length) return null;

  return (
    <div className="mt-8 trezo-card bg-white dark:bg-[#0c1427] rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">

      {/* HEADER */}
      <div className="px-5 py-1 mt-2 border-b border-gray-200 dark:border-gray-700">
        <h5 className="font-semibold text-lg text-black dark:text-white">
          Report Columns
        </h5>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto max-h-[460px]">
        <table className="w-full text-sm">

          {/* HEAD */}
          <thead className="sticky top-0 z-10 bg-primary-table-bg dark:bg-[#0c1427] border-b border-gray-200 dark:border-gray-700 text-gray-500">
            <tr>
              <th className="px-4 py-3 w-12">S.No.</th>
              <th className="px-4 py-3">Column Name</th>
              <th className="px-4 py-3">Display Name</th>
              {/* <th className="px-4 py-3 w-32">Order</th> */}
              <th className="px-4 py-3 text-center">Default</th>
              <th className="px-4 py-3 text-center">Currency</th>
              <th className="px-4 py-3 text-center">Total</th>

              {/* ✅ NEW HEADERS */}

              <th className="px-4 py-3 text-center">Hidden</th>
              <th className="px-4 py-3 text-center">Sort</th>
              <th className="px-4 py-3 text-center">Sort Direction</th>
              <th className="px-4 py-3 w-16 text-right">Move</th>
            </tr>
          </thead>

          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="columns">
              {(provided) => (
                <tbody ref={provided.innerRef} {...provided.droppableProps}>
                  {columns.map((col, i) => (
                    <Draggable
                      key={col.id}
                      draggableId={String(col.id)}
                      index={i}
                      isDragDisabled={col.isHidden}
                    >
                      {(dragProvided, snapshot) => (
                        <tr
                          ref={dragProvided.innerRef}
                          {...dragProvided.draggableProps}
                          className={`border-b last:border-0 border-gray-200 dark:border-gray-700 transition
    ${col.isHidden ? "opacity-50 bg-gray-100 dark:bg-gray-800" : "hover:bg-gray-50 dark:hover:bg-white/5"}
    ${snapshot.isDragging ? "bg-blue-50 dark:bg-blue-900/20" : ""}
  `}
                        >
                          {/* INDEX */}
                          <td className="px-4 py-3 text-gray-400">{i + 1}</td>

                          {/* COLUMN NAME */}
                          <td className="px-4 py-2">
                            <input
                              value={col.columnName}
                              readOnly
                              className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-900 cursor-not-allowed"
                            />
                          </td>

                          {/* DISPLAY NAME */}
                          <td className="px-4 py-2">
                            <input
                              value={col.displayName}
                              disabled={col.isHidden}
                              onChange={(e) =>
                                updateColumn(i, "displayName", e.target.value)
                              }
                              className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 outline-none"
                            />
                          </td>
                          {/* ORDER */}
                          {/* <td className="px-4 py-2">
                            <input
                              type="number"
                              value={col.displayOrder}
                              disabled={col.isHidden}
                              onChange={(e) =>
                                updateColumn(i, "displayOrder", Number(e.target.value))
                              }
                              className="w-24 px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 outline-none"
                            />
                          </td> */}

                          {(["isDefault", "isCurrency", "isTotal"] as const).map((key) => (
                            <td key={key} className="px-4 py-2 text-center">
                              <input
                                type="checkbox"
                                checked={col[key]}
                                disabled={col.isHidden}
                                onChange={(e) =>
                                  updateColumn(i, key, e.target.checked)
                                }
                                className="w-4 h-4 accent-primary-button-bg"
                              />
                            </td>
                          ))}

                          {/* HIDDEN */}
                          <td className="px-4 py-2 text-center">
                            <input
                              type="checkbox"
                              checked={col.isHidden}

                              onChange={(e) =>
                                updateColumn(i, "isHidden", e.target.checked)
                              }
                              className="w-4 h-4 accent-primary-button-bg"
                            />
                          </td>
                          {/* SORT */}
                          <td className="px-4 py-2 text-center">
                            <input
                              type="checkbox"
                              checked={col.isSort}
                              disabled={col.isHidden}
                              onChange={(e) =>
                                updateColumn(i, "isSort", e.target.checked)
                              }
                              className="w-4 h-4 accent-primary-button-bg"
                            />
                          </td>

                          {/* SORT DIRECTION */}
                          <td className="px-4 py-2">
                            <select
                              value={col.sortDirection}
                              disabled={col.isHidden}
                              onChange={(e) =>
                                updateColumn(
                                  i,
                                  "sortDirection",
                                  e.target.value as "ASC" | "DSC"
                                )
                              }
                              className="px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 outline-none"
                            >
                              <option value="ASC">ASC</option>
                              <option value="DSC">DSC</option>
                            </select>
                          </td>

                          {/* ⭐ DRAG BUTTON RIGHT */}
                          <td className="px-4 py-2 text-right">
                            <button
                              {...dragProvided.dragHandleProps}
                              className="cursor-grab active:cursor-grabbing p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700"
                            >
                              <GripVertical size={18} />
                            </button>
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