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
                    onChange={(e) =>
                      updateColumn(i, "columnName", e.target.value)
                    }
                    placeholder="Column name"
                    className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-1 focus:ring-primary-button-bg outline-none"
                  />
                </td>

                {/* DISPLAY NAME */}
                <td className="px-4 py-2">
                  <input
                    value={col.displayName}
                    onChange={(e) =>
                      updateColumn(i, "displayName", e.target.value)
                    }
                    placeholder="Display name"
                    className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-1 focus:ring-primary-button-bg outline-none"
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
                    className="w-24 px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-1 focus:ring-primary-button-bg outline-none"
                  />
                </td>

                {/* CHECKBOXES */}
                {(["isDefault","isCurrency","isTotal"] as const).map((key) => (
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
              </tr>
            ))}
          </tbody>

        </table>
      </div>

      {/* FOOTER */}
      {/* <div className="px-5 py-3 text-xs text-gray-400 border-t border-gray-200 dark:border-gray-700">
        {columns.length} columns detected from query
      </div> */}
    </div>
  );
};

export default ReportColumnsConfig;