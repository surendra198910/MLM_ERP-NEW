"use client";

import React from "react";

/* ================= TYPES ================= */

export type ReportColumn = {
  id: number;
  columnName: string;
  displayName: string;
  displayOrder: number;
  isDefault: boolean;
  isCurrency: boolean;
  isTotal: boolean;

  /* ✅ NEW */
  isSort: boolean;
  isHidden: boolean;
  sortDirection: "ASC" | "DESC";
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
      copy[index] = { ...copy[index], [key]: value };
      return copy;
    });
  };
 const handleSortChange = (index: number, checked: boolean) => {
  setColumns((prev) =>
    prev.map((col, i) => ({
      ...col,
      isSort: i === index ? checked : false,
      sortDirection:
        i === index && checked
          ? col.sortDirection || "DESC"
          : col.sortDirection,
    }))
  );
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
              <th className="px-4 py-3 w-32">Order</th>
              <th className="px-4 py-3 text-center">Default</th>
              <th className="px-4 py-3 text-center">Currency</th>
              <th className="px-4 py-3 text-center">Total</th>

              {/* ✅ NEW HEADERS */}
              <th className="px-4 py-3 text-center">Sort</th>
              <th className="px-4 py-3 text-center">Hidden</th>
              <th className="px-4 py-3 text-center">Sort Direction</th>
            </tr>
          </thead>

          {/* BODY */}
          <tbody>
            {columns.map((col, i) => (
              <tr
                key={col.id}
                className="border-b last:border-0 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-white/5 transition"
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
                    onChange={(e) =>
                      updateColumn(i, "displayName", e.target.value)
                    }
                    className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 outline-none"
                  />
                </td>

                {/* ORDER */}
                <td className="px-4 py-2">
                  <input
                    type="number"
                    value={col.displayOrder}
                    onChange={(e) =>
                      updateColumn(i, "displayOrder", Number(e.target.value))
                    }
                    className="w-24 px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 outline-none"
                  />
                </td>

                {/* OLD CHECKBOXES */}
                {(["isDefault", "isCurrency", "isTotal"] as const).map((key) => (
                  <td key={key} className="px-4 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={col[key]}
                      onChange={(e) =>
                        updateColumn(i, key, e.target.checked)
                      }
                      className="w-4 h-4 accent-primary-button-bg"
                    />
                  </td>
                ))}

                {/* ✅ isSort */}
                <td className="px-4 py-2 text-center">
                  <input
                    type="checkbox"
                    checked={col.isSort}
                    onChange={(e) => handleSortChange(i, e.target.checked)}
                    className="w-4 h-4 accent-primary-button-bg"
                  />
                </td>

                {/* ✅ isHidden */}
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

                {/* ✅ sortDirection */}
                <td className="px-4 py-2">
                  <select
                    value={col.sortDirection}
                    onChange={(e) =>
                      updateColumn(
                        i,
                        "sortDirection",
                      e.target.value as "ASC" | "DESC"
                      )
                    }
                    className="px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 outline-none"
                  >
                    <option value="ASC">ASC</option>
                    <option value="DESC">DESC</option>
                  </select>
                </td>

              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ReportColumnsConfig;