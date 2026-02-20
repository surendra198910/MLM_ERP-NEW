import React, { useState, useEffect } from "react";
import { ApiService } from "../../../../services/ApiService";
import DataTable from "react-data-table-component";
import ColumnSelector from "../ColumnSelector/ColumnSelector";
import CustomPagination from "../../../../components/CommonFormElements/Pagination/CustomPagination";
const Template: React.FC = () => {
  const [searchInput, setSearchInput] = useState("");
  const [filterColumn, setFilterColumn] = useState("");
  const [showTable, setShowTable] = useState(false); // Toggle to show 'Oops' or 'Welcome'
  const { universalService } = ApiService();
  const [columns, setColumns] = useState<any[]>([]);
  const [data, setData] = useState([]);
  const [totalRows, setTotalRows] = useState(0);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [sortIndex, setSortIndex] = useState(1);
  const [sortDirection, setSortDirection] = useState("ASC");
  const [visibleColumns, setVisibleColumns] = useState<any[]>([]);
  const [columnsReady, setColumnsReady] = useState(false);
  const [refreshGrid, setRefreshGrid] = useState(0);
  const handleSort = (column: any, direction: string) => {
    console.log("Sorted Column:", column);

    setSortIndex(column.columnIndex); // 1,2,3,4...
    setSortDirection(direction.toUpperCase());
  };
  const handlePageChange = (page) => {
    setPage(page);
  };
  const handlePerRowsChange = (newPerPage, page) => {
    setPerPage(newPerPage);
    setPage(page);
  };
  const fetchGridColumns = async () => {
    const saved = localStorage.getItem("EmployeeDetails");
    const employeeId = saved ? JSON.parse(saved).EmployeeId : 0;
    try {
      const payload = {
        procName: "GetUserGridColumns",
        Para: JSON.stringify({
          UserId: employeeId,
          GridName: "USP_FetchROIIncome",
        }),
      };

      const res = await universalService(payload);
      const data = res?.data || res;

      if (Array.isArray(data)) {
        const reactCols = data
          .filter((c: any) => c.IsVisible === true)
          .sort((a: any, b: any) => a.ColumnOrder - b.ColumnOrder)
          .map((c: any, index: number) => ({
            id: index + 1, // ✅ IMPORTANT FOR DATATABLE
            name: c.DisplayName,
            selector: (row: any) => row[c.ColumnKey],
            sortable: true,
            columnKey: c.ColumnKey,
            columnIndex: index + 1, // ✅ THIS WILL MATCH SELECT ORDER
          }));
        const actionColumn = {
          name: "Action",
          cell: (row) => (
            <div className="flex gap-2">
              <button onClick={() => handleEdit(row)}>✏️</button>
              <button onClick={() => handleDelete(row)}>🗑️</button>
            </div>
          ),
          ignoreRowClick: true,
          button: true,
        };

        setColumns([...reactCols, actionColumn]);
      } else {
        setColumns([]);
      }
    } catch (err) {
      console.error("Grid columns fetch failed", err);
      setColumns([]);
    }
  };
  const handleEdit = (row) => {
    console.log("Edit Row:", row.TotalRecords);
    // open modal or navigate
  };

  const handleDelete = (row) => {
    if (confirm(`Delete ${row.UserName}?`)) {
      console.log("Delete Row:", row);
      // call API delete
    }
  };
  const fetchGridData = async () => {
    try {
      const payload = {
        procName: "FetchROIIncome", // your SP name OR MLMSP
        Para: JSON.stringify({
          SearchBy: filterColumn,
          Criteria: searchInput,
          Page: page,
          PageSize: perPage,
          SortIndex: sortIndex,
          SortDir: sortDirection,
        }),
      };

      const res = await universalService(payload);
      const result = res?.data || res;
      if (result?.rows && Array.isArray(result.rows)) {
        setData(result.rows);
        setTotalRows(result[0]?.TotalRecords || 0);
      } else if (Array.isArray(result)) {
        // fallback if backend returns only data rows
        setData(result);
        setTotalRows(result[0]?.TotalRecords || 0);
      } else {
        setData([]);
        setTotalRows(0);
      }
    } catch (err) {
      console.error("Grid data fetch failed", err);
      setData([]);
      setTotalRows(0);
    }
  };
  const fetchVisibleColumns = async () => {
    const saved = localStorage.getItem("EmployeeDetails");
    const employeeId = saved ? JSON.parse(saved).EmployeeId : 0;
    const payload = {
      procName: "UniversalColumnSelector",
      Para: JSON.stringify({
        EmployeeId: employeeId,
        USPName: "USP_FetchROIIncome",
        ActionMode: "List",
        Mode: "Get",
      }),
    };
    const response = await universalService(payload);
    const cols = response?.data ?? response;
    if (Array.isArray(cols)) {
      setVisibleColumns(
        cols
          .map((c) => ({
            ...c,
            IsVisible:
              c.IsVisible === true || c.IsVisible === 1 || c.IsVisible === "1",
            IsHidden:
              c.IsHidden === false || c.IsHidden === 0 || c.IsHidden === "0",
          }))
          .sort((a, b) => a.DisplayOrder - b.DisplayOrder),
      );
      setColumnsReady(true);
      setRefreshGrid((prev) => prev + 1);
    }
  };
  useEffect(() => {
    fetchGridColumns();
  }, [refreshGrid]);
  useEffect(() => {
    if (columns.length > 0) {
      fetchGridData();
    }
  }, [columns, page, perPage, sortIndex, sortDirection, refreshGrid]);
  const applySearch = () => {
    fetchGridData();
  };

  const resetSearch = () => {
    setShowTable(false);
    setSearchInput("");
    setFilterColumn("__NONE__");
  };
  const customStyles = {
    headRow: {
      style: {
        backgroundColor: "primar-table-bg",
        minHeight: "45px",
      },
    },
    headCells: {
      style: {
        padding: "11px 20px",
        fontWeight: 600,
        color: "var(--primary-table-text)",
        cursor: "pointer",
        whiteSpace: "nowrap",
        backgroundColor: "var(--primary-table-bg)",
        borderBottom: "1px solid var(--primary-table-bg-hover)",
      },
    },
    rows: {
      style: {
        minHeight: "42px",
      },
    },
    cells: {
      style: {
        padding: "10px 20px",
      },
    },
  };
  return (
    <div className="trezo-card bg-white dark:bg-[#0c1427] mb-[25px] p-[20px] md:p-[25px] rounded-md">
      {/* --- HEADER & SEARCH SECTION --- */}
      <div className="trezo-card-header mb-[10px] md:mb-[10px] sm:flex items-center justify-between pb-5 border-b border-gray-200 -mx-[20px] md:-mx-[25px] px-[20px] md:px-[25px]">
        <div className="trezo-card-title">
          <h5 className="!mb-0 font-bold text-xl text-black dark:text-white">
            Manage Template
          </h5>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3 sm:w-auto w-full">
          <div className="flex flex-col sm:flex-row items-center gap-3 flex-wrap justify-end">
            {/* 1. Filter Dropdown (Exactly from your design) */}
            <div className="relative w-full sm:w-[180px]">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 flex items-center pointer-events-none text-gray-500">
                <i className="material-symbols-outlined !text-[18px]">
                  filter_list
                </i>
              </span>
              <select
                value={filterColumn}
                onChange={(e) => setFilterColumn(e.target.value)}
                className="w-full h-[34px] pl-8 pr-8 text-xs rounded-md appearance-none outline-none border border-gray-300 dark:border-[#172036] bg-white dark:bg-[#0c1427] text-black dark:text-white transition-all focus:border-primary-button-bg"
              >
                <option value="__NONE__">Select Filter Option</option>
                <option value="Username">Username</option>
              </select>
              <span className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center pointer-events-none text-gray-400">
                <i className="material-symbols-outlined !text-[18px]">
                  expand_more
                </i>
              </span>
            </div>

            {/* 2. Search Input (Exactly from your design) */}
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 flex items-center pointer-events-none text-gray-500">
                <i className="material-symbols-outlined !text-[18px]">search</i>
              </span>
              <input
                type="text"
                value={searchInput}
                placeholder="Enter Criteria..."
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && applySearch()}
                className="h-[34px] w-full pl-8 pr-3 text-xs rounded-md outline-none border border-gray-300 dark:border-[#172036] bg-white dark:bg-[#0c1427] text-black dark:text-white focus:border-primary-button-bg transition-all"
              />
            </div>

            {/* 3. BUTTONS GROUP (Exactly from your design) */}
            <div className="flex items-center gap-2">
              {/* SEARCH BUTTON */}
              <button
                type="button"
                onClick={applySearch}
                className="w-[34px] h-[34px] flex items-center justify-center rounded-md border border-primary-button-bg text-primary-button-bg hover:bg-primary-button-bg hover:text-white transition-all shadow-sm"
              >
                <i className="material-symbols-outlined text-[20px]">search</i>
              </button>

              {/* COLUMN SELECTOR BUTTON */}

              <div
                className={`h-[34px] flex items-center "pointer-events-none opacity-50"}`}
              >
                <ColumnSelector
                  procName="USP_FetchROIIncome"
                  onApply={fetchVisibleColumns}
                />
              </div>

              {/* ADD BUTTON */}
              <button
                type="button"
                className="w-[34px] h-[34px] flex items-center justify-center rounded-md border border-white text-white bg-primary-button-bg hover:bg-white hover:border-primary-button-bg hover:text-primary-button-bg transition-all shadow-sm"
              >
                <i className="material-symbols-outlined text-[20px]">add</i>
              </button>

              {/* REFRESH BUTTON (Visible when showTable is true) */}
              {showTable && (
                <button
                  type="button"
                  onClick={resetSearch}
                  className="w-[34px] h-[34px] flex items-center justify-center rounded-md border border-gray-400 text-gray-500 hover:bg-gray-100 transition-all"
                >
                  <i className="material-symbols-outlined text-[20px]">
                    refresh
                  </i>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* --- CONTENT CONTAINER --- */}
      <div className="trezo-card-content -mx-[20px] md:-mx-[25px]">
        <DataTable
          title=""
          columns={columns}
          data={data}
          customStyles={customStyles}
          pagination
          paginationServer
          paginationTotalRows={totalRows}
          paginationComponent={(props) => (
            <CustomPagination {...props} currentPage={page} />
          )}
          onChangePage={handlePageChange}
          onChangeRowsPerPage={handlePerRowsChange}
          onSort={handleSort}
          sortServer
          defaultSortFieldId={1}
        />
      </div>
    </div>
  );
};

export default Template;
