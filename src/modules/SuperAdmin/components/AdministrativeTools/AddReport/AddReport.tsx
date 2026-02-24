"use client";

import React, { useState } from "react";
import Swal from "sweetalert2";
import { Formik } from "formik";
import type { FormikHelpers } from "formik";
import * as Yup from "yup";
import ReportColumnsConfig from "./ReportColumnsConfig";
import type { ReportColumn } from "./ReportColumnsConfig";
import { ApiService } from "../../../../../services/ApiService";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useRef } from "react";
/* ================= TYPES ================= */

interface ReportFormValues {
  reportName: string;
  procedureName: string;
  description: string;
  query: string;
}

/* ================= VALIDATION ================= */

const schema: Yup.ObjectSchema<ReportFormValues> = Yup.object({
  reportName: Yup.string().required("Report name required"),
  procedureName: Yup.string().required("Procedure name required"),
  description: Yup.string(),
  query: Yup.string().required("Query required"),
});
const bigInputClasses =
  "w-full border border-gray-300 dark:border-gray-700 rounded-md px-3 py-2 text-sm h-10 " +
  "placeholder-gray-400 focus:outline-none focus:border-primary-button-bg focus:ring-1 focus:ring-primary-button-bg transition-all " +
  "bg-white dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500";
const InputField = ({
  label,
  name,
  placeholder,
  values,
  handleChange,
  errors,
  touched,
}: any) => (
  <div className="flex flex-col dark:text-gray-100">

    <label className="text-sm text-gray-700 dark:text-gray-300 mb-1">
      {label}
    </label>

    <input
      name={name}
      placeholder={placeholder}
      value={values[name] || ""}
      onChange={handleChange}
      className={`${bigInputClasses} ${errors[name] && touched[name]
        ? "border-red-500 focus:ring-red-500"
        : ""
        }`}
    />

    {/* reserve error space */}
    <div className="min-h-[16px] mt-1">
      {errors[name] && touched[name] && (
        <span className="text-xs text-red-600">
          {errors[name]}
        </span>
      )}
    </div>
  </div>
);
const TextareaField = ({
  label,
  name,
  placeholder,
  values,
  handleChange,
  errors,
  touched,
}: any) => (
  <div className="flex flex-col">

    <label className="text-sm text-gray-700 dark:text-gray-300 mb-1">
      {label}
    </label>

    <textarea
      name={name}
      placeholder={placeholder}
      value={values[name] || ""}
      onChange={handleChange}
      rows={10}
      className={`w-full border border-gray-300 dark:border-gray-700 rounded-md px-3 py-3 text-sm
      bg-white dark:bg-gray-800 dark:text-gray-100
      focus:outline-none focus:ring-1 focus:ring-primary-button-bg ${errors[name] && touched[name]
          ? "border-red-500 focus:ring-red-500"
          : ""
        }`}
    />

    <div className="min-h-[16px] mt-1">
      {errors[name] && touched[name] && (
        <span className="text-xs text-red-600">
          {errors[name]}
        </span>
      )}
    </div>
  </div>
);

/* ================= PAGE ================= */

