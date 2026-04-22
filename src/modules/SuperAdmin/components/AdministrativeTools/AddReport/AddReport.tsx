"use client";

import React, { useState, useEffect, useRef } from "react";
import Swal from "sweetalert2";
import { Formik } from "formik";
import type { FormikHelpers } from "formik";
import * as Yup from "yup";
import ReportColumnsConfig from "./ReportColumnsConfig";
import type { ReportColumn } from "./ReportColumnsConfig";
import { ApiService } from "../../../../../services/ApiService";
import { useNavigate, useParams } from "react-router-dom";

/* ═══════════════════════════════════════
   TYPES
═══════════════════════════════════════ */
interface ReportFormValues {
  reportName: string;
  procedureName: string;
  description: string;
  query: string;
}

const schema: Yup.ObjectSchema<ReportFormValues> = Yup.object({
  reportName: Yup.string().required("Report name required"),
  procedureName: Yup.string().required("Procedure name required"),
  description: Yup.string(),
  query: Yup.string().required("Query required"),
});

/* ═══════════════════════════════════════
   SHARED STYLES
═══════════════════════════════════════ */
const bigInputClasses =
  "w-full border border-gray-300 dark:border-gray-700 rounded-md px-3 py-2 text-sm h-10 " +
  "placeholder-gray-400 focus:outline-none focus:border-primary-button-bg focus:ring-1 focus:ring-primary-button-bg transition-all " +
  "bg-white dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500";

/* ═══════════════════════════════════════
   MINI COMPONENTS
═══════════════════════════════════════ */
const InputField = ({ label, name, placeholder, values, handleChange, errors, touched }: any) => (
  <div className="flex flex-col dark:text-gray-100">
    <label className="text-sm text-gray-700 dark:text-gray-300 mb-1">{label}</label>
    <input
      name={name}
      placeholder={placeholder}
      value={values[name] || ""}
      onChange={handleChange}
      className={`${bigInputClasses} ${errors[name] && touched[name] ? "border-red-500 focus:ring-red-500" : ""}`}
    />
    <div className="min-h-[16px] mt-1">
      {errors[name] && touched[name] && (
        <span className="text-xs text-red-600">{errors[name]}</span>
      )}
    </div>
  </div>
);

const TextareaField = ({ label, name, placeholder, values, handleChange, errors, touched }: any) => (
  <div className="flex flex-col">
    <label className="text-sm text-gray-700 dark:text-gray-300 mb-1">{label}</label>
    <textarea
      name={name}
      placeholder={placeholder}
      value={values[name] || ""}
      readOnly={name === "query"}
      rows={7}
      className={`w-full border border-gray-300 dark:border-gray-700 rounded-md px-3 py-3 text-sm font-mono
        bg-gray-100 dark:bg-gray-900 dark:text-gray-100
        focus:outline-none focus:ring-1 focus:ring-primary-button-bg resize-y`}
    />
    <div className="min-h-[16px] mt-1">
      {errors[name] && touched[name] && (
        <span className="text-xs text-red-600">{errors[name]}</span>
      )}
    </div>
  </div>
);

/* ═══════════════════════════════════════
   HELPERS
═══════════════════════════════════════ */

/**
 * Parse API ColumnJson string → ReportColumn[]
 * API field          → Component field
 * ColumnName         → columnName
 * ColumnExpr         → columnexpression  ⭐
 * DisplayName        → displayName
 * DisplayOrder       → displayOrder / columnIndex
 * DefaultVisible     → isDefault
 * IsCurrency         → isCurrency
 * IsTotal            → isTotal
 * IsSort             → isSort
 * IsHidden           → isHidden
 * SortDir/SortDir    → sortDirection ("ASC"|"DSC")
 */
const parseColumnJson = (raw: string): ReportColumn[] => {
  try {
    const parsed: any[] = typeof raw === "string" ? JSON.parse(raw) : raw;
    return parsed.map((c: any, i: number) => ({
      id: i + 1,
      columnName: c.ColumnName ?? "",
      displayName: c.DisplayName ?? c.ColumnName ?? "",
      columnexpression: c.ColumnExpr ?? c.ColumnName ?? "",   // ← ColumnExpr
      displayOrder: c.DisplayOrder ?? i + 1,
      columnIndex: c.ColumnIndex ?? c.DisplayOrder ?? i + 1,
      isDefault: !!(c.DefaultVisible),
      isCurrency: !!(c.IsCurrency),
      isTotal: !!(c.IsTotal),
      isSort: !!(c.IsSort),
      isHidden: !!(c.IsHidden),
      sortDirection: (
        (c.SortDir ?? c.SortDirection ?? "ASC").toString().toUpperCase() === "DESC"
          ? "DSC"
          : "ASC"
      ) as "ASC" | "DSC",
    }));
  } catch {
    return [];
  }
};

