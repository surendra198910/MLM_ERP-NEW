import React, { useState } from "react";

interface ViewActionCellProps {
  row: any;
  onView: (row: any) => void;
}

const ViewActionCell: React.FC<ViewActionCellProps> = ({ row, onView }) => {
  const [hovered, setHovered] = useState(false);

  if (row.__isTotal) return null;

  return (
    <button
      onClick={() => onView(row)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title="View Details"
      className="flex items-center justify-center w-8 h-8 rounded-full transition-all duration-200"
      style={{
        background: hovered ? "#eff6ff" : "transparent",
        color: hovered ? "#2563eb" : "#6b7280",
        border: "1px solid",
        borderColor: hovered ? "#bfdbfe" : "#e5e7eb",
      }}
    >
      <i className="material-symbols-outlined" style={{ fontSize: 18 }}>
        visibility
      </i>
    </button>
  );
};

export default ViewActionCell;