import React from "react";
import Tooltip from "./Tooltip";

type TableHeaderProps = {
  columns: any[];
  sortColumn: string;
  sortDirection: string;
  onSort: (column: string) => void;
};

const TableHeader: React.FC<TableHeaderProps> = ({
  columns,
  sortColumn,
  sortDirection,
  onSort,
}) => (
  <thead className="text-black dark:text-white">
    <tr>
      {columns.map((col) => (
        <th
          key={col.ColumnName}
          onClick={() => onSort(col.ColumnName)}
          className={`font-medium ltr:text-left rtl:text-right px-[20px] py-[11px] whitespace-nowrap cursor-pointer transition-colors ${
            sortColumn === col.ColumnName
              ? "bg-primary-100 dark:bg-[#1e2a4a]"
              : "bg-primary-50 dark:bg-[#15203c]"
          }`}
        >
          <div className="flex items-center gap-1 group">
            <span className="group-hover:text-primary-600 transition-colors">
              {col.DisplayName}
            </span>
            <i
              className={`material-symbols-outlined text-sm transition-all ${
                sortColumn === col.ColumnName
                  ? "text-primary-600 dark:text-primary-400 opacity-100"
                  : "text-gray-400 dark:text-gray-500 opacity-40"
              }`}
            >
              {sortDirection === "ASC" ? "arrow_drop_up" : "arrow_drop_down"}
            </i>
          </div>
        </th>
      ))}
      <th className="px-[20px] py-[11px] text-left bg-primary-50 dark:bg-[#15203c]">
        Action
      </th>
    </tr>
  </thead>
);

export default TableHeader;