/**
 * Serialize ReportColumn[] → ColumnJson string for API save
 * Component field      → API field
 * columnName           → ColumnName
 * columnexpression     → ColumnExpr  ⭐
 * sortDirection "DSC"  → SortDir "DESC"
 */
const serializeColumnJson = (cols: ReportColumn[]): string =>
  JSON.stringify(
    cols.map((c) => ({
      ColumnName: c.columnName,
      ColumnExpr: c.columnexpression,                         // ← columnexpression
      DisplayName: c.displayName,
      DisplayOrder: c.displayOrder,
      ColumnIndex: c.columnIndex,
      DefaultVisible: c.isDefault,
      IsCurrency: c.isCurrency,
      IsTotal: c.isTotal,
      IsHidden: c.isHidden,
      IsSort: c.isSort,
      SortDir: c.sortDirection === "DSC" ? "DESC" : "ASC",   // ← back to DESC
      TableAlias: null,
    }))
  );

/* ═══════════════════════════════════════
   PAGE COMPONENT
═══════════════════════════════════════ */
const AddReport: React.FC = () => {
  const [columns, setColumns] = useState<ReportColumn[]>([]);
  const [showColumns, setShowColumns] = useState(false);
  const { universalService } = ApiService();
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const [reportId, setReportId] = useState<number | null>(id ? Number(id) : null);
  const formikRef = useRef<any>(null);

  const initialValues: ReportFormValues = {
    reportName: "",
    procedureName: "",
    description: "",
    query: "",
  };

  /* ── Load report when editing ── */
  useEffect(() => {
    if (!id) return;
    loadReport(id);
  }, [id]);

  /* ── Reset when switching to Add mode ── */
  useEffect(() => {
    if (id) return;
    setReportId(null);
    setColumns([]);
    setShowColumns(false);
    formikRef.current?.resetForm({ values: initialValues });
  }, [id]);

  const loadReport = async (reportId: string) => {
    try {
      const payload = {
        procName: "SystemReport",
        Para: JSON.stringify({ ActionMode: "GetReportById", ReportId: reportId }),
      };
      const res = await universalService(payload);
      const result = res?.data ?? res;
      const report = Array.isArray(result) ? result[0] : result;
      if (!report) return;

      formikRef.current?.setValues({
        reportName: report.ReportName ?? "",
        procedureName: report.USPName ?? "",
        description: report.Description ?? "",
        query: report.ReportQuery ?? "",
      });

      if (report.ColumnJson) {
        const mapped = parseColumnJson(report.ColumnJson);  // ⭐ uses helper
        setColumns(mapped);
        setShowColumns(true);
      }
    } catch (e) {
      console.error("Load report failed:", e);
    }
  };

  /* ── Generate columns from query ── */
  const generateColumns = async (query: string) => {
    if (!query) { Swal.fire("Warning", "Please enter query first", "warning"); return; }

    try {
      const payload = {
        procName: "SystemReport",
        Para: JSON.stringify({ Query: encodeURIComponent(query), ActionMode: "GetFields" }),
      };
      const res = await universalService(payload);
      const result = res?.data ?? res;

      if (!Array.isArray(result)) {
        Swal.fire("Error", result?.Msg || "Query failed", "error");
        return;
      }
      if (!result.length) {
        setColumns([]);
        Swal.fire("Warning", "No fields found", "warning");
        return;
      }

      setColumns((prev) => {
        const existingMap = new Map(prev.map((c) => [c.columnName.toLowerCase(), c]));

        return result.map((c: any, i: number) => {
          const old = existingMap.get(c.name.toLowerCase());
          if (old) {
            return { ...old, id: i + 1, displayOrder: i + 1, columnIndex: c.ColumnIndex };
          }
          return {
            id: i + 1,
            columnName: c.name,
            displayName: c.name,
            columnexpression: c.name,          // default expr = column name
            displayOrder: i + 1,
            columnIndex: c.ColumnIndex,
            isDefault: true,
            isCurrency: false,
            isTotal: false,
            isSort: false,
            isHidden: false,
            sortDirection: "ASC" as const,
          };
        });
      });

      setShowColumns(true);
      Swal.fire({
        icon: "success",
        title: "Columns synced",
        text: `${result.length} columns detected`,
        timer: 1200,
        showConfirmButton: false,
      });
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to generate columns", "error");
    }
  };

  /* ── Execute query test ── */
  const executeQueryTest = async (query: string) => {
    if (!query) { Swal.fire("Warning", "Please enter query first", "warning"); return; }

    try {
      Swal.fire({ title: "Executing...", allowOutsideClick: false, didOpen: () => Swal.showLoading() });

      const payload = {
        procName: "SystemReport",
        Para: JSON.stringify({ ActionMode: "TestQuery", Query: encodeURIComponent(query) }),
      };
      const res = await universalService(payload);
      const data = res?.data ?? res;

      if (Array.isArray(data) && data.length) {
        const preview = data.slice(0, 2);
        const cols = Object.keys(preview[0] || {});
        const tableHtml = `
          <div style="max-height:250px;overflow:auto">
            <table style="width:100%;border-collapse:collapse;font-size:12px">
              <thead><tr>${cols.map((c) => `<th style="border:1px solid #ddd;padding:6px;background:#f3f4f6">${c}</th>`).join("")}</tr></thead>
              <tbody>${preview.map((row) => `<tr>${cols.map((c) => `<td style="border:1px solid #ddd;padding:6px">${row[c] ?? ""}</td>`).join("")}</tr>`).join("")}</tbody>
            </table>
          </div>`;
        Swal.fire({ icon: "success", title: "Query OK", html: `<div>Returned <b>${data.length}</b> rows</div>${tableHtml}`, width: 700 });
      } else {
        Swal.fire("Info", "Query executed but returned no rows.", "info");
      }
    } catch (e) {
      console.error(e);
      Swal.fire("Error", "Execution failed", "error");
    }
  };

  /* ── Fetch query from procedure ── */
  const fetchProcedureQuery = async (procedureName: string, setFieldValue: any) => {
    if (!procedureName) return;
    const cleanProcName = procedureName.startsWith("USP_")
      ? procedureName.replace(/^USP_/, "")
      : procedureName;

    try {
      const payload = {
        procName: cleanProcName,
        Para: JSON.stringify({ IsFetchReportColumn: 1 }),
      };
      const res = await universalService(payload);
      const data = res?.data ?? res;
      const query = data?.[0]?.Query;
      if (query) setFieldValue("query", query);
    } catch (e) {
      console.error("Dynamic query fetch failed:", e);
    }
  };

  /* ── Save / update ── */
  const saveReportWithColumns = async (values: ReportFormValues) => {
    if (!columns.length) {
      Swal.fire("Warning", "Generate columns first", "warning");
      return;
    }

    const confirm = await Swal.fire({
      title: reportId ? "Update report?" : "Create report?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, Save",
      cancelButtonText: "Cancel",
    });
    if (!confirm.isConfirmed) return;

    try {
      Swal.fire({ title: "Saving...", allowOutsideClick: false, didOpen: () => Swal.showLoading() });

      const payload = {
        procName: "SystemReport",
        Para: JSON.stringify({
          ActionMode: reportId ? "SaveColumnsBulk" : "Insert",
          ReportId: reportId || 0,
          IsActive: true,
          ReportName: values.reportName,
          Description: values.description,
          Query: values.query,
          EntryBy: 1,
          USPName: values.procedureName,
          ColumnJson: serializeColumnJson(columns),   // ⭐ uses helper
        }),
      };

      const res = await universalService(payload);
      const data = res?.data ?? res;
      const response = Array.isArray(data) ? data[0] : data;

      if (response?.Status === 1 || response?.Status === "1") {
        if (!reportId && response?.ReportId) setReportId(response.ReportId);

        await Swal.fire({
          icon: "success",
          title: "Success",
          text: response?.Message || "Report saved successfully",
          confirmButtonText: "OK",
        });
      } else {
        Swal.fire("Error", response?.Message || "Save failed", "error");
      }
    } catch (e) {
      console.error("Save report failed:", e);
      Swal.fire("Error", "Server error occurred", "error");
    }
  };

  const handleSubmit = async (values: ReportFormValues, helpers: FormikHelpers<ReportFormValues>) => {
    await saveReportWithColumns(values);
    helpers.setSubmitting(false);
  };

  /* ═══════════════════════════════════════
     RENDER
  ═══════════════════════════════════════ */
  return (
    <div className="trezo-card bg-white dark:bg-[#0c1427] mb-[25px] p-[20px] md:p-[25px] rounded-2xl shadow-sm">

      {/* HEADER */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-700 mb-6 -mx-[20px] md:-mx-[25px] px-[20px] md:px-[25px]">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/superadmin/mlm-setting/manage-report")}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 dark:hover:text-white transition"
          >
            <i className="material-symbols-outlined text-[18px]">arrow_back</i>
          </button>
          <h5 className="font-bold text-xl text-black dark:text-white !mb-0">
            {id ? "Edit Report" : "Create Report"}
          </h5>
        </div>

        <button
          type="submit"
          form="reportForm"
          className="px-6 py-2 bg-primary-button-bg hover:bg-primary-button-bg-hover text-white rounded-lg text-sm font-medium transition"
        >
          {id ? "Update Report" : "Add Report"}
        </button>
      </div>

      {/* FORM */}
      <Formik
        innerRef={formikRef}
        initialValues={initialValues}
        validationSchema={schema}
        onSubmit={handleSubmit}
      >
        {({ values, handleChange, handleSubmit, errors, touched, setFieldValue }) => (
          <form id="reportForm" onSubmit={handleSubmit} className="space-y-4">

            <div className="grid md:grid-cols-2 gap-5">

              {/* Report Name */}
              <InputField
                label={<>Report Name <span className="text-red-500">*</span></>}
                name="reportName"
                placeholder="Enter report name"
                values={values}
                handleChange={handleChange}
                errors={errors}
                touched={touched}
              />

              {/* Procedure Name + Get Query */}
              <div className="flex flex-col">
                <label className="text-sm text-gray-700 dark:text-gray-300 mb-1">
                  Procedure Name <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    name="procedureName"
                    placeholder="e.g. USP_CountryMaster"
                    value={values.procedureName || ""}
                    onChange={handleChange}
                    className={`${bigInputClasses} flex-1`}
                  />
                  <button
                    type="button"
                    onClick={() => fetchProcedureQuery(values.procedureName, setFieldValue)}
                    className="px-4 h-10 rounded-md text-sm font-medium bg-primary-button-bg hover:bg-primary-button-bg-hover text-white whitespace-nowrap transition"
                  >
                    Get Query
                  </button>
                </div>
                <div className="min-h-[16px] mt-1">
                  {errors.procedureName && touched.procedureName && (
                    <span className="text-xs text-red-600">{errors.procedureName}</span>
                  )}
                </div>
              </div>

            </div>

            {/* Description */}
            <InputField
              label="Description"
              name="description"
              placeholder="Short description"
              values={values}
              handleChange={handleChange}
              errors={errors}
              touched={touched}
            />

            {/* Query */}
            <TextareaField
              label={<>Query <span className="text-red-500">*</span></>}
              name="query"
              placeholder="SQL Query (auto-filled via Get Query)"
              values={values}
              handleChange={handleChange}
              errors={errors}
              touched={touched}
            />

            {/* Action buttons */}
            <div className="flex flex-wrap gap-3 pt-1">
              <button
                type="button"
                onClick={() => generateColumns(values.query)}
                className="px-5 py-2 rounded-lg text-sm font-medium bg-primary-button-bg hover:bg-primary-button-bg-hover text-white transition"
              >
                Generate Columns
              </button>
              <button
                type="button"
                onClick={() => executeQueryTest(values.query)}
                className="px-5 py-2 rounded-lg text-sm font-medium bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition"
              >
                Execute Query
              </button>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(values.query);
                  Swal.fire({ icon: "success", title: "Copied", text: "Query copied to clipboard", timer: 1000, showConfirmButton: false });
                }}
                className="px-5 py-2 rounded-lg text-sm font-medium bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition"
              >
                Copy Query
              </button>
            </div>

          </form>
        )}
      </Formik>

      {/* COLUMNS CONFIG */}
      {showColumns && (
        <ReportColumnsConfig columns={columns} setColumns={setColumns} />
      )}

    </div>
  );
};

export default AddReport;
