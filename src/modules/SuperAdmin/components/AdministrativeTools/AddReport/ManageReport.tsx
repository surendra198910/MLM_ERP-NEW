"use client";

import React, { useEffect, useState } from "react";
import { ApiService } from "../../../../../services/ApiService";
import DataTable from "react-data-table-component";
import customStyles from "../../../../../components/CommonFormElements/DataTableComponents/CustomStyles";
import TableSkeleton from "../../Forms/TableSkeleton";
import OopsNoData from "../../../../../components/CommonFormElements/DataNotFound/OopsNoData";
import { useNavigate } from "react-router-dom";

const ManageReports: React.FC = () => {
  const { universalService } = ApiService();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchReports = async () => {
    try {
      setLoading(true);

      const payload = {
        procName: "SystemReport",
        Para: JSON.stringify({
          ActionMode: "GetAllReports",
        }),
      };

      const res = await universalService(payload);
      const result = res?.data ?? res ?? [];

      setData(Array.isArray(result) ? result : []);
    } catch (e) {
      console.error("Fetch reports failed", e);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleEdit = (row: any) => {
    navigate(`/superadmin/mlm-setting/add-report/${row.ReportId}`);
  };

  const columns = [
    {
      name: "Report Id",
      selector: (row: any) => row.ReportId,
      sortable: true,
      width: "110px",
    },
    {
      name: "Report Name",
      selector: (row: any) => row.ReportName,
      sortable: true,
      grow: 2,
    },
    {
      name: "Description",
      selector: (row: any) => row.Description,
      grow: 3,
    },
    {
      name: "Columns",
      selector: (row: any) => row.TotalColumns,
      width: "120px",
      sortable: true,
    },
    {
      name: "Created",
      selector: (row: any) =>
        row.EntryDate ? new Date(row.EntryDate).toLocaleDateString() : "",
      width: "140px",
    },
    {
      name: "Action",
      cell: (row: any) => (
        <button
          onClick={() => handleEdit(row)}
          className="px-3 py-1 text-xs bg-primary-button-bg text-white rounded"
        >
          Edit
        </button>
      ),
      ignoreRowClick: true,
      button: true,
      width: "120px",
    },
  ];

  return (
    <div className="trezo-card bg-white dark:bg-[#0f172a] p-6 rounded-lg">
      <div className="trezo-card-header mb-[10px] sm:flex items-center justify-between pb-5 border-b border-gray-200 dark:border-gray-700 -mx-[20px] md:-mx-[21px] px-[20px] md:px-[25px]">

        {/* TITLE */}
        <div className="trezo-card-title">
          <h5 className="!mb-0 font-bold text-xl text-black dark:text-white">
            Manage Reports
          </h5>
        </div>

        {/* RIGHT ACTIONS */}
        <div className="flex items-center gap-2 mt-3 sm:mt-0">

          {/* CREATE */}
          <button
            onClick={() => navigate("/superadmin/mlm-setting/add-report")}
            className="w-[34px] h-[34px] flex items-center justify-center rounded-md border border-primary-button-bg text-white bg-primary-button-bg hover:bg-white hover:text-primary-button-bg transition-all shadow-sm"
            title="Create Report"
          >
            <i className="material-symbols-outlined text-[20px]">add</i>
          </button>
         
        </div>
      </div>

      <DataTable
        columns={columns}
        data={data}
        customStyles={customStyles}
        progressPending={loading}
        progressComponent={<TableSkeleton rows={8} columns={6} />}
        noDataComponent={!loading && <OopsNoData />}
        pagination
      />
    </div>
  );
};

export default ManageReports;