import React from "react";
import Tooltip from "./Tooltip";

type ExportButtonsProps = {
  canExport: boolean;
  onExportPDF: () => void;
  onExportExcel: () => void;
  onExportCSV: () => void;
};

const ExportButtons: React.FC<ExportButtonsProps> = ({
  canExport,
  onExportPDF,
  onExportExcel,
  onExportCSV,
}) => (
  <div className="flex items-center gap-2 leading-none">
    <Tooltip text="Export PDF">
      <button
        type="button"
        disabled={!canExport}
        onClick={onExportPDF}
        className="h-8 px-3 inline-flex items-center justify-center text-xs font-semibold uppercase text-primary-500 border border-primary-500 rounded-md hover:bg-primary-500 hover:text-white transition-all"
      >
        PDF
      </button>
    </Tooltip>
    <Tooltip text="Export Excel">
      <button
        type="button"
        disabled={!canExport}
        onClick={onExportExcel}
        className="h-8 px-3 inline-flex items-center justify-center text-xs font-semibold uppercase text-primary-500 border border-primary-500 rounded-md hover:bg-primary-500 hover:text-white transition-all"
      >
        Excel
      </button>
    </Tooltip>
    <Tooltip text="Export CSV">
      <button
        type="button"
        disabled={!canExport}
        onClick={onExportCSV}
        className="h-8 px-3 inline-flex items-center justify-center text-xs font-semibold uppercase text-primary-500 border border-primary-500 rounded-md hover:bg-primary-500 hover:text-white transition-all"
      >
        CSV
      </button>
    </Tooltip>
  </div>
);

export default ExportButtons;
