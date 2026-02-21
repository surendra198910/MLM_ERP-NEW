import React, { useState } from "react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type ColumnDef = {
  key: string;
  label: string;
};

type Props = {
  title?: string;
  columns: ColumnDef[];
  fetchData: () => Promise<any[]>;
};

const ExportButtons: React.FC<Props> = ({
  title = "Report",
  columns,
  fetchData,
}) => {
  const [loading, setLoading] = useState(false);

  const safeFetch = async () => {
    try {
      setLoading(true);
      const data = await fetchData();
      return Array.isArray(data) ? data : [];
    } catch (e) {
      console.error("Export fetch error:", e);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = async () => {
    const data = await safeFetch();
    if (!data.length) return;

    const header = columns.map(c => c.label).join(",");
    const rows = data.map(row =>
      columns.map(c => `"${row[c.key] ?? "-"}"`).join(",")
    );

    const blob = new Blob([header + "\n" + rows.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportExcel = async () => {
    const data = await safeFetch();
    if (!data.length) return;

    const rows = data.map(row => {
      const obj: any = {};
      columns.forEach(c => (obj[c.label] = row[c.key] ?? "-"));
      return obj;
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, title);
    XLSX.writeFile(wb, `${title}.xlsx`);
  };

  const exportPDF = async () => {
    const data = await safeFetch();
    if (!data.length) return;

    const doc = new jsPDF();

    autoTable(doc, {
      head: [columns.map(c => c.label)],
      body: data.map(row => columns.map(c => row[c.key] ?? "-")),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [37, 99, 235] }, // primary blue
      margin: { top: 20 },
    });

    doc.text(title, 14, 15);
    doc.save(`${title}.pdf`);
  };

  const print = async () => {
    const data = await safeFetch();
    if (!data.length) return;

    const w = window.open("", "_blank", "width=1200,height=800");
    if (!w) return;

    w.document.write(`
      <html>
        <head>
          <title>${title}</title>
          <style>
            body{font-family:Arial;padding:20px}
            h2{text-align:center;margin-bottom:20px}
            table{width:100%;border-collapse:collapse}
            th,td{border:1px solid #ccc;padding:8px;font-size:12px;text-align:left}
            th{background:#f3f4f6}
          </style>
        </head>
        <body>
          <h2>${title}</h2>
          <table>
            <thead>
              <tr>${columns.map(c => `<th>${c.label}</th>`).join("")}</tr>
            </thead>
            <tbody>
              ${data
                .map(
                  r =>
                    `<tr>${columns
                      .map(c => `<td>${r[c.key] ?? "-"}</td>`)
                      .join("")}</tr>`
                )
                .join("")}
            </tbody>
          </table>
          <script>window.onload=function(){window.print()}</script>
        </body>
      </html>
    `);

    w.document.close();
  };

  const btn =
    "h-8 px-3 inline-flex items-center justify-center text-xs font-semibold uppercase " +
    "text-primary-button-bg border border-primary-button-bg rounded-md " +
    "hover:bg-primary-button-bg hover:text-white transition-all disabled:opacity-50";

  const BtnWrap = ({
    label,
    onClick,
    tooltip,
  }: {
    label: string;
    onClick: () => void;
    tooltip: string;
  }) => (
    <div className="relative group">
      <button disabled={loading} onClick={onClick} className={btn}>
        {loading ? "..." : label}
      </button>

      <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2
        bg-black text-white text-xs px-2 py-1 rounded
        opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
        {tooltip}
      </div>
    </div>
  );

  return (
    <div className="flex items-center gap-2">
      <BtnWrap label="PDF" onClick={exportPDF} tooltip="Export PDF" />
      <BtnWrap label="Excel" onClick={exportExcel} tooltip="Export Excel" />
      <BtnWrap label="CSV" onClick={exportCSV} tooltip="Export CSV" />
      <BtnWrap label="Print" onClick={print} tooltip="Print" />
    </div>
  );
};

export default ExportButtons;