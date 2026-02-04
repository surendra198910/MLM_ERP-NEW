import React from "react";

type Props = {
  rows?: number;
  columns?: number;
  showExportSkeleton?: boolean;
  showPageSizeSkeleton?: boolean; // 🆕
};

const TableSkeleton: React.FC<Props> = ({
  rows = 5,
  columns = 5,
  showExportSkeleton = false,
  showPageSizeSkeleton = false, // 🆕
}) => {
  return (
    <div className="animate-pulse">

      {/* PAGE SIZE + EXPORT ROW (SAME AS REAL UI) */}
      {(showExportSkeleton || showPageSizeSkeleton) && (
        <div className="flex justify-between items-center px-7 py-2 mb-2">

          {/* PAGE SIZE SKELETON (10 / page) */}
          {showPageSizeSkeleton ? (
            <div className="h-8 w-[120px] rounded-md bg-gray-200 dark:bg-gray-700" />
          ) : (
            <div /> // keeps spacing correct
          )}

          {/* EXPORT SKELETON */}
          {showExportSkeleton && (
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4].map((_, i) => (
                <div
                  key={i}
                  className="h-8 w-[58px] rounded-md bg-gray-200 dark:bg-gray-700"
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* TABLE */}
      <div className="table-responsive overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              {[...Array(columns)].map((_, i) => (
                <th
                  key={i}
                  className="px-[20px] py-[16px] bg-primary-50 dark:bg-[#15203c]"
                >
                  <div className="h-4 w-24 bg-gray-300 dark:bg-gray-600 rounded" />
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {[...Array(rows)].map((_, rowIdx) => (
              <tr key={rowIdx}>
                {[...Array(columns)].map((_, colIdx) => (
                  <td
                    key={colIdx}
                    className="px-[20px] py-[18px] border-b border-gray-100 dark:border-[#172036]"
                  >
                    <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
};

export default TableSkeleton;