const AddReport: React.FC = () => {
  const [columns, setColumns] = useState<ReportColumn[]>([]);
  const [showColumns, setShowColumns] = useState(false);
  const { universalService } = ApiService();
  const navigate = useNavigate();
  const { id } = useParams();
  const [reportId, setReportId] = useState<number | null>(id ? Number(id) : null);
  const initialValues: ReportFormValues = {
    reportName: "",
    procedureName: "",
    description: "",
    query: "",
  };

  const handleSubmit = async (
    values: ReportFormValues,
    helpers: FormikHelpers<ReportFormValues>
  ) => {
    await saveReportWithColumns(values);
    helpers.setSubmitting(false);
  };
  const generateColumns = async (query: string) => {
    if (!query) {
      Swal.fire("Warning", "Please enter query first", "warning");
      return;
    }

    try {
      const payload = {
        procName: "SystemReport",
        Para: JSON.stringify({
          Query: encodeURIComponent(query),
          ActionMode: "GetFields",
        }),
      };

      const res = await universalService(payload);
      const result = res?.data ?? res;

      // ❌ SQL error
      if (!Array.isArray(result)) {
        Swal.fire("Error", result?.Msg || "Query failed", "error");
        return;
      }

      if (result.length === 0) {
        setColumns([]);
        Swal.fire("Warning", "No fields found", "warning");
        return;
      }

      // ⭐ IMPORTANT → merge with existing columns
      setColumns(prev => {
        const existingMap = new Map(
          prev.map(c => [c.columnName.toLowerCase(), c])
        );

        const merged: ReportColumn[] = result.map((c: any, i: number) => {
          const old = existingMap.get(c.name.toLowerCase());

          if (old) {
            return {
              ...old, // ⭐ keeps isCurrency / isTotal / isDefault
              id: i + 1,
              displayOrder: i + 1,
            };
          }

          return {
            id: i + 1,
            columnName: c.name,
            displayName: c.name,
            displayOrder: i + 1,
            isDefault: true,
            isCurrency: false,
            isTotal: false,
          };
        });

        return merged;
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
      cancelButtonText: "Cancel"
    });

    if (!confirm.isConfirmed) return;

    try {
      // 🔵 loader
      Swal.fire({
        title: "Saving...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });

      const actionMode = reportId ? "SaveColumnsBulk" : "Insert";

      const payload = {
        procName: "SystemReport",
        Para: JSON.stringify({
          ActionMode: actionMode,
          ReportId: reportId || 0,
          ReportName: values.reportName,
          Description: values.description,
          Query: values.query,
          EntryBy: 1,
          USPName: values.procedureName,

          ColumnJson: JSON.stringify(
            columns.map(c => ({
              ColumnName: c.columnName,
              ColumnExpr: c.columnName,
              DisplayName: c.displayName,
              DisplayOrder: c.displayOrder,
              IsHidden: !c.isDefault,
              DefaultVisible: c.isDefault,
              IsCurrency: c.isCurrency,
              IsTotal: c.isTotal,
              TableAlias: null
            }))
          )
        })
      };

      const res = await universalService(payload);
      const data = res?.data ?? res;

      // ⭐ backend returns {Status, Message, ReportId}
      const response = Array.isArray(data) ? data[0] : data;

      if (response?.Status === 1 || response?.Status === "1") {

        if (!reportId && response?.ReportId) {
          setReportId(response.ReportId);
        }

        await Swal.fire({
          icon: "success",
          title: "Success",
          text: response?.Message || "Report saved successfully",
          confirmButtonText: "OK"
        });

        // ⭐ redirect after success
        navigate("/superadmin/mlm-setting/manage-report");

      } else {
        Swal.fire("Error", response?.Message || "Save failed", "error");
      }

    } catch (e) {
      console.error("Save report failed:", e);
      Swal.fire("Error", "Server error occurred", "error");
    }
  };
  const executeQueryTest = async (query: string) => {

    if (!query) {
      Swal.fire("Warning", "Please enter query first", "warning");
      return;
    }

    try {
      Swal.fire({
        title: "Executing...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });

      const payload = {
        procName: "SystemReport",
        Para: JSON.stringify({
          ActionMode: "TestQuery",
          Query: encodeURIComponent(query)
        })
      };

      const res = await universalService(payload);
      const data = res?.data ?? res;

      /* ⭐ STATUS RESPONSE */
      if (Array.isArray(data) && data[0]?.Status !== undefined) {

        const response = data[0];

        if (response.Status === 1 || response.Status === "1") {
          Swal.fire("Success", response.Message || "Query executed", "success");
        } else {
          Swal.fire("Error", response.Message || "Query failed", "error");
        }
        return;
      }

      /* ⭐ ROWS PREVIEW */
      if (Array.isArray(data)) {

        const preview = data.slice(0, 2);
        const columns = Object.keys(preview[0] || {});

        const tableHtml = `
        <div style="max-height:250px;overflow:auto">
          <table style="width:100%;border-collapse:collapse;font-size:12px">
            <thead>
              <tr>
                ${columns.map(c => `
                  <th style="border:1px solid #ddd;padding:6px;background:#f3f4f6">${c}</th>
                `).join("")}
              </tr>
            </thead>
            <tbody>
              ${preview.map(row => `
                <tr>
                  ${columns.map(c => `
                    <td style="border:1px solid #ddd;padding:6px">${row[c] ?? ""}</td>
                  `).join("")}
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      `;

        Swal.fire({
          icon: "success",
          title: "Query OK",
          html: `
          <div>Returned <b>${data.length}</b> rows</div>
          ${tableHtml}
        `,
          width: 700
        });

        return;
      }

    } catch (e) {
      console.error(e);
      Swal.fire("Error", "Execution failed", "error");
    }
  };
  useEffect(() => {
    if (!id) return;

    const loadReport = async () => {
      try {
        const payload = {
          procName: "SystemReport",
          Para: JSON.stringify({
            ActionMode: "GetReportById",
            ReportId: id
          })
        };

        const res = await universalService(payload);
        const result = res?.data ?? res;

        if (!Array.isArray(result) || !result.length) return;

        const report = result[0];

        if (formikRef.current) {
          formikRef.current.setValues({
            reportName: report.ReportName,
            procedureName: report.USPName,
            description: report.Description,
            query: report.ReportQuery
          });
        }

        const cols = report.ColumnJson
          ? JSON.parse(report.ColumnJson)
          : [];

        const mapped: ReportColumn[] = cols.map((c: any, i: number) => ({
          id: i + 1,
          columnName: c.ColumnName,
          displayName: c.DisplayName,
          displayOrder: c.DisplayOrder,
          isDefault: c.DefaultVisible,
          isCurrency: c.IsCurrency,
          isTotal: c.IsTotal
        }));

        setColumns(mapped);
        setShowColumns(true);
      } catch (e) {
        console.error("Load report failed", e);
      }
    };

    loadReport();
  }, [id]);
  useEffect(() => {
    if (id) return; // only when ADD mode

    setReportId(null);
    setColumns([]);
    setShowColumns(false);

    if (formikRef.current) {
      formikRef.current.resetForm({
        values: {
          reportName: "",
          procedureName: "",
          description: "",
          query: ""
        }
      });
    }
  }, [id]);
  const formikRef = useRef<any>(null);
  return (
    <div className="trezo-card bg-white dark:bg-[#0c1427] mb-[25px] p-[20px] md:p-[25px] rounded-2xl shadow-sm">

      {/* HEADER */}
      <div className="flex items-center justify-between pb-2 border-b border-gray-200 dark:border-gray-700 mb-6 px-9 -mx-7">
        <h5 className="font-bold text-xl text-black dark:text-white">
          {id ? "Edit Report" : "Create Report"}
        </h5>
        <div className="pb-3">
          <button
            type="submit"
            form="reportForm"
            className="px-6 py-2 bg-primary-button-bg hover:bg-primary-button-bg-hover
          text-white rounded-lg text-sm font-medium transition"
          >
            {id ? "Edit Report" : "Create Report"}
          </button>
        </div>
      </div>

      <Formik
        innerRef={formikRef}
        initialValues={initialValues}
        validationSchema={schema}
        onSubmit={handleSubmit}
      >
        {({
          values,
          handleChange,
          handleSubmit,
          errors,
          touched,
        }) => (
          <form id="reportForm" onSubmit={handleSubmit} className="space-y-1">

            {/* GRID */}
            <div className="grid md:grid-cols-2 gap-5">

              {/* REPORT NAME */}
              <InputField
                label={
                  <>
                    Report Name<span className="text-red-500">*</span>
                  </>
                }
                name="reportName"
                placeholder="Enter report name"
                values={values}
                handleChange={handleChange}
                errors={errors}
                touched={touched}
              />
              {/* PROCEDURE NAME */}
              <InputField
                label={
                  <>
                    Procedure Name<span className="text-red-500">*</span>
                  </>
                }
                name="procedureName"
                placeholder="Enter procedure name"
                values={values}
                handleChange={handleChange}
                errors={errors}
                touched={touched}
              />

            </div>

            {/* DESCRIPTION */}
            <InputField
              label="Description"
              name="description"
              placeholder="Enter description"
              values={values}
              handleChange={handleChange}
              errors={errors}
              touched={touched}
            />

            {/* QUERY */}
            <TextareaField
              label={
                <>
                  Query<span className="text-red-500">*</span>
                </>
              }
              name="query"
              placeholder="Write SQL Query"
              values={values}
              handleChange={handleChange}
              errors={errors}
              touched={touched}
            />

            {/* ACTION BUTTONS */}
            <div className="flex flex-wrap gap-3 pt-2">

              <button
                type="button"
                onClick={() => generateColumns(values.query)}
                className="px-5 py-2 rounded-lg text-sm font-medium
  bg-primary-button-bg hover:bg-primary-button-bg-hover
  text-white transition"
              >
                Generate Columns
              </button>

              <button
                type="button"
                onClick={() => executeQueryTest(values.query)}
                className="px-5 py-2 rounded-lg text-sm font-medium
bg-gray-200 dark:bg-gray-700
hover:bg-gray-300 dark:hover:bg-gray-600
transition"
              >
                Execute Query
              </button>

              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(values.query);
                  Swal.fire("Copied", "Query copied", "success");
                }}
                className="px-5 py-2 rounded-lg text-sm font-medium
                bg-gray-200 dark:bg-gray-700
                hover:bg-gray-300 dark:hover:bg-gray-600
                transition"
              >
                Copy Query
              </button>

            </div>

            {/* <p className="text-xs text-gray-400">
              Global Parameters: @CompanyId, @EmployeeId
            </p> */}

          </form>
        )}
      </Formik>
      {showColumns && (
        <ReportColumnsConfig
          columns={columns}
          setColumns={setColumns}
        />
      )}
    </div>
  );
};

export default AddReport;