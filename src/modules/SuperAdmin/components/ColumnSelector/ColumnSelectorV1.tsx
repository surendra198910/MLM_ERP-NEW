import React, { useEffect, useState } from "react";
import { ApiService } from "../../../../services/ApiService";
import { Dialog } from "@headlessui/react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import type { DropResult } from "@hello-pangea/dnd";

interface ColumnSelectorProps {
  procName: string;
  onApply?: () => void;
  disabled?: boolean;
}

const ColumnSelector: React.FC<ColumnSelectorProps> = ({
  procName,
  onApply,
  disabled = false,
}) => {
  const { universalService } = ApiService();

  const [open, setOpen] = useState(false);
  const [columns, setColumns] = useState<any[]>([]);
  const [employeeId, setEmployeeId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  /* ============================================================
     LOAD EMPLOYEE ID
  ============================================================ */
  useEffect(() => {
    try {
      const saved = localStorage.getItem("EmployeeDetails");
      if (saved) {
        setEmployeeId(JSON.parse(saved).EmployeeId);
      }
    } catch (err) {
      console.error("EmployeeDetails read error", err);
    }
  }, []);

  /* ============================================================
    LOAD COLUMNS (PROC BASED)
============================================================ */
  const loadColumns = async () => {
    if (!employeeId) return;

    setLoading(true);
    try {
      const payload = {
        procName: "UniversalColumnSelector",
        Para: JSON.stringify({
          EmployeeId: employeeId,
          USPName: procName,
          ActionMode: "List",
          Mode: "Get",
        }),
      };

      const response = await universalService(payload);
      const list = response?.data ?? response;

      if (!Array.isArray(list)) return;

      // FIX: Normalize the values AND filter the list
      const filteredList = list
        .map((c: any) => ({
          ...c,
          IsVisible: Boolean(c.IsVisible),
          // Logic check: Is it actually hidden by the system?
          isHiddenSystem:
            c.IsHidden === true || c.IsHidden === 1 || c.IsHidden === "1",
        }))
        .filter((c) => !c.isHiddenSystem); // 🔥 Only keep columns where isHiddenSystem is false

      setColumns(filteredList);
    } catch (err) {
      console.error("Column load error", err);
    } finally {
      setLoading(false);
    }
  };

  /* ============================================================
     LOAD WHEN DRAWER OPENS
  ============================================================ */
  useEffect(() => {
    if (open && employeeId) {
      loadColumns();
    }
  }, [open, employeeId]);

  /* ============================================================
     SAVE USER PREFERENCES
  ============================================================ */
  const savePreferences = async () => {
    if (!employeeId) return;

    setLoading(true);

    try {
      // 🔥 Preserve drag order FIRST
      let visibleIndex = 1;

      const finalCols = columns.map((col) => {
        if (col.IsVisible) {
          return {
            ...col,
            DisplayOrder: visibleIndex++,
          };
        }
        return {
          ...col,
          DisplayOrder: 999,
        };
      });

      await universalService({
        procName: "UniversalColumnSelector",
        Para: JSON.stringify({
          EmployeeId: employeeId || 0,
          USPName: procName,
          ActionMode: "List",
          ColumnNames: finalCols.map((c) => c.ColumnName).join(","),
          DisplayOrders: finalCols.map((c) => c.DisplayOrder).join(","),
          Visibility: finalCols.map((c) => (c.IsVisible ? 1 : 0)).join(","),
          Mode: "Save",
        }),
      });

      // ✅ Close drawer AFTER save
      setOpen(false);

      // ✅ Notify parent to refresh columns + table
      onApply?.();
    } catch (err) {
      console.error("Column preference save failed", err);
    } finally {
      setLoading(false);
    }
  };

  /* ============================================================
     TOGGLE VISIBILITY
  ============================================================ */
  const toggleColumn = (index: number) => {
    const updated = [...columns];
    updated[index].IsVisible = !updated[index].IsVisible;
    setColumns(updated);
  };

  /* ============================================================
     DRAG & DROP
  ============================================================ */
  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const reordered = [...columns];
    const [removed] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, removed);
    setColumns(reordered);
  };

  /* ============================================================
     RENDER
  ============================================================ */
  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => {
          if (disabled) return;
          setOpen(true);
        }}
        className="w-[34px] h-[34px] flex items-center justify-center
      border border-primary-button-bg text-primary-button-bg rounded-md
      hover:bg-primary-button-bg hover:text-white transition-all"
      >
        <i className="material-symbols-outlined text-[22px]">view_column</i>
      </button>

      {/* Drawer */}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        className="relative z-100"
      >
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />

        <div className="fixed inset-y-0 right-0 w-full max-w-[380px]">
          <Dialog.Panel
            className="h-full bg-white dark:bg-[#0c1427]
            shadow-2xl animate-[slideIn_0.35s_ease-out]"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b dark:border-[#172036]">
              <h5 className="font-semibold text-black dark:text-white">
                Column Selector
              </h5>
              <button onClick={() => setOpen(false)}>
                <i className="material-symbols-outlined text-[24px]">close</i>
              </button>
            </div>

            <p className="px-4 py-2 text-xs text-gray-600 dark:text-gray-300">
              Drag to reorder. Toggle to show/hide columns.
            </p>

            {/* Content */}
            <div className="px-4 py-2 overflow-y-auto max-h-[70vh]">
              {loading ? (
                <p className="text-sm text-gray-500">Loading...</p>
              ) : (
                <DragDropContext onDragEnd={onDragEnd}>
                  <Droppable droppableId="columns">
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className="space-y-2"
                      >
                        {columns.map((col, index) => (
                          <Draggable
                            key={col.ColumnName}
                            draggableId={col.ColumnName}
                            index={index}
                          >
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`flex items-center justify-between
                                px-3 py-2 rounded-md
                                bg-gray-100 dark:bg-[#15203c]
                                ${snapshot.isDragging ? "shadow-lg" : ""}`}
                              >
                                <span className="text-sm text-black dark:text-white">
                                  {col.DisplayName}
                                </span>

                                <div className="flex items-center gap-3">
                                  <input
                                    type="checkbox"
                                    checked={col.IsVisible}
                                    onChange={() => toggleColumn(index)}
                                    className="h-4 w-4 accent-primary-button-bg"
                                  />
                                  <i className="material-symbols-outlined text-gray-500">
                                    drag_indicator
                                  </i>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              )}
            </div>

            {/* Footer */}
            <div
              className="absolute bottom-0 left-0 right-0
            px-4 py-3 border-t dark:border-[#172036]
            flex justify-between bg-white dark:bg-[#0c1427]"
            >
              <button
                onClick={savePreferences}
                disabled={loading}
                className="px-5 py-2 text-sm rounded-md
             bg-primary-button-bg text-white
             disabled:opacity-60"
              >
                {loading ? "Saving..." : "Save"}
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Animation */}
      <style>
        {`
          @keyframes slideIn {
            from { transform: translateX(100%); }
            to { transform: translateX(0); }
          }
        `}
      </style>
    </>
  );
};

export default ColumnSelector;
